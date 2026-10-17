import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:drift/drift.dart';
import 'package:inbox_companion/core/error/failures.dart';
import 'package:inbox_companion/core/logging/app_logger.dart';
import 'package:inbox_companion/data/api/inbox_companion_api_client.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:uuid/uuid.dart';

enum OutboxActionType {
  archiveThread,
  unarchiveThread,
  trashThread,
  untrashThread,
  starThread,
  unstarThread,
  markRead,
  markUnread,
  applyLabel,
  removeLabel,
  sendMessage,
}

class SyncService {
  SyncService({
    required this.db,
    required this.apiClient,
    Connectivity? connectivity,
    IAppLogger? logger,
  }) : _connectivity = connectivity ?? Connectivity(),
       _logger = logger ?? AppLogger(),
       _uuid = const Uuid();

  final AppDatabase db;
  final InboxCompanionApiClient apiClient;
  final Connectivity _connectivity;
  final IAppLogger _logger;
  final Uuid _uuid;
  final Random _random = Random();

  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  Completer<void>? _activeProcessingCompleter;
  bool _isSyncing = false;

  Future<void> init() async {
    // 1. Recover from process death: reset dangling in_flight entries to pending
    await db.resetInFlightOutbox();

    // 2. Listen to network changes to automatically process queue and sync
    _connectivitySub = _connectivity.onConnectivityChanged.listen((results) {
      final isConnected = results.any((r) => r != ConnectivityResult.none);
      if (isConnected) {
        _logger.info('Network restored, draining outbox and syncing...');
        unawaited(processOutbox());
      }
    });

    // 3. Process any pending outbox items immediately
    unawaited(processOutbox());
  }

  void dispose() {
    _connectivitySub?.cancel();
  }

  // -------------------------------------------------------------
  // PULL (DELTA / CURSOR BASED)
  // -------------------------------------------------------------

  Future<void> pull(String accountId) async {
    if (_isSyncing) return;
    _isSyncing = true;

    final syncKey = '${accountId}_threads';
    try {
      final currentState = await db.watchSyncState(syncKey).first;
      final cursor = currentState?.cursor;

      await db.upsertSyncState(
        SyncStatesCompanion(
          key: Value(syncKey),
          status: const Value('syncing'),
          errorMessage: const Value(null),
        ),
      );

      final response = await apiClient.listThreads(cursor: cursor, limit: 50);

      // Upsert threads into Drift
      final threadCompanions = response.threads.map((t) {
        return ThreadsCompanion(
          id: Value(t.id),
          accountId: Value(t.accountId),
          subject: Value(t.subject),
          snippet: Value(t.snippet),
          unread: Value(t.isUnread),
          starred: Value(t.isStarred),
          archived: const Value(false),
          trashed: const Value(false),
          spam: const Value(false),
          hasAttachments: Value(t.hasAttachments),
          lastMessageTimestamp: Value(DateTime.parse(t.lastMessageAt)),
          messageCount: Value(t.messageCount),
          participantsJson: Value(
            jsonEncode(t.participants.map((p) => p.toJson()).toList()),
          ),
          labelIdsJson: Value(jsonEncode(t.labelIds)),
        );
      }).toList();

      await db.upsertThreadsBatch(threadCompanions);

      // Update sync state
      await db.upsertSyncState(
        SyncStatesCompanion(
          key: Value(syncKey),
          cursor: Value(response.nextCursor),
          lastSyncTimestamp: Value(DateTime.now()),
          status: const Value('idle'),
          errorMessage: const Value(null),
        ),
      );

      _logger.info(
        'Sync pull completed: ${threadCompanions.length} threads upserted.',
      );
    } catch (e, st) {
      _logger.error('Sync pull failed', error: e, stackTrace: st);
      await db.upsertSyncState(
        SyncStatesCompanion(
          key: Value(syncKey),
          status: const Value('error'),
          errorMessage: Value(e.toString()),
        ),
      );
    } finally {
      _isSyncing = false;
    }
  }

  // -------------------------------------------------------------
  // OUTBOX QUEUE & OPTIMISTIC UPDATES
  // -------------------------------------------------------------

