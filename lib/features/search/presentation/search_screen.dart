import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/avatar/app_avatar.dart';
import 'package:inbox_companion/core/widgets/empty_state/app_empty_state.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:inbox_companion/features/search/application/search_service.dart';
import 'package:inbox_companion/features/search/domain/search_query.dart';
import 'package:inbox_companion/features/search/presentation/command_palette_modal.dart';
import 'package:intl/intl.dart';

final searchServiceProvider = Provider<SearchService>((ref) {
  final db = ref.watch(appDatabaseProvider);
  final apiClient = ref.watch(apiClientProvider);
  return SearchService(db: db, apiClient: apiClient);
});

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key, this.initialQuery});

  final String? initialQuery;

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _searchController = TextEditingController();
  Timer? _debounceTimer;

  List<Thread> _results = [];
  List<String> _recentSearches = [];
  bool _isLoading = false;
  String _activeQuery = '';

  @override
  void initState() {
    super.initState();
    _loadRecentSearches();

    if (widget.initialQuery != null && widget.initialQuery!.isNotEmpty) {
      _searchController.text = widget.initialQuery!;
      _performSearch(widget.initialQuery!);
    }
  }

  Future<void> _loadRecentSearches() async {
    final searchService = ref.read(searchServiceProvider);
    final recents = await searchService.getRecentSearches();
    if (mounted) {
      setState(() {
        _recentSearches = recents;
      });
    }
  }

  void _onQueryChanged(String query) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) {
      setState(() {
        _results = [];
        _activeQuery = '';
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _activeQuery = trimmed;
    });

    final searchService = ref.read(searchServiceProvider);
    final authState = ref.read(authServiceProvider).state;
    final accountId = authState.currentAccount?.id ?? 'all';

    final results = await searchService.search(
      rawQuery: trimmed,
      accountId: accountId,
    );

    if (mounted) {
      setState(() {
        _results = results;
        _isLoading = false;
      });
      unawaited(_loadRecentSearches());
    }
  }

  void _appendOperator(String op) {
    final current = _searchController.text.trim();
    if (!current.contains(op)) {
      final updated = current.isEmpty ? op : '$current $op';
      _searchController.text = '$updated ';
      _searchController.selection = TextSelection.fromPosition(
        TextPosition(offset: _searchController.text.length),
      );
      _performSearch(_searchController.text);
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: TextField(
          controller: _searchController,
          autofocus: widget.initialQuery == null,
          decoration: InputDecoration(
            hintText: 'Search messages, senders, operators...',
            border: InputBorder.none,
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, size: 20),
                    onPressed: () {
                      _searchController.clear();
                      _performSearch('');
                    },
                  )
                : null,
          ),
          onChanged: _onQueryChanged,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.terminal_rounded),
            tooltip: 'Command Palette',
            onPressed: () => CommandPaletteModal.show(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.xs,
            ),
            child: Row(
              children: [
                _buildFilterChip('is:unread', 'Unread'),
                const SizedBox(width: 8),
                _buildFilterChip('is:starred', 'Starred'),
                const SizedBox(width: 8),
                _buildFilterChip('has:attachment', 'Has Attachment'),
                const SizedBox(width: 8),
                _buildFilterChip('is:archived', 'Archived'),
                const SizedBox(width: 8),
                _buildFilterChip('label:lbl_design', 'Design System'),
              ],
            ),
          ),
          const Divider(height: 1),

          // Search Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _activeQuery.isEmpty
                ? _buildEmptyOrRecentsView(context)
                : _buildResultsList(context),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String operatorText, String label) {
    final isSelected = _searchController.text.contains(operatorText);
    return FilterChip(
      selected: isSelected,
      label: Text(label),
      onSelected: (_) {
        if (isSelected) {
          final updated = _searchController.text
              .replaceAll(operatorText, '')
              .trim();
          _searchController.text = updated;
          _performSearch(updated);
        } else {
          _appendOperator(operatorText);
        }
      },
    );
  }

  Widget _buildEmptyOrRecentsView(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_recentSearches.isNotEmpty) ...[
            Row(
              children: [
                Text(
                  'Recent Searches',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () async {
                    final searchService = ref.read(searchServiceProvider);
                    await searchService.clearRecentSearches();
                    unawaited(_loadRecentSearches());
                  },
                  child: const Text('Clear All'),
                ),
              ],
            ),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _recentSearches.map((term) {
                return InputChip(
                  avatar: const Icon(Icons.history, size: 16),
                  label: Text(term),
                  onPressed: () {
                    _searchController.text = term;
                    _performSearch(term);
                  },
                  onDeleted: () async {
                    final searchService = ref.read(searchServiceProvider);
                    await searchService.removeRecentSearch(term);
                    unawaited(_loadRecentSearches());
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: AppSpacing.lg),
            const Divider(),
            const SizedBox(height: AppSpacing.sm),
          ],

          // Operator Suggestions Guide
          Text(
            'Search Operators',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Refine results by combining operators with keywords:',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _buildOperatorHelp(
            'from:email',
            'Find messages from a specific sender (e.g. from:jordan)',
          ),
          _buildOperatorHelp(
            'has:attachment',
            'Find emails containing attachments',
          ),
          _buildOperatorHelp('is:unread', 'Filter only unread emails in inbox'),
          _buildOperatorHelp(
            'is:starred',
            'Find flagged and starred conversations',
          ),
          _buildOperatorHelp(
            'before:YYYY-MM-DD',
            'Emails sent before a specific date',
          ),
        ],
      ),
    );
  }

  Widget _buildOperatorHelp(String operatorStr, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _appendOperator(operatorStr),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 6),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  operatorStr,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Text(
                  description,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildResultsList(BuildContext context) {
    if (_results.isEmpty) {
      return AppEmptyState(
        title: 'No results found',
        message:
            'No conversations matched "$_activeQuery". Try adjusting your search query or removing filter operators.',
        icon: Icons.search_off_rounded,
      );
    }

    final parsed = SearchQuery.parse(_activeQuery);
    final highlightWord = parsed.freeText;

    return ListView.separated(
      itemCount: _results.length,
      separatorBuilder: (_, _) => const Divider(height: 1),
      itemBuilder: (ctx, index) {
        final thread = _results[index];

        String senderName = 'Alex Morgan';
        try {
          final list = jsonDecode(thread.participantsJson) as List<dynamic>;
          if (list.isNotEmpty) {
            senderName =
                (list.first as Map<String, dynamic>)['name'] as String? ??
                'Alex Morgan';
          }
        } catch (_) {}

        return ListTile(
          leading: AppAvatar(name: senderName, size: 40),
          title: Row(
            children: [
              Expanded(
                child: _buildHighlightedText(
                  thread.subject,
                  highlightWord,
                  isTitle: true,
                ),
              ),
              Text(
                DateFormat('MMM d')
                    .format(thread.lastMessageTimestamp.toLocal()),
                style: Theme.of(context).textTheme.labelSmall,
              ),
            ],
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 2),
              _buildHighlightedText(
                thread.snippet,
                highlightWord,
                isTitle: false,
              ),
              if (thread.hasAttachments) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.attach_file,
                      size: 14,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Attachment',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
          onTap: () => context.push('/conversation/${thread.id}'),
        );
      },
    );
  }

  Widget _buildHighlightedText(
    String fullText,
    String queryWord, {
    required bool isTitle,
  }) {
    final theme = Theme.of(context);
    final baseStyle = isTitle
        ? theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)
        : theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          );

    if (queryWord.isEmpty) {
      return Text(
        fullText,
        style: baseStyle,
        maxLines: isTitle ? 1 : 2,
        overflow: TextOverflow.ellipsis,
      );
    }

    final spans = <TextSpan>[];
    final pattern = RegExp(RegExp.escape(queryWord), caseSensitive: false);
    var lastMatchEnd = 0;

    for (final match in pattern.allMatches(fullText)) {
      if (match.start > lastMatchEnd) {
        spans.add(
          TextSpan(text: fullText.substring(lastMatchEnd, match.start)),
        );
      }
      spans.add(
        TextSpan(
          text: fullText.substring(match.start, match.end),
          style: TextStyle(
            backgroundColor: theme.colorScheme.primaryContainer,
            color: theme.colorScheme.onPrimaryContainer,
            fontWeight: FontWeight.bold,
          ),
        ),
      );
      lastMatchEnd = match.end;
    }

    if (lastMatchEnd < fullText.length) {
      spans.add(TextSpan(text: fullText.substring(lastMatchEnd)));
    }

    return RichText(
      text: TextSpan(style: baseStyle, children: spans),
      maxLines: isTitle ? 1 : 2,
      overflow: TextOverflow.ellipsis,
    );
  }
}
