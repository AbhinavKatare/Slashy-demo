import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/tokens/radius_tokens.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';

enum AppIconButtonVariant { standard, filled, tonal, outlined }

/// Accessible icon button guaranteeing minimum 48dp touch target with tooltip support.
class AppIconButton extends StatelessWidget {
  const AppIconButton({
    super.key,
    required this.icon,
    required this.onPressed,
    this.tooltip,
    this.variant = AppIconButtonVariant.standard,
    this.size = 24.0,
    this.color,
    this.semanticLabel,
  });

  final IconData icon;
  final VoidCallback? onPressed;
  final String? tooltip;
  final AppIconButtonVariant variant;
  final double size;
  final Color? color;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isEnabled = onPressed != null;

    Color backgroundColor;
    Color iconColor;
    BorderSide borderSide = BorderSide.none;

    switch (variant) {
      case AppIconButtonVariant.standard:
        backgroundColor = Colors.transparent;
        iconColor = color ?? colorScheme.onSurfaceVariant;
        break;
      case AppIconButtonVariant.filled:
        backgroundColor = colorScheme.primary;
        iconColor = colorScheme.onPrimary;
        break;
      case AppIconButtonVariant.tonal:
        backgroundColor = colorScheme.surfaceContainerHighest;
        iconColor = color ?? colorScheme.onSurface;
        break;
      case AppIconButtonVariant.outlined:
        backgroundColor = Colors.transparent;
        iconColor = color ?? colorScheme.onSurfaceVariant;
        borderSide = BorderSide(color: colorScheme.outlineVariant);
        break;
    }

    if (!isEnabled) {
      backgroundColor =
          variant == AppIconButtonVariant.standard ||
              variant == AppIconButtonVariant.outlined
          ? Colors.transparent
          : colorScheme.surfaceContainerHighest.withValues(alpha: 0.5);
      iconColor = colorScheme.onSurface.withValues(alpha: 0.38);
    }

    Widget button = Material(
      color: backgroundColor,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.borderFull,
        side: borderSide,
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onPressed,
        borderRadius: AppRadius.borderFull,
        child: Container(
          width: AppSpacing.minTouchTarget,
          height: AppSpacing.minTouchTarget,
          alignment: Alignment.center,
          child: Icon(icon, size: size, color: iconColor),
        ),
      ),
    );

    if (tooltip != null) {
      button = Tooltip(message: tooltip!, child: button);
    }

    return Semantics(
      button: true,
      enabled: isEnabled,
      label: semanticLabel ?? tooltip ?? 'Icon action',
      child: button,
    );
  }
}
