import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/core/theme/tokens/elevation_tokens.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/snackbar/app_snackbar.dart';
import 'package:inbox_companion/features/auth/presentation/account_switcher_dialog.dart';

class CommandPaletteAction {
  const CommandPaletteAction({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onExecute,
    this.shortcut,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final void Function(BuildContext context, WidgetRef ref) onExecute;
  final String? shortcut;
}

class CommandPaletteModal extends ConsumerStatefulWidget {
  const CommandPaletteModal({super.key});

  static Future<void> show(BuildContext context) {
    return showDialog<void>(
      context: context,
      builder: (_) => const CommandPaletteModal(),
    );
  }

  @override
  ConsumerState<CommandPaletteModal> createState() =>
      _CommandPaletteModalState();
}

class _CommandPaletteModalState extends ConsumerState<CommandPaletteModal> {
  final _searchController = TextEditingController();
  String _filter = '';

  late final List<CommandPaletteAction> _allActions = [
    CommandPaletteAction(
      title: 'Compose New Email',
      subtitle: 'Open the message composer with recipient chips',
      icon: Icons.edit_outlined,
      shortcut: 'C',
      onExecute: (ctx, ref) {
        Navigator.of(ctx).pop();
        ctx.push('/compose');
      },
    ),
    CommandPaletteAction(
      title: 'Sync Mailbox Now',
      subtitle: 'Trigger background pull and outbox queue sync',
      icon: Icons.sync,
      shortcut: 'R',
      onExecute: (ctx, ref) async {
        Navigator.of(ctx).pop();
        final authState = ref.read(authServiceProvider).state;
        final syncService = ref.read(syncServiceProvider);
        final accountId = authState.currentAccount?.id ?? 'acc_work_01';
        await syncService.pull(accountId);
        await syncService.processOutbox();
        if (ctx.mounted) {
          AppSnackbar.show(
            ctx,
            message: 'Mailbox synchronization complete.',
            type: AppSnackbarType.success,
          );
        }
      },
    ),
    CommandPaletteAction(
      title: 'Switch Account',
      subtitle: 'Toggle active connected account or explore demo mode',
      icon: Icons.switch_account_outlined,
      onExecute: (ctx, ref) {
        Navigator.of(ctx).pop();
        showModalBottomSheet<void>(
          context: ctx,
          builder: (_) => const AccountSwitcherDialog(),
        );
      },
    ),
    CommandPaletteAction(
      title: 'Filter: Starred Conversations',
      subtitle: 'View all starred and flagged threads',
      icon: Icons.star_border,
      shortcut: 'S',
      onExecute: (ctx, ref) {
        Navigator.of(ctx).pop();
        ctx.push('/search?q=is:starred');
      },
    ),
    CommandPaletteAction(
      title: 'Filter: Unread Conversations',
      subtitle: 'View only unread messages across folders',
      icon: Icons.mark_email_unread_outlined,
      shortcut: 'U',
      onExecute: (ctx, ref) {
        Navigator.of(ctx).pop();
        ctx.push('/search?q=is:unread');
      },
    ),
    CommandPaletteAction(
      title: 'Filter: Has Attachments',
      subtitle: 'Find threads containing documents or files',
      icon: Icons.attach_file,
      onExecute: (ctx, ref) {
        Navigator.of(ctx).pop();
        ctx.push('/search?q=has:attachment');
      },
    ),
    CommandPaletteAction(
      title: 'Toggle Dark / Light Mode',
      subtitle: 'Switch application color theme mode',
      icon: Icons.dark_mode_outlined,
      shortcut: 'T',
      onExecute: (ctx, ref) {
        Navigator.of(ctx).pop();
        final current = ref.read(themeModeProvider);
        ref.read(themeModeProvider.notifier).state = current == ThemeMode.dark
            ? ThemeMode.light
            : ThemeMode.dark;
      },
    ),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final filtered = _allActions.where((a) {
      final term = _filter.toLowerCase();
      return a.title.toLowerCase().contains(term) ||
          a.subtitle.toLowerCase().contains(term);
    }).toList();

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 580, maxHeight: 480),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E2230) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: AppElevation.shadowLevel4(theme.shadowColor),
          border: Border.all(
            color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5),
          ),
        ),
        child: Column(
          children: [
            // Search Input Header
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Row(
                children: [
                  Icon(
                    Icons.terminal_rounded,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      autofocus: true,
                      decoration: const InputDecoration(
                        hintText: 'Type a command or search action...',
                        border: InputBorder.none,
                        isDense: true,
                      ),
                      onChanged: (val) => setState(() => _filter = val),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            // Command Items List
            Expanded(
              child: filtered.isNotEmpty
                  ? ListView.separated(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: filtered.length,
                      separatorBuilder: (_, _) => const Divider(height: 1),
                      itemBuilder: (ctx, index) {
                        final action = filtered[index];
                        return ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              action.icon,
                              size: 20,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                          title: Text(
                            action.title,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text(
                            action.subtitle,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                          trailing: action.shortcut != null
                              ? Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: theme
                                        .colorScheme
                                        .surfaceContainerHighest,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    action.shortcut!,
                                    style: theme.textTheme.labelSmall?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                )
                              : null,
                          onTap: () => action.onExecute(context, ref),
                        );
                      },
                    )
                  : Center(
                      child: Text(
                        'No matching commands found',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
