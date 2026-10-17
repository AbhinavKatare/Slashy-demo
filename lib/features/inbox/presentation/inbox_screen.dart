import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inbox_companion/core/auth/auth_service.dart';
import 'package:inbox_companion/core/auth/auth_state.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/avatar/app_avatar.dart';
import 'package:inbox_companion/core/widgets/empty_state/app_empty_state.dart';
import 'package:inbox_companion/core/widgets/list_tile/app_thread_tile.dart';
import 'package:inbox_companion/core/widgets/snackbar/app_snackbar.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:inbox_companion/data/sync/sync_service.dart';
import 'package:inbox_companion/features/auth/presentation/account_switcher_dialog.dart';
import 'package:inbox_companion/features/search/presentation/command_palette_modal.dart';
import 'package:intl/intl.dart';

class InboxScreen extends ConsumerStatefulWidget {
  const InboxScreen({super.key});

  @override
  ConsumerState<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends ConsumerState<InboxScreen> {
  String _selectedFolder = 'inbox';
  String? _selectedLabelId;
  final Set<String> _selectedThreadIds = {};

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authService = ref.watch(authServiceProvider);
    final authState = authService.state;
    final db = ref.watch(appDatabaseProvider);
    final syncService = ref.watch(syncServiceProvider);

    final activeAccountId = authState.currentAccount?.id ?? 'all';
    final isMultiSelect = _selectedThreadIds.isNotEmpty;

    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.keyK, control: true): () =>
            CommandPaletteModal.show(context),
        const SingleActivator(LogicalKeyboardKey.keyK, meta: true): () =>
            CommandPaletteModal.show(context),
      },
      child: Scaffold(
        drawer: _buildDrawer(context, authState, db, authService),
        body: StreamBuilder<List<Thread>>(
          stream: db.watchThreads(
            accountId: activeAccountId,
            folder: _selectedFolder,
            labelId: _selectedLabelId,
          ),
          builder: (context, snapshot) {
            final threads = snapshot.data ?? [];

            return NestedScrollView(
              headerSliverBuilder: (context, innerBoxIsScrolled) {
                return [
                  SliverAppBar(
                    floating: true,
                    pinned: true,
                    title: isMultiSelect
                        ? Text('${_selectedThreadIds.length} selected')
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _getFolderTitle(_selectedFolder),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (authState.currentAccount != null)
                                Text(
                                  authState.currentAccount!.email,
                                  style: theme.textTheme.labelSmall?.copyWith(
                                    color: theme.colorScheme.onSurfaceVariant,
                                  ),
                                ),
                            ],
                          ),
                    actions: isMultiSelect
                        ? [
                            IconButton(
                              icon: const Icon(Icons.select_all_rounded),
                              tooltip: 'Select All',
                              onPressed: () {
                                setState(() {
                                  _selectedThreadIds.addAll(
                                    threads.map((t) => t.id),
                                  );
                                });
                              },
                            ),
                            IconButton(
                              icon: const Icon(Icons.archive_outlined),
                              tooltip: 'Archive Selected',
                              onPressed: () => _bulkAction(
                                threads,
                                OutboxActionType.archiveThread,
                                'Archived',
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline_rounded),
                              tooltip: 'Delete Selected',
                              onPressed: () => _bulkAction(
                                threads,
                                OutboxActionType.trashThread,
                                'Deleted',
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close_rounded),
                              tooltip: 'Cancel Selection',
                              onPressed: () {
                                setState(() {
                                  _selectedThreadIds.clear();
                                });
                              },
                            ),
                          ]
                        : [
                            if (authState.isDemoMode)
                              InkWell(
                                onTap: () =>
                                    unawaited(_resetDemo(context, authService)),
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  margin: const EdgeInsets.only(right: 4),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.tertiaryContainer,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.restart_alt_rounded,
                                        size: 14,
                                        color: theme
                                            .colorScheme
                                            .onTertiaryContainer,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        'RESET DEMO',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: theme
                                              .colorScheme
                                              .onTertiaryContainer,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            IconButton(
                              icon: const Icon(Icons.terminal_rounded),
                              tooltip: 'Command Palette (Ctrl+K)',
                              onPressed: () =>
                                  CommandPaletteModal.show(context),
                            ),
                            IconButton(
                              icon: const Icon(Icons.search_rounded),
                              tooltip: 'Search Messages',
                              onPressed: () => context.push('/search'),
                            ),
                            IconButton(
                              icon: const Icon(Icons.account_circle_outlined),
                              tooltip: 'Switch Account',
                              onPressed: () {
                                showDialog<void>(
                                  context: context,
                                  builder: (_) => const AccountSwitcherDialog(),
                                );
                              },
                            ),
                          ],
                  ),
                ];
              },
              body: RefreshIndicator(
                onRefresh: () async {
                  await syncService.pull(activeAccountId);
                },
                child: threads.isEmpty
                    ? CustomScrollView(
                        slivers: [
                          SliverFillRemaining(
                            hasScrollBody: false,
                            child: Center(
                              child: AppEmptyState(
                                title: 'No conversations here',
                                message:
                                    'Your ${_getFolderTitle(_selectedFolder).toLowerCase()} is completely clear.',
                                icon: Icons.inbox_outlined,
                                actionLabel: 'Check for new mail',
                                onAction: () =>
                                    syncService.pull(activeAccountId),
                              ),
                            ),
                          ),
                        ],
                      )
                    : ListView.builder(
                        itemCount: threads.length,
                        itemBuilder: (context, index) {
                          final thread = threads[index];
                          final isSelected = _selectedThreadIds.contains(
                            thread.id,
                          );
                          final dateStr = DateFormat('MMM d')
                              .format(thread.lastMessageTimestamp);

                          // Parse participants
                          String senderName = 'Unknown';
                          try {
                            final participants = jsonDecode(
                              thread.participantsJson,
                            ) as List<dynamic>;
                            if (participants.isNotEmpty) {
                              senderName =
                                  (participants.first
                                          as Map<String, dynamic>)['name']
                                      as String? ??
                                  'Unknown';
                            }
                          } catch (_) {}

                          // Parse label IDs
                          List<String> labelIds = [];
                          try {
                            labelIds = (jsonDecode(
                              thread.labelIdsJson,
                            ) as List<dynamic>).cast<String>();
                          } catch (_) {}

                          return Dismissible(
                            key: ValueKey('dismiss_${thread.id}'),
                            background: Container(
                              color: Colors.green.shade700,
                              alignment: Alignment.centerLeft,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 20,
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.archive, color: Colors.white),
                                  SizedBox(width: 8),
                                  Text(
                                    'Archive',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            secondaryBackground: Container(
                              color: Colors.red.shade700,
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 20,
                              ),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Text(
                                    'Trash',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  SizedBox(width: 8),
                                  Icon(Icons.delete, color: Colors.white),
                                ],
                              ),
                            ),
                            onDismissed: (direction) {
                              if (direction == DismissDirection.startToEnd) {
                                _performReversibleAction(
                                  thread,
                                  OutboxActionType.archiveThread,
                                  'Thread archived',
                                );
                              } else {
                                _performReversibleAction(
                                  thread,
                                  OutboxActionType.trashThread,
                                  'Thread moved to trash',
                                );
                              }
                            },
                            child: AppThreadTile(
                              key: ValueKey(thread.id),
                              id: thread.id,
                              senderName: senderName,
                              subject: thread.subject,
                              snippet: thread.snippet,
                              timestamp: dateStr,
                              isUnread: thread.unread,
                              isStarred: thread.starred,
                              hasAttachments: thread.hasAttachments,
                              messageCount: thread.messageCount,
                              labels: labelIds,
                              isSelected: isSelected,
                              onTap: () {
                                if (isMultiSelect) {
                                  setState(() {
                                    if (isSelected) {
                                      _selectedThreadIds.remove(thread.id);
                                    } else {
                                      _selectedThreadIds.add(thread.id);
                                    }
                                  });
                                } else {
                                  context.push('/conversation/${thread.id}');
                                }
                              },
                              onLongPress: () {
                                setState(() {
                                  if (isSelected) {
                                    _selectedThreadIds.remove(thread.id);
                                  } else {
                                    _selectedThreadIds.add(thread.id);
                                  }
                                });
                              },
                              onStarToggle: () {
                                _performReversibleAction(
                                  thread,
                                  thread.starred
                                      ? OutboxActionType.unstarThread
                                      : OutboxActionType.starThread,
                                  thread.starred ? 'Unstarred' : 'Starred',
                                );
                              },
                              onArchive: () {
                                _performReversibleAction(
                                  thread,
                                  OutboxActionType.archiveThread,
                                  'Thread archived',
                                );
                              },
                              onDelete: () {
                                _performReversibleAction(
                                  thread,
                                  OutboxActionType.trashThread,
                                  'Thread deleted',
                                );
                              },
                            ),
                          );
                        },
                      ),
              ),
            );
          },
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => context.push('/compose'),
          icon: const Icon(Icons.edit_outlined),
          label: const Text('Compose'),
        ),
      ),
    );
  }

  void _performReversibleAction(
    Thread thread,
    OutboxActionType actionType,
    String label,
  ) {
    HapticFeedback.lightImpact();
    final syncService = ref.read(syncServiceProvider);
    syncService
        .enqueueOptimisticAction(
          accountId: thread.accountId,
          actionType: actionType,
          targetId: thread.id,
        )
        .then((outboxId) {
          if (mounted) {
            AppSnackbar.show(
              context,
              message: label,
              actionLabel: 'Undo',
              onAction: () {
                HapticFeedback.lightImpact();
                syncService.undoAction(outboxId);
              },
            );
          }
        });
  }

  void _bulkAction(
    List<Thread> threads,
    OutboxActionType actionType,
    String actionLabel,
  ) {
    HapticFeedback.mediumImpact();
    final selectedThreads = threads
        .where((t) => _selectedThreadIds.contains(t.id))
        .toList();
    final count = selectedThreads.length;

    for (final t in selectedThreads) {
      ref
          .read(syncServiceProvider)
          .enqueueOptimisticAction(
            accountId: t.accountId,
            actionType: actionType,
            targetId: t.id,
          );
    }

    setState(() {
      _selectedThreadIds.clear();
    });

    AppSnackbar.show(context, message: '$actionLabel $count conversations');
  }

  Widget _buildDrawer(
    BuildContext context,
    AuthState authState,
    AppDatabase db,
    AuthService authService,
  ) {
    final theme = Theme.of(context);
    final account = authState.currentAccount;

    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            // Drawer Header
            UserAccountsDrawerHeader(
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
              ),
              currentAccountPicture: AppAvatar(
                name: account?.displayName ?? 'User',
                size: 56,
              ),
              accountName: Text(
                account?.displayName ?? 'Inbox Companion',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onPrimaryContainer,
                ),
              ),
              accountEmail: Text(
                account?.email ?? 'No active account',
                style: TextStyle(color: theme.colorScheme.onPrimaryContainer),
              ),
              onDetailsPressed: () {
                Navigator.of(context).pop();
                showDialog<void>(
                  context: context,
                  builder: (_) => const AccountSwitcherDialog(),
                );
              },
            ),

            // System Folders
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _drawerItem(
                    icon: Icons.all_inbox_rounded,
                    label: 'All Inboxes',
                    isSelected: _selectedFolder == 'all_inboxes',
                    onTap: () {
                      _selectFolder('all_inboxes');
                      Navigator.of(context).pop();
                    },
                  ),
                  _drawerItem(
                    icon: Icons.inbox_rounded,
                    label: 'Inbox',
                    isSelected: _selectedFolder == 'inbox',
                    onTap: () {
                      _selectFolder('inbox');
                      Navigator.of(context).pop();
                    },
                  ),
                  _drawerItem(
                    icon: Icons.star_rounded,
                    label: 'Starred',
                    isSelected: _selectedFolder == 'starred',
                    onTap: () {
                      _selectFolder('starred');
                      Navigator.of(context).pop();
                    },
                  ),
                  _drawerItem(
                    icon: Icons.archive_outlined,
                    label: 'Archive',
                    isSelected: _selectedFolder == 'archive',
                    onTap: () {
                      _selectFolder('archive');
                      Navigator.of(context).pop();
                    },
                  ),
                  _drawerItem(
                    icon: Icons.delete_outline_rounded,
                    label: 'Trash',
                    isSelected: _selectedFolder == 'trash',
                    onTap: () {
                      _selectFolder('trash');
                      Navigator.of(context).pop();
                    },
                  ),
                  _drawerItem(
                    icon: Icons.report_gmailerrorred_rounded,
                    label: 'Spam',
                    isSelected: _selectedFolder == 'spam',
                    onTap: () {
                      _selectFolder('spam');
                      Navigator.of(context).pop();
                    },
                  ),
                  const Divider(),
                  _drawerItem(
                    icon: Icons.calendar_month_outlined,
                    label: 'Agenda Calendar',
                    isSelected: false,
                    onTap: () {
                      Navigator.of(context).pop();
                      context.push('/calendar');
                    },
                  ),
                  _drawerItem(
                    icon: Icons.check_circle_outline_rounded,
                    label: 'Tasks & Action Items',
                    isSelected: false,
                    onTap: () {
                      Navigator.of(context).pop();
                      context.push('/tasks');
                    },
                  ),
                  const Divider(),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.xs,
                    ),
                    child: Text(
                      'LABELS',
                      style: theme.textTheme.labelSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                  StreamBuilder<List<Label>>(
                    stream: db.watchLabels(accountId: account?.id),
                    builder: (context, labelSnapshot) {
                      final labels = labelSnapshot.data ?? [];
                      return Column(
                        children: labels.map((lbl) {
                          return ListTile(
                            leading: Container(
                              width: 12,
                              height: 12,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: _parseColor(lbl.colorHex),
                              ),
                            ),
                            title: Text(lbl.name),
                            selected: _selectedLabelId == lbl.id,
                            onTap: () {
                              setState(() {
                                _selectedLabelId = lbl.id;
                                _selectedFolder = 'label_${lbl.id}';
                              });
                              Navigator.of(context).pop();
                            },
                          );
                        }).toList(),
                      );
                    },
                  ),
                ],
              ),
            ),
            if (authState.isDemoMode) ...[
              const Divider(height: 1),
              ListTile(
                leading: const Icon(
                  Icons.restart_alt_rounded,
                  color: Colors.orange,
                ),
                title: const Text('Reset Demo Data'),
                subtitle: const Text('Restore pristine fictional seed state'),
                onTap: () async {
                  Navigator.of(context).pop();
                  await _resetDemo(context, authService);
                },
              ),
            ],
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.settings_outlined),
              title: const Text('Settings'),
              onTap: () {
                Navigator.of(context).pop();
                context.push('/settings');
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _resetDemo(BuildContext context, AuthService authService) async {
    await HapticFeedback.mediumImpact();
    if (!context.mounted) return;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reset Demo Data?'),
        content: const Text(
          'This will restore all fictional demo accounts, threads, and messages to their clean initial state. Any archived, deleted, or sent demo emails will be reset.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Reset Clean'),
          ),
        ],
      ),
    );

    if (confirm == true && context.mounted) {
      try {
        await authService.resetDemoData();
        if (context.mounted) {
          AppSnackbar.show(
            context,
            message: 'Demo inbox restored to clean initial state.',
            type: AppSnackbarType.success,
          );
        }
      } catch (e) {
        if (context.mounted) {
          AppSnackbar.show(
            context,
            message: 'Failed to reset demo: $e',
            type: AppSnackbarType.error,
          );
        }
      }
    }
  }

  Widget _drawerItem({
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      selected: isSelected,
      onTap: onTap,
    );
  }

  void _selectFolder(String folder) {
    setState(() {
      _selectedFolder = folder;
      _selectedLabelId = null;
    });
  }

  String _getFolderTitle(String folder) {
    switch (folder) {
      case 'all_inboxes':
        return 'All Inboxes';
      case 'inbox':
        return 'Inbox';
      case 'starred':
        return 'Starred';
      case 'archive':
        return 'Archive';
      case 'trash':
        return 'Trash';
      case 'spam':
        return 'Spam';
      default:
        return 'Conversations';
    }
  }

  Color _parseColor(String hex) {
    try {
      final clean = hex.replaceAll('#', '');
      return Color(int.parse('0xFF$clean'));
    } catch (_) {
      return Colors.blue;
    }
  }
}
