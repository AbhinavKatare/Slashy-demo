import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/tokens/radius_tokens.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';

enum AppButtonVariant { primary, secondary, tonal, destructive, text }

enum AppButtonSize {
  small(height: 36, horizontalPadding: 12),
  medium(height: 48, horizontalPadding: 16),
  large(height: 56, horizontalPadding: 24);

  const AppButtonSize({required this.height, required this.horizontalPadding});
  final double height;
  final double horizontalPadding;
}

/// Accessible button component ensuring a minimum 48dp touch target across all sizes and variants.
class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.medium,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = false,
    this.semanticLabel,
  });

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final IconData? icon;
  final bool isLoading;
  final bool isFullWidth;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isEnabled = onPressed != null && !isLoading;

    Color backgroundColor;
    Color foregroundColor;
    BorderSide borderSide = BorderSide.none;

    switch (variant) {
      case AppButtonVariant.primary:
        backgroundColor = colorScheme.primary;
        foregroundColor = colorScheme.onPrimary;
        break;
      case AppButtonVariant.secondary:
        backgroundColor = Colors.transparent;
        foregroundColor = colorScheme.primary;
        borderSide = BorderSide(color: colorScheme.outline, width: 1.5);
        break;
      case AppButtonVariant.tonal:
        backgroundColor = colorScheme.primaryContainer;
        foregroundColor = colorScheme.onPrimaryContainer;
        break;
      case AppButtonVariant.destructive:
        backgroundColor = colorScheme.error;
        foregroundColor = colorScheme.onError;
        break;
      case AppButtonVariant.text:
        backgroundColor = Colors.transparent;
        foregroundColor = colorScheme.primary;
        break;
    }

    if (!isEnabled) {
      backgroundColor =
          variant == AppButtonVariant.text ||
              variant == AppButtonVariant.secondary
          ? Colors.transparent
          : colorScheme.surfaceContainerHighest;
      foregroundColor = colorScheme.onSurface.withValues(alpha: 0.38);
      if (variant == AppButtonVariant.secondary) {
        borderSide = BorderSide(color: colorScheme.outlineVariant);
      }
    }

    final Widget content = Row(
      mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading) ...[
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(foregroundColor),
            ),
          ),
          AppSpacing.gapHorizontalSm,
        ] else if (icon != null) ...[
          Icon(icon, size: 18, color: foregroundColor),
          AppSpacing.gapHorizontalSm,
        ],
        Flexible(
          child: Text(
            label,
            style: theme.textTheme.labelLarge?.copyWith(
              color: foregroundColor,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );

    final buttonWidget = Material(
      color: backgroundColor,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.borderMd,
        side: borderSide,
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: isEnabled ? onPressed : null,
        borderRadius: AppRadius.borderMd,
        child: Container(
          height: size.height,
          padding: EdgeInsets.symmetric(horizontal: size.horizontalPadding),
          alignment: Alignment.center,
          child: content,
        ),
      ),
    );

    return Semantics(
      button: true,
      enabled: isEnabled,
      label: semanticLabel,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          minHeight: AppSpacing.minTouchTarget,
          minWidth: isFullWidth ? double.infinity : AppSpacing.minTouchTarget,
        ),
        child: Center(
          widthFactor: isFullWidth ? 1.0 : null,
          child: SizedBox(
            width: isFullWidth ? double.infinity : null,
            child: buttonWidget,
          ),
        ),
      ),
    );
  }
}
