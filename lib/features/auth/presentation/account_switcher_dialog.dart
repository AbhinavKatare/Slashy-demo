import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inbox_companion/core/auth/auth_state.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/avatar/app_avatar.dart';
import 'package:inbox_companion/core/widgets/buttons/app_button.dart';
import 'package:inbox_companion/data/local/app_database.dart';

class AccountSwitcherDialog extends ConsumerWidget {
  const AccountSwitcherDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final authService = ref.watch(authServiceProvider);
    final authState = authService.state;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Accounts',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            AppSpacing.gapVerticalMd,
            if (authState.isDemoMode)
              Container(
                margin: const EdgeInsets.only(bottom: AppSpacing.md),
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.tertiaryContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.science,
                      size: 18,
                      color: theme.colorScheme.onTertiaryContainer,
                    ),
                    AppSpacing.gapHorizontalSm,
                    Expanded(
                      child: Text(
                        'DEMO MODE (Local Mock Backend)',
                        style: theme.textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.onTertiaryContainer,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: authState.accounts.length,
                itemBuilder: (context, index) {
                  final account = authState.accounts[index];
                  final isCurrent = account.id == authState.currentAccount?.id;

                  return Container(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: isCurrent
                            ? theme.colorScheme.primary
                            : theme.colorScheme.outlineVariant,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ListTile(
                      leading: AppAvatar(name: account.displayName, size: 36),
                      title: Text(
                        account.displayName,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(account.email),
                          if (account.reconnectNeeded)
                            Text(
                              'Reconnect needed',
                              style: TextStyle(
                                color: theme.colorScheme.error,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                        ],
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (isCurrent)
                            Icon(
                              Icons.check_circle,
                              color: theme.colorScheme.primary,
                              size: 20,
                            ),
                          IconButton(
                            icon: Icon(
                              Icons.delete_outline,
                              color: theme.colorScheme.error,
                              size: 20,
                            ),
                            tooltip: 'Disconnect & delete local data',
                            onPressed: () =>
                                _confirmDisconnect(context, ref, account),
                          ),
                        ],
                      ),
                      onTap: () async {
                        await authService.switchAccount(account.id);
                        if (context.mounted) Navigator.of(context).pop();
                      },
                    ),
                  );
                },
              ),
            ),
            AppSpacing.gapVerticalLg,
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: 'Add Account',
                    variant: AppButtonVariant.secondary,
                    icon: Icons.add,
                    onPressed: () {
                      Navigator.of(context).pop();
                      authService.startOAuthLogin(OAuthProvider.google);
                    },
                  ),
                ),
                AppSpacing.gapHorizontalMd,
                Expanded(
                  child: AppButton(
                    label: 'Sign Out',
                    variant: AppButtonVariant.text,
                    icon: Icons.logout,
                    onPressed: () async {
                      Navigator.of(context).pop();
                      await authService.signOut();
                      if (context.mounted) {
                        context.go('/welcome');
                      }
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDisconnect(
    BuildContext context,
    WidgetRef ref,
    Account account,
  ) {
    showDialog<void>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Disconnect & Delete All Local Data?'),
        content: Text(
          'This will permanently delete all cached emails, threads, drafts, and outbox operations for ${account.email} from this device.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            onPressed: () async {
              Navigator.of(dialogCtx).pop();
              await ref
                  .read(authServiceProvider)
                  .disconnectAndDeleteAccount(account.id);
              if (context.mounted) {
                Navigator.of(context).pop();
              }
            },
            child: const Text('Delete & Disconnect'),
          ),
        ],
      ),
    );
  }
}