  /// Enqueues an optimistic action, updates local Drift immediately, and triggers outbox
  Future<String> enqueueOptimisticAction({
    required String accountId,
    required OutboxActionType actionType,
    required String targetId,
    Map<String, dynamic> payload = const {},
  }) async {
    final outboxId = _uuid.v4();
    final idempotencyKey = _uuid.v4();

    // 1. Apply optimistic update to local database
    await _applyOptimisticUpdate(actionType, targetId, payload);

    // 2. Persist in Outbox
    await db.enqueueOutbox(
      OutboxEntriesCompanion(
        id: Value(outboxId),
        idempotencyKey: Value(idempotencyKey),
        accountId: Value(accountId),
        actionType: Value(actionType.name),
        targetId: Value(targetId),
        payloadJson: Value(jsonEncode(payload)),
        status: const Value('pending'),
        createdAt: Value(DateTime.now()),
      ),
    );

    // 3. Process immediately in background
    unawaited(processOutbox());

    return outboxId;
  }

  Future<void> undoAction(String outboxId) async {
    final entry = await (db.select(
      db.outboxEntries,
    )..where((t) => t.id.equals(outboxId))).getSingleOrNull();

    if (entry != null) {
      // Revert optimistic update
      final type = OutboxActionType.values.byName(entry.actionType);
      final payload = jsonDecode(entry.payloadJson) as Map<String, dynamic>;
      await _rollbackOptimisticUpdate(type, entry.targetId, payload);

      // Remove from outbox
      await db.markOutboxCompleted(entry.id);
      _logger.info('Action $outboxId undone successfully.');
    }
  }

