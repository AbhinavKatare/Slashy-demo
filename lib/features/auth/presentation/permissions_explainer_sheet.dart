import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/buttons/app_button.dart';

class PermissionsExplainerSheet extends StatelessWidget {
  const PermissionsExplainerSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.shield_outlined,
                size: 28,
                color: theme.colorScheme.primary,
              ),
              AppSpacing.gapHorizontalSm,
              Text(
                'Honest Permissions & Privacy',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          AppSpacing.gapVerticalMd,
          Text(
            'Inbox Companion connects directly to your email provider via official OAuth. We never handle, see, or store your mailbox password.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          AppSpacing.gapVerticalLg,
          _buildItem(
            context,
            icon: Icons.mark_email_read_outlined,
            title: 'Read & Send Emails',
            description: 'Used exclusively to display your inbox offline and send emails you draft.',
          ),
          AppSpacing.gapVerticalMd,
          _buildItem(
            context,
            icon: Icons.label_outline,
            title: 'Manage Folders & Labels',
            description: 'Syncs message organization like Archive, Trash, and Starred across devices.',
          ),
          AppSpacing.gapVerticalMd,
          _buildItem(
            context,
            icon: Icons.lock_clock_outlined,
            title: 'Encrypted Local Storage',
            description: 'Data is cached locally on your device in SQLite. You can wipe all data at any time.',
          ),
          AppSpacing.gapVerticalXl,
          AppButton(
            label: 'I Understand',
            variant: AppButtonVariant.primary,
            onPressed: () => Navigator.of(context).pop(),
          ),
          AppSpacing.gapVerticalMd,
        ],
      ),
    );
  }

  Widget _buildItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String description,
  }) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(AppSpacing.xs),
          decoration: BoxDecoration(
            color: theme.colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 20, color: theme.colorScheme.primary),
        ),
        AppSpacing.gapHorizontalMd,
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              AppSpacing.gapVerticalXs,
              Text(
                description,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
