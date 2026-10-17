import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/avatar/app_avatar.dart';
import 'package:inbox_companion/core/widgets/bottom_sheet/app_bottom_sheet.dart';
import 'package:inbox_companion/core/widgets/buttons/app_button.dart';
import 'package:inbox_companion/core/widgets/buttons/app_icon_button.dart';
import 'package:inbox_companion/core/widgets/chips/app_chip.dart';
import 'package:inbox_companion/core/widgets/command_palette/app_command_palette_field.dart';
import 'package:inbox_companion/core/widgets/empty_state/app_empty_state.dart';
import 'package:inbox_companion/core/widgets/empty_state/app_error_state.dart';
import 'package:inbox_companion/core/widgets/list_tile/app_thread_tile.dart';
import 'package:inbox_companion/core/widgets/skeleton/app_skeleton.dart';
import 'package:inbox_companion/core/widgets/snackbar/app_snackbar.dart';

/// Interactive Component Gallery screen designed for design system auditing and debugging.
class ComponentGalleryScreen extends StatefulWidget {
  const ComponentGalleryScreen({
    super.key,
    this.onToggleThemeMode,
    this.currentThemeMode = ThemeMode.system,
  });

  final ValueChanged<ThemeMode>? onToggleThemeMode;
  final ThemeMode currentThemeMode;

  @override
  State<ComponentGalleryScreen> createState() => _ComponentGalleryScreenState();
}

class _ComponentGalleryScreenState extends State<ComponentGalleryScreen> {
  bool _starred = true;
  final Set<String> _selectedChips = {'Inbox', 'Design System'};
  double _textScaleFactor = 1.0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return MediaQuery(
      data: MediaQuery.of(context)
          .copyWith(textScaler: TextScaler.linear(_textScaleFactor)),
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Design System Gallery'),
          actions: [
            PopupMenuButton<ThemeMode>(
              icon: const Icon(Icons.brightness_medium),
              tooltip: 'Theme mode',
              onSelected: widget.onToggleThemeMode,
              itemBuilder: (context) => const [
                PopupMenuItem(
                  value: ThemeMode.light,
                  child: Text('Light Mode'),
                ),
                PopupMenuItem(value: ThemeMode.dark, child: Text('Dark Mode')),
                PopupMenuItem(
                  value: ThemeMode.system,
                  child: Text('System Default'),
                ),
              ],
            ),
          ],
        ),
        body: ListView(
          padding: AppSpacing.insetAllLg,
          children: [
            // Controls section
            _buildSectionHeader(
              'Accessibility & Text Scaling (up to 200%)',
              theme,
            ),
            Wrap(
              spacing: 8,
              children: [1.0, 1.25, 1.5, 1.75, 2.0].map((scale) {
                return ChoiceChip(
                  label: Text('${(scale * 100).toInt()}%'),
                  selected: _textScaleFactor == scale,
                  onSelected: (selected) {
                    if (selected) setState(() => _textScaleFactor = scale);
                  },
                );
              }).toList(),
            ),
            AppSpacing.gapVerticalLg,

            // Command Palette
            _buildSectionHeader('Command Palette Field', theme),
            const AppCommandPaletteField(),
            AppSpacing.gapVerticalXl,

            // Buttons
            _buildSectionHeader('Buttons (Minimum 48dp Target)', theme),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                AppButton(
                  label: 'Primary',
                  variant: AppButtonVariant.primary,
                  onPressed: () {},
                ),
                AppButton(
                  label: 'Secondary',
                  variant: AppButtonVariant.secondary,
                  onPressed: () {},
                ),
                AppButton(
                  label: 'Tonal',
                  variant: AppButtonVariant.tonal,
                  onPressed: () {},
                ),
                AppButton(
                  label: 'Destructive',
                  variant: AppButtonVariant.destructive,
                  onPressed: () {},
                ),
                AppButton(
                  label: 'Text Action',
                  variant: AppButtonVariant.text,
                  onPressed: () {},
                ),
                AppButton(
                  label: 'Loading State',
                  isLoading: true,
                  onPressed: () {},
                ),
              ],
            ),
            AppSpacing.gapVerticalXl,

            // Icon Buttons
            _buildSectionHeader('Icon Buttons', theme),
            Row(
              children: [
                AppIconButton(
                  icon: Icons.send_rounded,
                  tooltip: 'Send',
                  variant: AppIconButtonVariant.filled,
                  onPressed: () {},
                ),
                AppSpacing.gapHorizontalMd,
                AppIconButton(
                  icon: Icons.archive_outlined,
                  tooltip: 'Archive',
                  variant: AppIconButtonVariant.tonal,
                  onPressed: () {},
                ),
                AppSpacing.gapHorizontalMd,
                AppIconButton(
                  icon: Icons.delete_outline,
                  tooltip: 'Delete',
                  variant: AppIconButtonVariant.outlined,
                  onPressed: () {},
                ),
                AppSpacing.gapHorizontalMd,
                AppIconButton(
                  icon: Icons.more_vert,
                  tooltip: 'More',
                  variant: AppIconButtonVariant.standard,
                  onPressed: () {},
                ),
              ],
            ),
            AppSpacing.gapVerticalXl,

