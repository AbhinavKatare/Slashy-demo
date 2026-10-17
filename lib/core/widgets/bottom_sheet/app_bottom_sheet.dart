import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/tokens/radius_tokens.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/buttons/app_icon_button.dart';

class AppBottomSheetAction {
  const AppBottomSheetAction({
    required this.title,
    required this.icon,
    required this.onTap,
    this.subtitle,
    this.isDestructive = false,
  });

  final String title;
  final IconData icon;
  final VoidCallback onTap;
  final String? subtitle;
  final bool isDestructive;
}

/// Accessible Bottom Sheet component with drag handle, title header, and action list.
class AppBottomSheet extends StatelessWidget {
  const AppBottomSheet({
    super.key,
    required this.title,
    this.subtitle,
    this.actions = const [],
    this.child,
  });

  final String title;
  final String? subtitle;
  final List<AppBottomSheetAction> actions;
  final Widget? child;

  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    String? subtitle,
    List<AppBottomSheetAction> actions = const [],
    Widget? child,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(borderRadius: AppRadius.topXxl),
      builder: (context) => AppBottomSheet(
        title: title,
        subtitle: subtitle,
        actions: actions,
        child: child,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag Handle
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
                    borderRadius: AppRadius.borderFull,
                  ),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.sm,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          if (subtitle != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              subtitle!,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    AppIconButton(
                      icon: Icons.close,
                      tooltip: 'Close sheet',
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),
              const Divider(),

              // Custom Child or Actions
              if (child != null)
                Padding(padding: AppSpacing.insetAllLg, child: child!),

              if (actions.isNotEmpty) ...[
                for (final action in actions)
                  InkWell(
                    onTap: () {
                      Navigator.of(context).pop();
                      action.onTap();
                    },
                    child: Container(
                      constraints: const BoxConstraints(
                        minHeight: AppSpacing.minTouchTarget,
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.lg,
                        vertical: AppSpacing.md,
                      ),
                      child: Row(
                        children: [
                          Icon(
                            action.icon,
                            color: action.isDestructive
                                ? colorScheme.error
                                : colorScheme.onSurfaceVariant,
                            size: 22,
                          ),
                          AppSpacing.gapHorizontalMd,
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  action.title,
                                  style: theme.textTheme.bodyLarge?.copyWith(
                                    color: action.isDestructive
                                        ? colorScheme.error
                                        : colorScheme.onSurface,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                if (action.subtitle != null)
                                  Text(
                                    action.subtitle!,
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                AppSpacing.gapVerticalSm,
              ],
            ],
          ),
        ),
      ),
    );
  }
}
