import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inbox_companion/core/theme/tokens/elevation_tokens.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/snackbar/app_snackbar.dart';
import 'package:inbox_companion/features/productivity/application/productivity_controller.dart';
import 'package:inbox_companion/features/productivity/domain/snooze_preset.dart';
import 'package:intl/intl.dart';

class SnoozeModalSheet extends ConsumerWidget {
  const SnoozeModalSheet({
    super.key,
    required this.threadId,
    required this.accountId,
    required this.threadSubject,
  });

  final String threadId;
  final String accountId;
  final String threadSubject;

  static Future<void> show(
    BuildContext context, {
    required String threadId,
    required String accountId,
    required String threadSubject,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => SnoozeModalSheet(
        threadId: threadId,
        accountId: accountId,
        threadSubject: threadSubject,
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final options = SnoozeCalculator.generateOptions();
    final tz = DateTime.now().timeZoneName;

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
                Icon(Icons.snooze, color: theme.colorScheme.primary),
                const SizedBox(width: SpacingTokens.xs),
                Text(
                  'Snooze Conversation',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Text(
                  '($tz)',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: SpacingTokens.sm),
            Text(
              'Select when you want this conversation to return to your inbox:',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: SpacingTokens.md),

            ...options.map((opt) {
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: opt.isFollowUp
                        ? theme.colorScheme.tertiaryContainer
                        : theme.colorScheme.primaryContainer,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    opt.isFollowUp ? Icons.reply_all : Icons.access_time,
                    size: 18,
                    color: opt.isFollowUp
                        ? theme.colorScheme.onTertiaryContainer
                        : theme.colorScheme.onPrimaryContainer,
                  ),
                ),
                title: Text(
                  opt.title,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Text(opt.description),
                onTap: () async {
                  Navigator.of(context).pop();
                  await ref
                      .read(productivityControllerProvider)
                      .snoozeThread(
                        threadId: threadId,
                        accountId: accountId,
                        threadSubject: threadSubject,
                        targetTime: opt.targetTime,
                        note: opt.isFollowUp
                            ? 'Follow-up reminder: No reply received'
                            : 'Snoozed until ${opt.title}',
                      );
                  if (context.mounted) {
                    AppSnackbar.show(
                      context,
                      message:
                          'Conversation snoozed until ${DateFormat('EEE, MMM d @ h:mm a').format(opt.targetTime)}',
                      variant: AppSnackbarVariant.success,
                    );
                  }
                },
              );
            }),

            const Divider(),

            // Custom Date and Time
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
                  size: 18,
                  color: theme.colorScheme.onSecondaryContainer,
                ),
              ),
              title: const Text(
                'Custom date & time',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: const Text('Pick exact date and time'),
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

                final target = DateTime(
                  date.year,
                  date.month,
                  date.day,
                  time.hour,
                  time.minute,
                );

                Navigator.of(context).pop();
                await ref
                    .read(productivityControllerProvider)
                    .snoozeThread(
                      threadId: threadId,
                      accountId: accountId,
                      threadSubject: threadSubject,
                      targetTime: target,
                    );
                if (context.mounted) {
                  AppSnackbar.show(
                    context,
                    message:
                        'Conversation snoozed until ${DateFormat('EEE, MMM d @ h:mm a').format(target)}',
                    variant: AppSnackbarVariant.success,
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
