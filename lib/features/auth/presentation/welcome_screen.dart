import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inbox_companion/core/auth/auth_state.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/buttons/app_button.dart';
import 'package:inbox_companion/features/auth/presentation/permissions_explainer_sheet.dart';

class WelcomeScreen extends ConsumerWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final authService = ref.watch(authServiceProvider);
    final authState = authService.state;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          child: Column(
            children: [
              const Spacer(flex: 2),
              // App Icon / Logo
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      theme.colorScheme.primary,
                      theme.colorScheme.tertiary,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: theme.colorScheme.primary.withValues(alpha: 0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.all_inbox_rounded,
                  size: 40,
                  color: Colors.white,
                ),
              ),
              AppSpacing.gapVerticalLg,
              Text(
                'Inbox Companion',
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
              AppSpacing.gapVerticalSm,
              Text(
                'Offline-first, privacy-respecting productivity companion. Fast, resilient, and honest.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const Spacer(flex: 3),
              if (authState.status == AuthStatus.authenticating) ...[
                const CircularProgressIndicator(),
                AppSpacing.gapVerticalMd,
                Text(
                  'Authenticating securely via browser...',
                  style: theme.textTheme.bodySmall,
                ),
                const Spacer(),
              ] else ...[
                // Google OAuth Button
                AppButton(
                  label: 'Sign in with Google',
                  icon: Icons.g_mobiledata_rounded,
                  variant: AppButtonVariant.primary,
                  onPressed: () =>
                      authService.startOAuthLogin(OAuthProvider.google),
                ),
                AppSpacing.gapVerticalMd,
                // Microsoft OAuth Button
                AppButton(
                  label: 'Sign in with Microsoft',
                  icon: Icons.window_rounded,
                  variant: AppButtonVariant.secondary,
                  onPressed: () =>
                      authService.startOAuthLogin(OAuthProvider.microsoft),
                ),
                AppSpacing.gapVerticalMd,
                // Demo Mode Button (Explicitly labeled)
                AppButton(
                  label: 'Explore Demo Mode (Mock Backend)',
                  icon: Icons.science_outlined,
                  variant: AppButtonVariant.tonal,
                  onPressed: () async {
                    await authService.enableDemoMode();
                    if (context.mounted) {
                      context.go('/inbox');
                    }
                  },
                ),
                AppSpacing.gapVerticalLg,
                // Honest consent explainer link
                TextButton.icon(
                  onPressed: () {
                    showModalBottomSheet<void>(
                      context: context,
                      isScrollControlled: true,
                      builder: (ctx) => const PermissionsExplainerSheet(),
                    );
                  },
                  icon: const Icon(Icons.privacy_tip_outlined, size: 16),
                  label: const Text('How we protect your credentials'),
                ),
                const Spacer(),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