            // Chips
            _buildSectionHeader('Chips (Filter, Suggestion, Status)', theme),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final name in [
                  'Inbox',
                  'Design System',
                  'Urgent',
                  'Roadmap',
                ])
                  AppChip(
                    label: name,
                    variant: AppChipVariant.filter,
                    isSelected: _selectedChips.contains(name),
                    onTap: () {
                      setState(() {
                        if (_selectedChips.contains(name)) {
                          _selectedChips.remove(name);
                        } else {
                          _selectedChips.add(name);
                        }
                      });
                    },
                  ),
                const AppChip(
                  label: 'Synced',
                  variant: AppChipVariant.status,
                  statusColor: Color(0xFF22C55E),
                ),
                const AppChip(
                  label: 'Offline Pending',
                  variant: AppChipVariant.status,
                  statusColor: Color(0xFFF59E0B),
                ),
                AppChip(
                  label: 'Summarize Thread',
                  variant: AppChipVariant.suggestion,
                  leadingIcon: Icons.auto_awesome,
                  onTap: () {},
                ),
              ],
            ),
            AppSpacing.gapVerticalXl,

            // Avatars
            _buildSectionHeader(
              'Avatars with Initials & Status Indicator',
              theme,
            ),
            const Row(
              children: [
                AppAvatar(
                  name: 'Alex Morgan',
                  size: 48,
                  status: AppAvatarStatus.online,
                ),
                SizedBox(width: 12),
                AppAvatar(
                  name: 'Jordan Lee',
                  size: 40,
                  status: AppAvatarStatus.busy,
                ),
                SizedBox(width: 12),
                AppAvatar(
                  name: 'Dr. Priya Sharma',
                  size: 36,
                  status: AppAvatarStatus.away,
                ),
                SizedBox(width: 12),
                AppAvatar(
                  name: 'Samira Khan',
                  size: 32,
                  status: AppAvatarStatus.offline,
                ),
              ],
            ),
            AppSpacing.gapVerticalXl,

            // Thread Tile
            _buildSectionHeader('List Tile / Thread Preview', theme),
            Card(
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  AppThreadTile(
                    id: 'th_001',
                    senderName: 'Jordan Lee',
                    subject: 'Q3 Product Roadmap & Motion Specs',
                    snippet: 'The proposed Material 3 tokens look great. Verified the 48dp minimum bounding box.',
                    timestamp: '10:45 AM',
                    isUnread: true,
                    isStarred: _starred,
                    hasAttachments: true,
                    labels: const ['Design System', 'Roadmap'],
                    onStarToggle: () => setState(() => _starred = !_starred),
                    onTap: () {},
                  ),
                  AppThreadTile(
                    id: 'th_002',
                    senderName: 'Dr. Priya Sharma',
                    subject: 'Idempotency Key Verification Test Run',
                    snippet: 'All write requests now successfully pass a UUID v4 header.',
                    timestamp: 'Yesterday',
                    isUnread: false,
                    isStarred: false,
                    labels: const ['Urgent'],
                    onStarToggle: () {},
                    onTap: () {},
                  ),
                ],
              ),
            ),
            AppSpacing.gapVerticalXl,

            // Skeleton Shimmer
            _buildSectionHeader('Skeleton Loaders (Shimmer)', theme),
            const Card(child: AppSkeletonThreadTile()),
            AppSpacing.gapVerticalXl,

            // Empty & Error States
            _buildSectionHeader('Empty & Error States', theme),
            const Card(
              child: AppEmptyState(
                title: 'All Caught Up',
                message:
                    'Your inbox is clear! Enjoy your productive focus time.',
                actionLabel: 'Check Archive',
              ),
            ),
            AppSpacing.gapVerticalMd,
            Card(
              child: AppErrorState(
                message: 'Unable to reach the sync service. Idempotent retry queued.',
                onRetry: () {},
              ),
            ),
            AppSpacing.gapVerticalXl,

            // BottomSheet and Snackbar triggers
            _buildSectionHeader('Dialogs, Bottom Sheets & Snackbars', theme),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                AppButton(
                  label: 'Show Modal Bottom Sheet',
                  icon: Icons.vertical_align_top,
                  onPressed: () {
                    AppBottomSheet.show<void>(
                      context: context,
                      title: 'Thread Actions',
                      subtitle: 'Choose an action for thread #th_001',
                      actions: [
                        AppBottomSheetAction(
                          title: 'Mark as Unread',
                          icon: Icons.mark_email_unread_outlined,
                          onTap: () {},
                        ),
                        AppBottomSheetAction(
                          title: 'Snooze Reminder',
                          icon: Icons.alarm,
                          subtitle: 'Remind me tomorrow at 9:00 AM',
                          onTap: () {},
                        ),
                        AppBottomSheetAction(
                          title: 'Move to Trash',
                          icon: Icons.delete_outline,
                          isDestructive: true,
                          onTap: () {},
                        ),
                      ],
                    );
                  },
                ),
                AppButton(
                  label: 'Trigger Snackbar with Undo',
                  icon: Icons.undo,
                  variant: AppButtonVariant.tonal,
                  onPressed: () {
                    AppSnackbar.show(
                      context,
                      message: 'Conversation archived.',
                      type: AppSnackbarType.success,
                      actionLabel: 'Undo',
                      onAction: () {},
                    );
                  },
                ),
              ],
            ),
            AppSpacing.gapVerticalXxl,
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Text(
        title,
        style: theme.textTheme.titleMedium?.copyWith(
          color: theme.colorScheme.primary,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
