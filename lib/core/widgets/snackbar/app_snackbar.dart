import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/tokens/radius_tokens.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';

enum AppSnackbarType { info, success, warning, error }

typedef AppSnackbarVariant = AppSnackbarType;

/// Accessible floating snackbar with optional timed "Undo" action.
class AppSnackbar {
  const AppSnackbar._();

  static void show(
    BuildContext context, {
    required String message,
    AppSnackbarType type = AppSnackbarType.info,
    AppSnackbarType? variant,
    String actionLabel = 'Undo',
    VoidCallback? onAction,
    Duration duration = const Duration(seconds: 4),
  }) {
    final effectiveType = variant ?? type;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = colorScheme.brightness == Brightness.dark;

    Color iconColor;
    IconData iconData;

    switch (effectiveType) {
      case AppSnackbarType.info:
        iconColor = colorScheme.primary;
        iconData = Icons.info_outline;
        break;
      case AppSnackbarType.success:
        iconColor = const Color(0xFF22C55E);
        iconData = Icons.check_circle_outline;
        break;
      case AppSnackbarType.warning:
        iconColor = const Color(0xFFF59E0B);
        iconData = Icons.warning_amber_rounded;
        break;
      case AppSnackbarType.error:
        iconColor = colorScheme.error;
        iconData = Icons.error_outline;
        break;
    }

    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();

    messenger.showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        duration: duration,
        elevation: 4,
        margin: const EdgeInsets.all(AppSpacing.lg),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        backgroundColor: isDark
            ? colorScheme.surfaceContainerHighest
            : colorScheme.inverseSurface,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.borderMd),
        content: Row(
          children: [
            Icon(iconData, color: iconColor, size: 20),
            AppSpacing.gapHorizontalMd,
            Expanded(
              child: Text(
                message,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: isDark
                      ? colorScheme.onSurface
                      : colorScheme.onInverseSurface,
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        action: onAction != null
            ? SnackBarAction(
                label: actionLabel,
                textColor: isDark
                    ? colorScheme.primary
                    : colorScheme.inversePrimary,
                onPressed: onAction,
              )
            : null,
      ),
    );
  }
}
