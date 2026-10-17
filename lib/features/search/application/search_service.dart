import 'dart:async';
import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:inbox_companion/core/logging/app_logger.dart';
import 'package:inbox_companion/data/api/inbox_companion_api_client.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:inbox_companion/data/models/participant_model.dart';
import 'package:inbox_companion/features/search/domain/search_query.dart';

class SearchService {
  SearchService({
    required this.db,
    required this.apiClient,
    FlutterSecureStorage? secureStorage,
    IAppLogger? logger,
  }) : _secureStorage = secureStorage ?? const FlutterSecureStorage(),
       _logger = logger ?? AppLogger();

  final AppDatabase db;
  final IInboxCompanionApiClient apiClient;
  final FlutterSecureStorage _secureStorage;
  final IAppLogger _logger;

  static const String _kRecentSearchesKey = 'search_recent_queries_json';

  /// Performs instant local search from Drift and merges with remote API results
  Future<List<Thread>> search({
    required String rawQuery,
    String? accountId,
  }) async {
    final query = SearchQuery.parse(rawQuery);
    if (query.isEmpty) return const [];

    _logger.info('Executing search for query: "$rawQuery"');

    // 1. Local Drift Search
    final localResults = await _executeLocalSearch(query, accountId: accountId);

    // 2. Save query to recent searches
    await saveRecentSearch(rawQuery.trim());

    // 3. Remote Server Search (Merge and Deduplicate)
    try {
      final remoteResponse = await apiClient.searchAll(query: rawQuery);

      final mergedMap = <String, Thread>{};

      // Put remote threads first
      for (final rt in remoteResponse.threads) {
        mergedMap[rt.id] = Thread(
          id: rt.id,
          accountId: rt.accountId,
          subject: rt.subject,
          snippet: rt.snippet,
          unread: rt.isUnread,
          starred: rt.isStarred,
          archived: false,
          trashed: false,
          spam: false,
          hasAttachments: rt.hasAttachments,
          lastMessageTimestamp:
              DateTime.tryParse(rt.lastMessageAt) ?? DateTime.now(),
          messageCount: rt.messageCount,
          participantsJson: jsonEncode(
            rt.participants.map((ParticipantModel p) => p.toJson()).toList(),
          ),
          labelIdsJson: jsonEncode(rt.labelIds),
        );
      }

      // Local results override remote to preserve local optimistic updates
      for (final lt in localResults) {
        mergedMap[lt.id] = lt;
      }

      final mergedList = mergedMap.values.toList();
      mergedList.sort(
        (a, b) => b.lastMessageTimestamp.compareTo(a.lastMessageTimestamp),
      );
      return mergedList;
    } catch (e) {
      _logger.warning('Remote search fallback to local-only: $e');
      return localResults;
    }
  }

  Future<List<Thread>> _executeLocalSearch(
    SearchQuery query, {
    String? accountId,
  }) async {
    final q = db.select(db.threads);

    q.where((t) {
      final conditions = <Expression<bool>>[];

      // Account filter
      if (accountId != null && accountId.isNotEmpty && accountId != 'all') {
        conditions.add(t.accountId.equals(accountId));
      }

      // Free text match on subject or snippet
      if (query.freeText.isNotEmpty) {
        final textPattern = '%${query.freeText}%';
        conditions.add(
          t.subject.like(textPattern) | t.snippet.like(textPattern),
        );
      }

      // Sender / Participant match
      if (query.from != null && query.from!.isNotEmpty) {
        conditions.add(t.participantsJson.like('%${query.from}%'));
      }

      // Attachment filter
      if (query.hasAttachment == true) {
        conditions.add(t.hasAttachments.equals(true));
      }

      // Unread filter
      if (query.isUnread != null) {
        conditions.add(t.unread.equals(query.isUnread!));
      }

      // Starred filter
      if (query.isStarred != null) {
        conditions.add(t.starred.equals(query.isStarred!));
      }

      // Archived filter
      if (query.isArchived != null) {
        conditions.add(t.archived.equals(query.isArchived!));
      } else {
        // Exclude trashed by default unless queried
        conditions.add(t.trashed.equals(false));
      }

      // Date range filters
      if (query.before != null) {
        conditions.add(
          t.lastMessageTimestamp.isSmallerOrEqualValue(query.before!),
        );
      }
      if (query.after != null) {
        conditions.add(
          t.lastMessageTimestamp.isBiggerOrEqualValue(query.after!),
        );
      }

      // Label filter
      if (query.label != null && query.label!.isNotEmpty) {
        conditions.add(t.labelIdsJson.like('%${query.label}%'));
      }

      if (conditions.isEmpty) return const Constant(true);
      return conditions.reduce((a, b) => a & b);
    });

    q.orderBy([(t) => OrderingTerm.desc(t.lastMessageTimestamp)]);
    return q.get();
  }

  // -------------------------------------------------------------
  // RECENT SEARCHES MANAGEMENT
  // -------------------------------------------------------------

  Future<List<String>> getRecentSearches() async {
    try {
      final raw = await _secureStorage.read(key: _kRecentSearchesKey);
      if (raw == null) return const [];
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => e as String).toList();
    } catch (_) {
      return const [];
    }
  }

  Future<void> saveRecentSearch(String query) async {
    if (query.trim().isEmpty) return;
    try {
      final existing = await getRecentSearches();
      final updated = [query, ...existing.where((q) => q != query)];
      if (updated.length > 10) {
        updated.removeRange(10, updated.length);
      }
      await _secureStorage.write(
        key: _kRecentSearchesKey,
        value: jsonEncode(updated),
      );
    } catch (e) {
      _logger.warning('Failed to persist recent search: $e');
    }
  }

  Future<void> removeRecentSearch(String query) async {
    try {
      final existing = await getRecentSearches();
      final updated = existing.where((q) => q != query).toList();
      await _secureStorage.write(
        key: _kRecentSearchesKey,
        value: jsonEncode(updated),
      );
    } catch (_) {}
  }

  Future<void> clearRecentSearches() async {
    await _secureStorage.delete(key: _kRecentSearchesKey);
  }
}
