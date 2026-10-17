import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/tokens/elevation_tokens.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/buttons/app_button.dart';
import 'package:inbox_companion/features/compose/domain/schedule_preset.dart';

/// Modal bottom sheet for choosing Schedule Send presets or custom date/time
class ScheduleSendSheet extends StatelessWidget {
  const ScheduleSendSheet({
    super.key,
    required this.onScheduleSelected,
    this.currentlyScheduled,
  });

  final ValueChanged<DateTime?> onScheduleSelected;
  final DateTime? currentlyScheduled;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final presets = SchedulePreset.generatePresets();
    final tzName = DateTime.now().timeZoneName;

    return Container(
      padding: const EdgeInsets.all(SpacingTokens.lg),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2230) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: ElevationTokens.elevation4,
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: SpacingTokens.md),
                decoration: BoxDecoration(
                  color: isDark ? Colors.grey[700] : Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              children: [
                Icon(Icons.schedule, color: theme.colorScheme.primary),
                const SizedBox(width: SpacingTokens.xs),
                Text(
                  'Schedule Send',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: SpacingTokens.xs,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'Timezone: $tzName',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: SpacingTokens.sm),
            Text(
              'Select a preset delivery window or pick a specific date and time.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: SpacingTokens.md),

            // Presets
            ...presets.map((preset) {
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.access_time,
                    size: 20,
                    color: theme.colorScheme.onPrimaryContainer,
                  ),
                ),
                title: Text(
                  preset.label,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Text(preset.description),
                onTap: () {
                  Navigator.of(context).pop();
                  onScheduleSelected(preset.scheduledTime);
                },
              );
            }),

            const Divider(),

            // Custom date/time picker
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: theme.colorScheme.secondaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.edit_calendar,
                  size: 20,
                  color: theme.colorScheme.onSecondaryContainer,
                ),
              ),
              title: const Text(
                'Pick custom date & time',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text('Configure custom delivery ($tzName)'),
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now().add(const Duration(days: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365)),
                );
                if (date == null || !context.mounted) return;

                final time = await showTimePicker(
                  context: context,
                  initialTime: const TimeOfDay(hour: 9, minute: 0),
                );
                if (time == null || !context.mounted) return;

                final scheduled = DateTime(
                  date.year,
                  date.month,
                  date.day,
                  time.hour,
                  time.minute,
                );

                Navigator.of(context).pop();
                onScheduleSelected(scheduled);
              },
            ),

            if (currentlyScheduled != null) ...[
              const SizedBox(height: SpacingTokens.xs),
              AppButton(
                label: 'Remove Scheduled Time (Send Normally)',
                variant: AppButtonVariant.text,
                onPressed: () {
                  Navigator.of(context).pop();
                  onScheduleSelected(null);
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}
