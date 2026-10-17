import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/buttons/app_button.dart';

class AppLockScreen extends ConsumerWidget {
  const AppLockScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final authService = ref.watch(authServiceProvider);

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.lock_rounded,
                    size: 48,
                    color: theme.colorScheme.onPrimaryContainer,
                  ),
                ),
                AppSpacing.gapVerticalLg,
                Text(
                  'Inbox Companion Locked',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                AppSpacing.gapVerticalSm,
                Text(
                  'Authenticate with biometrics or device PIN to continue.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                AppSpacing.gapVerticalXl,
                AppButton(
                  label: 'Unlock with Biometrics',
                  icon: Icons.fingerprint_rounded,
                  variant: AppButtonVariant.primary,
                  onPressed: () => authService.unlockWithBiometrics(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