  Future<void> processOutbox() async {
    if (_activeProcessingCompleter != null) {
      return _activeProcessingCompleter!.future;
    }

    final completer = Completer<void>();
    _activeProcessingCompleter = completer;

    try {
      while (true) {
        final pendingEntries =
            await (db.select(db.outboxEntries)
                  ..where(
                    (t) =>
                        t.status.equals('pending') | t.status.equals('failed'),
                  )
                  ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
                .get();

        if (pendingEntries.isEmpty) break;

        final now = DateTime.now();
        var processedAny = false;

        for (final entry in pendingEntries) {
          // Check retry eligibility
          if (entry.status == 'failed') {
            if (entry.nextRetryAt == null || entry.nextRetryAt!.isAfter(now)) {
              continue;
            }
          }

          processedAny = true;
          await db.markOutboxInFlight(entry.id);
          final action = OutboxActionType.values.byName(entry.actionType);
          final payload = jsonDecode(entry.payloadJson) as Map<String, dynamic>;

          try {
            await _executeServerAction(
              action: action,
              targetId: entry.targetId,
              accountId: entry.accountId,
              idempotencyKey: entry.idempotencyKey,
              payload: payload,
            );

            // Success: delete outbox entry
            await db.markOutboxCompleted(entry.id);
            _logger.info(
              'Outbox action ${entry.actionType} (${entry.id}) completed successfully.',
            );
          } on Failure catch (f) {
            if (_isPermanentRejection(f)) {
              // Server permanently rejected the action: Roll back local state!
              _logger.warning(
                'Server rejected outbox action ${entry.id}. Rolling back optimistic update: $f',
              );
              await _rollbackOptimisticUpdate(action, entry.targetId, payload);
              await (db.update(
                db.outboxEntries,
              )..where((t) => t.id.equals(entry.id))).write(
                OutboxEntriesCompanion(
                  status: const Value('rejected'),
                  errorMessage: Value(f.message),
                  nextRetryAt: const Value(null),
                ),
              );
            } else {
              // Transient error: calculate exponential backoff with jitter
              final delayMs =
                  (pow(2, entry.retryCount) * 1000).toInt() +
                  _random.nextInt(500);
              final nextRetry = DateTime.now().add(
                Duration(milliseconds: delayMs),
              );
              await db.markOutboxFailed(
                entry.id,
                f.message,
                nextRetryAt: nextRetry,
              );
              _logger.warning(
                'Transient failure for outbox ${entry.id}. Retrying at $nextRetry (attempt ${entry.retryCount + 1}).',
              );
            }
          } catch (e) {
            final delayMs =
                (pow(2, entry.retryCount) * 1000).toInt() +
                _random.nextInt(500);
            final nextRetry = DateTime.now().add(
              Duration(milliseconds: delayMs),
            );
            await db.markOutboxFailed(
              entry.id,
              e.toString(),
              nextRetryAt: nextRetry,
            );
          }
        }

        if (!processedAny) break;
      }
    } finally {
      _activeProcessingCompleter = null;
      if (!completer.isCompleted) {
        completer.complete();
      }
    }
  }

  // -------------------------------------------------------------
  // SERVER ACTION DISPATCHER
  // -------------------------------------------------------------

  Future<void> _executeServerAction({
    required OutboxActionType action,
    required String targetId,
    required String accountId,
    required String idempotencyKey,
    required Map<String, dynamic> payload,
  }) async {
    switch (action) {
      case OutboxActionType.archiveThread:
        await apiClient.updateThread(targetId, {'archived': true});
        break;
      case OutboxActionType.unarchiveThread:
        await apiClient.updateThread(targetId, {'archived': false});
        break;
      case OutboxActionType.trashThread:
        await apiClient.updateThread(targetId, {'trashed': true});
        break;
      case OutboxActionType.untrashThread:
        await apiClient.updateThread(targetId, {'trashed': false});
        break;
      case OutboxActionType.starThread:
        await apiClient.updateThread(targetId, {'starred': true});
        break;
      case OutboxActionType.unstarThread:
        await apiClient.updateThread(targetId, {'starred': false});
        break;
      case OutboxActionType.markRead:
        await apiClient.updateThread(targetId, {'unread': false});
        break;
      case OutboxActionType.markUnread:
        await apiClient.updateThread(targetId, {'unread': true});
        break;
      case OutboxActionType.applyLabel:
        final labelId = payload['labelId'] as String? ?? '';
        await apiClient.updateThread(targetId, {'addLabel': labelId});
        break;
      case OutboxActionType.removeLabel:
        final labelId = payload['labelId'] as String? ?? '';
        await apiClient.updateThread(targetId, {'removeLabel': labelId});
        break;
      case OutboxActionType.sendMessage:
        await apiClient.sendMessage(payload);
        break;
    }
  }

  // -------------------------------------------------------------
  // OPTIMISTIC UPDATES & ROLLBACKS
  // -------------------------------------------------------------

  Future<void> _applyOptimisticUpdate(
    OutboxActionType action,
    String targetId,
    Map<String, dynamic> payload,
  ) async {
    switch (action) {
      case OutboxActionType.archiveThread:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(archived: Value(true)));
        break;
      case OutboxActionType.unarchiveThread:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(archived: Value(false)));
        break;
      case OutboxActionType.trashThread:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(trashed: Value(true)));
        break;
      case OutboxActionType.untrashThread:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(trashed: Value(false)));
        break;
      case OutboxActionType.starThread:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(starred: Value(true)));
        break;
      case OutboxActionType.unstarThread:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(starred: Value(false)));
        break;
      case OutboxActionType.markRead:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(unread: Value(false)));
        break;
      case OutboxActionType.markUnread:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(unread: Value(true)));
        break;
      case OutboxActionType.applyLabel:
      case OutboxActionType.removeLabel:
      case OutboxActionType.sendMessage:
        // Message is saved locally as draft/message row
        break;
    }
  }

  Future<void> _rollbackOptimisticUpdate(
    OutboxActionType action,
    String targetId,
    Map<String, dynamic> payload,
  ) async {
    switch (action) {
      case OutboxActionType.archiveThread:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(archived: Value(false)));
        break;
      case OutboxActionType.unarchiveThread:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(archived: Value(true)));
        break;
      case OutboxActionType.trashThread:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(trashed: Value(false)));
        break;
      case OutboxActionType.untrashThread:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(trashed: Value(true)));
        break;
      case OutboxActionType.starThread:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(starred: Value(false)));
        break;
      case OutboxActionType.unstarThread:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(starred: Value(true)));
        break;
      case OutboxActionType.markRead:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(unread: Value(true)));
        break;
      case OutboxActionType.markUnread:
        await (db.update(db.threads)..where((t) => t.id.equals(targetId)))
            .write(const ThreadsCompanion(unread: Value(false)));
        break;
      case OutboxActionType.applyLabel:
      case OutboxActionType.removeLabel:
      case OutboxActionType.sendMessage:
        break;
    }
  }

  bool _isPermanentRejection(Failure failure) {
    if (failure is ValidationFailure ||
        failure is NotFoundFailure ||
        failure is ForbiddenFailure) {
      return true;
    }
    if (failure is ServerFailure && failure.statusCode == 400) {
      return true;
    }
    return false;
  }
}
