import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/tokens/elevation_tokens.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/buttons/app_button.dart';
import 'package:inbox_companion/features/compose/application/compose_state.dart';
import 'package:intl/intl.dart';

/// Modal bottom sheet requiring explicit user confirmation before message dispatch
class ComposeReviewSheet extends StatelessWidget {
  const ComposeReviewSheet({
    super.key,
    required this.state,
    required this.onConfirmSend,
  });

  final ComposeState state;
  final VoidCallback onConfirmSend;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2230) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: AppElevation.shadowLevel4(theme.shadowColor),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: AppSpacing.md),
                decoration: BoxDecoration(
                  color: isDark ? Colors.grey[700] : Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              children: [
                Icon(
                  Icons.rate_review_outlined,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  'Review Message Before Sending',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            const Divider(),
            const SizedBox(height: AppSpacing.xs),

            // Account
            _buildReviewRow(
              context,
              label: 'From Account:',
              value: state.accountId,
              icon: Icons.account_circle_outlined,
            ),
            const SizedBox(height: AppSpacing.xs),

            // Recipients
            _buildReviewRow(
              context,
              label: 'To (${state.toRecipients.length}):',
              value: state.toRecipients.map((r) => r.email).join(', '),
              icon: Icons.people_outline,
            ),
            if (state.ccRecipients.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.xs),
              _buildReviewRow(
                context,
                label: 'Cc (${state.ccRecipients.length}):',
                value: state.ccRecipients.map((r) => r.email).join(', '),
                icon: Icons.copy_outlined,
              ),
            ],
            if (state.bccRecipients.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.xs),
              _buildReviewRow(
                context,
                label: 'Bcc (${state.bccRecipients.length}):',
                value: state.bccRecipients.map((r) => r.email).join(', '),
                icon: Icons.visibility_off_outlined,
              ),
            ],
            const SizedBox(height: AppSpacing.xs),

            // Subject
            _buildReviewRow(
              context,
              label: 'Subject:',
              value: state.subject.isEmpty ? '(No Subject)' : state.subject,
              icon: Icons.subject,
            ),
            const SizedBox(height: AppSpacing.xs),

            // Attachments
            if (state.attachments.isNotEmpty) ...[
              _buildReviewRow(
                context,
                label: 'Attachments:',
                value:
                    '${state.attachments.length} files (${(state.totalAttachmentBytes / 1024).toStringAsFixed(1)} KB)',
                icon: Icons.attach_file,
              ),
              const SizedBox(height: AppSpacing.xs),
            ],

            // Scheduled Send indicator
            if (state.scheduledSendAt != null) ...[
              _buildReviewRow(
                context,
                label: 'Scheduled For:',
                value:
                    '${DateFormat('EEE, MMM d, yyyy @ h:mm a').format(state.scheduledSendAt!.toLocal())} (${DateTime.now().timeZoneName})',
                icon: Icons.schedule,
                highlightColor: theme.colorScheme.primary,
              ),
              const SizedBox(height: AppSpacing.xs),
            ],

            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest.withValues(
                  alpha: 0.5,
                ),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: theme.colorScheme.outlineVariant),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.verified_user_outlined,
                    size: 16,
                    color: theme.colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Human-Approved Send Rule: No AI or automation can dispatch this email. Your explicit tap below is required.',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.md),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    label: 'Back to Edit',
                    variant: AppButtonVariant.secondary,
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: AppButton(
                    label: state.scheduledSendAt != null
                        ? 'Schedule Send'
                        : 'Confirm & Send',
                    icon: state.scheduledSendAt != null
                        ? Icons.schedule_send
                        : Icons.send,
                    variant: AppButtonVariant.primary,
                    onPressed: () {
                      Navigator.of(context).pop();
                      onConfirmSend();
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewRow(
    BuildContext context, {
    required String label,
    required String value,
    required IconData icon,
    Color? highlightColor,
  }) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: theme.colorScheme.onSurfaceVariant),
        const SizedBox(width: AppSpacing.xs),
        SizedBox(
          width: 90,
          child: Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: highlightColor ?? theme.colorScheme.onSurface,
              fontWeight: highlightColor != null
                  ? FontWeight.bold
                  : FontWeight.normal,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
