import 'package:flutter/material.dart';
import 'package:inbox_companion/core/theme/tokens/radius_tokens.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/avatar/app_avatar.dart';

/// Rich email & thread list item featuring unread indicators, star actions, dismissible swipe, and label badges.
class AppThreadTile extends StatelessWidget {
  const AppThreadTile({
    super.key,
    required this.id,
    required this.senderName,
    required this.subject,
    required this.snippet,
    required this.timestamp,
    this.isUnread = false,
    this.isStarred = false,
    this.hasAttachments = false,
    this.messageCount = 1,
    this.labels = const [],
    this.isSelected = false,
    this.onTap,
    this.onLongPress,
    this.onStarToggle,
    this.onArchive,
    this.onDelete,
    this.avatarUrl,
  });

  final String id;
  final String senderName;
  final String subject;
  final String snippet;
  final String timestamp;
  final bool isUnread;
  final bool isStarred;
  final bool hasAttachments;
  final int messageCount;
  final List<String> labels;
  final bool isSelected;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final VoidCallback? onStarToggle;
  final VoidCallback? onArchive;
  final VoidCallback? onDelete;
  final String? avatarUrl;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    Widget tileContent = InkWell(
      onTap: onTap,
      onLongPress: onLongPress,
      borderRadius: AppRadius.borderMd,
      child: Container(
        constraints: const BoxConstraints(minHeight: AppSpacing.minTouchTarget),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? colorScheme.primaryContainer.withValues(alpha: 0.35)
              : isUnread
              ? colorScheme.primary.withValues(alpha: 0.05)
              : Colors.transparent,
          border: Border(
            bottom: BorderSide(color: colorScheme.outlineVariant, width: 0.8),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Left: Unread dot + Avatar / Checkmark
            Stack(
              alignment: Alignment.center,
              children: [
                if (isSelected)
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: colorScheme.primary,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check,
                      color: colorScheme.onPrimary,
                      size: 24,
                    ),
                  )
                else
                  AppAvatar(name: senderName, imageUrl: avatarUrl, size: 40),
                if (isUnread && !isSelected)
                  Positioned(
                    top: 0,
                    left: 0,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: colorScheme.primary,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: colorScheme.surface,
                          width: 1.5,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            AppSpacing.gapHorizontalMd,

            // Center: Sender, Subject, Snippet, Labels
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Row 1: Sender & Timestamp
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          senderName,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: isUnread
                                ? FontWeight.w700
                                : FontWeight.w600,
                            color: colorScheme.onSurface,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (messageCount > 1) ...[
                        AppSpacing.gapHorizontalXs,
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 1,
                          ),
                          decoration: BoxDecoration(
                            color: colorScheme.surfaceContainerHighest,
                            borderRadius: AppRadius.borderFull,
                          ),
                          child: Text(
                            '$messageCount',
                            style: theme.textTheme.labelSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                      AppSpacing.gapHorizontalSm,
                      Text(
                        timestamp,
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: isUnread
                              ? colorScheme.primary
                              : colorScheme.onSurfaceVariant,
                          fontWeight: isUnread
                              ? FontWeight.w600
                              : FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),

                  // Row 2: Subject
                  Text(
                    subject,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: isUnread ? FontWeight.w600 : FontWeight.w500,
                      color: colorScheme.onSurface,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),

                  // Row 3: Snippet
                  Text(
                    snippet,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      height: 1.35,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  // Row 4: Attachments and Labels
                  if (hasAttachments || labels.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        if (hasAttachments)
                          Icon(
                            Icons.attach_file,
                            size: 14,
                            color: colorScheme.onSurfaceVariant,
                          ),
                        for (final label in labels)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: colorScheme.surfaceContainerHighest,
                              borderRadius: AppRadius.borderXs,
                              border: Border.all(
                                color: colorScheme.outlineVariant,
                                width: 0.5,
                              ),
                            ),
                            child: Text(
                              label,
                              style: theme.textTheme.labelSmall?.copyWith(
                                fontSize: 10,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            AppSpacing.gapHorizontalSm,

            // Right: Star Action Button (minimum 48dp touch target)
            Semantics(
              button: true,
              label: isStarred ? 'Unstar thread' : 'Star thread',
              child: ConstrainedBox(
                constraints: const BoxConstraints(
                  minWidth: AppSpacing.minTouchTarget,
                  minHeight: AppSpacing.minTouchTarget,
                ),
                child: Center(
                  child: IconButton(
                    icon: Icon(
                      isStarred ? Icons.star : Icons.star_border,
                      color: isStarred
                          ? Colors.amber
                          : colorScheme.onSurfaceVariant,
                      size: 22,
                    ),
                    onPressed: onStarToggle,
                    tooltip: isStarred ? 'Starred' : 'Not starred',
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );

    // If swipeable actions are enabled, wrap in Dismissible
    if (onArchive != null || onDelete != null) {
      tileContent = Dismissible(
        key: Key(id),
        direction: DismissDirection.horizontal,
        background: Container(
          color: colorScheme.secondary,
          alignment: Alignment.centerLeft,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          child: const Icon(
            Icons.archive_outlined,
            color: Colors.white,
            size: 24,
          ),
        ),
        secondaryBackground: Container(
          color: colorScheme.error,
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          child: const Icon(
            Icons.delete_outline,
            color: Colors.white,
            size: 24,
          ),
        ),
        onDismissed: (direction) {
          if (direction == DismissDirection.startToEnd) {
            onArchive?.call();
          } else {
            onDelete?.call();
          }
        },
        child: tileContent,
      );
    }

    return Semantics(
      container: true,
      label:
          'Email thread from $senderName: $subject. ${isUnread ? "Unread." : ""}',
      child: tileContent,
    );
  }
}
