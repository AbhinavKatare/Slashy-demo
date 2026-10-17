import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/tokens/radius_tokens.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';

enum AppChipVariant { filter, suggestion, status }

/// Accessible chip component ensuring 48dp touch targets and resilient text scaling.
class AppChip extends StatelessWidget {
  const AppChip({
    super.key,
    required this.label,
    this.onTap,
    this.variant = AppChipVariant.filter,
    this.isSelected = false,
    this.leadingIcon,
    this.statusColor,
    this.trailingIcon,
    this.onTrailingTap,
    this.semanticLabel,
  });

  final String label;
  final VoidCallback? onTap;
  final AppChipVariant variant;
  final bool isSelected;
  final IconData? leadingIcon;
  final Color? statusColor;
  final IconData? trailingIcon;
  final VoidCallback? onTrailingTap;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    Color backgroundColor;
    Color textColor;
    BorderSide borderSide = BorderSide.none;

    switch (variant) {
      case AppChipVariant.filter:
        if (isSelected) {
          backgroundColor = colorScheme.primaryContainer;
          textColor = colorScheme.onPrimaryContainer;
          borderSide = BorderSide(
            color: colorScheme.primary.withValues(alpha: 0.5),
          );
        } else {
          backgroundColor = colorScheme.surface;
          textColor = colorScheme.onSurfaceVariant;
          borderSide = BorderSide(color: colorScheme.outlineVariant);
        }
        break;

      case AppChipVariant.suggestion:
        backgroundColor = colorScheme.surfaceContainerHighest.withValues(
          alpha: 0.6,
        );
        textColor = colorScheme.onSurface;
        borderSide = BorderSide(color: colorScheme.outlineVariant);
        break;

      case AppChipVariant.status:
        backgroundColor = (statusColor ?? colorScheme.primary).withValues(
          alpha: 0.12,
        );
        textColor = statusColor ?? colorScheme.primary;
        borderSide = BorderSide(
          color: (statusColor ?? colorScheme.primary).withValues(alpha: 0.3),
        );
        break;
    }

    Widget? leading;
    if (variant == AppChipVariant.filter && isSelected) {
      leading = Icon(Icons.check, size: 16, color: textColor);
    } else if (variant == AppChipVariant.status) {
      leading = Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(
          color: statusColor ?? colorScheme.primary,
          shape: BoxShape.circle,
        ),
      );
    } else if (leadingIcon != null) {
      leading = Icon(leadingIcon, size: 16, color: textColor);
    }

    final chipBody = Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: AppRadius.borderFull,
        border: borderSide != BorderSide.none
            ? Border.fromBorderSide(borderSide)
            : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (leading != null) ...[leading, AppSpacing.gapHorizontalSm],
          Flexible(
            child: Text(
              label,
              style: theme.textTheme.labelMedium?.copyWith(
                color: textColor,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (trailingIcon != null) ...[
            AppSpacing.gapHorizontalSm,
            GestureDetector(
              onTap: onTrailingTap ?? onTap,
              child: Icon(trailingIcon, size: 16, color: textColor),
            ),
          ],
        ],
      ),
    );

    return Semantics(
      button: onTap != null,
      selected: isSelected,
      label: semanticLabel ?? '$label chip',
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          minHeight: AppSpacing.minTouchTarget,
          minWidth: AppSpacing.minTouchTarget,
        ),
        child: Center(
          child: Material(
            color: Colors.transparent,
            borderRadius: AppRadius.borderFull,
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: onTap,
              borderRadius: AppRadius.borderFull,
              child: chipBody,
            ),
          ),
        ),
      ),
    );
  }
}
