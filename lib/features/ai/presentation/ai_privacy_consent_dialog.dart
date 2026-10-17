import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/button/app_button.dart';

class AiPrivacyConsentDialog extends StatelessWidget {
  const AiPrivacyConsentDialog({super.key});

  static Future<bool?> show(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (_) => const AiPrivacyConsentDialog(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return AlertDialog(
      title: Row(
        children: [
          Icon(Icons.auto_awesome, color: theme.colorScheme.primary),
          const SizedBox(width: SpacingTokens.xs),
          const Text('Enable AI Assistance?'),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Honest Privacy Notice & Data Boundaries:',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: SpacingTokens.sm),
            _buildBullet(
              context,
              'Only Thread Content Sent: When you request a summary or draft reply, ONLY the text of the currently selected conversation is transmitted.',
            ),
            const SizedBox(height: SpacingTokens.xs),
            _buildBullet(
              context,
              'Zero Credential Access: The AI service never accesses your email passwords, session tokens, other folders, or unread mailboxes.',
            ),
            const SizedBox(height: SpacingTokens.xs),
            _buildBullet(
              context,
              'Zero Autonomous Writes: AI output strictly populates an editable draft labeled "AI-generated". It CANNOT send emails, archive, trash, or modify calendar items.',
            ),
            const SizedBox(height: SpacingTokens.xs),
            _buildBullet(
              context,
              'No Model Training: Your conversation data is never retained or used to train public machine learning models.',
            ),
            const SizedBox(height: SpacingTokens.md),
            Container(
              padding: const EdgeInsets.all(SpacingTokens.sm),
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer.withValues(
                  alpha: 0.4,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'You can revoke this consent or turn AI off at any time in Settings.',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onPrimaryContainer,
                ),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('Decline (Keep Off)'),
        ),
        AppButton(
          label: 'I Understand & Consent',
          onPressed: () => Navigator.of(context).pop(true),
        ),
      ],
    );
  }

  Widget _buildBullet(BuildContext context, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('• ', style: TextStyle(fontWeight: FontWeight.bold)),
        Expanded(
          child: Text(text, style: Theme.of(context).textTheme.bodySmall),
        ),
      ],
    );
  }
}
