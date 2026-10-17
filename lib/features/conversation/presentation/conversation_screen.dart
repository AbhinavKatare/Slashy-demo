import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/avatar/app_avatar.dart';
import 'package:inbox_companion/core/widgets/buttons/app_button.dart';
import 'package:inbox_companion/core/widgets/snackbar/app_snackbar.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:inbox_companion/data/sync/sync_service.dart';
import 'package:inbox_companion/features/ai/presentation/ai_draft_reply_sheet.dart';
import 'package:inbox_companion/features/ai/presentation/thread_summary_card.dart';
import 'package:inbox_companion/features/conversation/presentation/safe_email_view.dart';
import 'package:inbox_companion/features/productivity/application/productivity_controller.dart';
import 'package:inbox_companion/features/productivity/presentation/snooze_modal_sheet.dart';
import 'package:intl/intl.dart';

class ConversationScreen extends ConsumerWidget {
  const ConversationScreen({super.key, required this.threadId});

  final String threadId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final db = ref.watch(appDatabaseProvider);
    final syncService = ref.watch(syncServiceProvider);

    return StreamBuilder<Thread?>(
      stream: db.watchThreadById(threadId),
      builder: (context, threadSnapshot) {
        final thread = threadSnapshot.data;

        return StreamBuilder<List<Message>>(
          stream: db.watchMessages(threadId),
          builder: (context, msgSnapshot) {
            final messages = msgSnapshot.data ?? [];

            return Scaffold(
              appBar: AppBar(
                title: Text(
                  thread?.subject ?? 'Conversation',
                  style: const TextStyle(fontSize: 18),
                ),
                actions: [
                  IconButton(
                    icon: Icon(
                      thread?.starred == true
                          ? Icons.star_rounded
                          : Icons.star_outline_rounded,
                      color: thread?.starred == true ? Colors.amber : null,
                    ),
                    tooltip: thread?.starred == true ? 'Unstar' : 'Star',
                    onPressed: () {
                      if (thread != null) {
                        syncService.enqueueOptimisticAction(
                          accountId: thread.accountId,
                          actionType: thread.starred
                              ? OutboxActionType.unstarThread
                              : OutboxActionType.starThread,
                          targetId: thread.id,
                        );
                      }
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.archive_outlined),
                    tooltip: 'Archive',
                    onPressed: () {
                      if (thread != null) {
                        syncService.enqueueOptimisticAction(
                          accountId: thread.accountId,
                          actionType: OutboxActionType.archiveThread,
                          targetId: thread.id,
                        );
                        Navigator.of(context).pop();
                      }
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline_rounded),
                    tooltip: 'Trash',
                    onPressed: () {
                      if (thread != null) {
                        syncService.enqueueOptimisticAction(
                          accountId: thread.accountId,
                          actionType: OutboxActionType.trashThread,
                          targetId: thread.id,
                        );
                        Navigator.of(context).pop();
                      }
                    },
                  ),
                  PopupMenuButton<String>(
                    onSelected: (value) async {
                      if (thread == null) return;
                      if (value == 'remind') {
                        unawaited(
                          SnoozeModalSheet.show(
                            context,
                            threadId: thread.id,
                            accountId: thread.accountId,
                            threadSubject: thread.subject,
                          ),
                        );
                      } else if (value == 'task') {
                        await ref
                            .read(productivityControllerProvider)
                            .createTaskFromThread(
                              accountId: thread.accountId,
                              threadId: thread.id,
                              title: 'Follow up: ${thread.subject}',
                            );
                        if (context.mounted) {
                          AppSnackbar.show(
                            context,
                            message: 'Task created from conversation.',
                            variant: AppSnackbarVariant.success,
                          );
                        }
                      } else {
                        AppSnackbar.show(
                          context,
                          message: 'Action "$value" executed.',
                        );
                      }
                    },
                    itemBuilder: (ctx) => [
                      const PopupMenuItem(
                        value: 'remind',
                        child: ListTile(
                          leading: Icon(Icons.alarm),
                          title: Text('Snooze / Remind'),
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'task',
                        child: ListTile(
                          leading: Icon(Icons.check_box_outlined),
                          title: Text('Create Task'),
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'label',
                        child: ListTile(
                          leading: Icon(Icons.label_outline),
                          title: Text('Change Labels'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              body: messages.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const CircularProgressIndicator(),
                          AppSpacing.gapVerticalMd,
                          Text(
                            'Loading messages...',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    )
                  : Column(
                      children: [
                        ThreadSummaryCard(
                          threadSubject: thread?.subject ?? '',
                          threadText: messages
                              .map(
                                (Message m) =>
                                    '${m.senderName}: ${m.bodyPlain}',
                              )
                              .join('\n\n'),
                        ),
                        Expanded(
                          child: ListView.separated(
                            padding: const EdgeInsets.symmetric(
                              vertical: AppSpacing.md,
                            ),
                            itemCount: messages.length,
                            separatorBuilder: (_, _) =>
                                const Divider(height: 24),
                            itemBuilder: (context, index) {
                              final message = messages[index];
                              return _buildMessageTile(context, message);
                            },
                          ),
                        ),
                      ],
                    ),
              bottomNavigationBar: (thread == null || messages.isEmpty)
                  ? null
                  : SafeArea(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.md,
                          vertical: AppSpacing.sm,
                        ),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surface,
                          border: Border(
                            top: BorderSide(
                              color: theme.colorScheme.outlineVariant,
                            ),
                          ),
                        ),
                        child: Row(
                          children: [
                            IconButton.filledTonal(
                              icon: const Icon(Icons.auto_awesome, size: 20),
                              tooltip: 'Draft Reply with AI',
                              onPressed: () {
                                final lastMsg = messages.last;
                                final fullText = messages
                                    .map(
                                      (Message m) =>
                                          '${m.senderName}: ${m.bodyPlain}',
                                    )
                                    .join('\n\n');
                                unawaited(
                                  AiDraftReplySheet.show(
                                    context,
                                    threadId: thread.id,
                                    messageId: lastMsg.id,
                                    threadText: fullText,
                                    senderName: lastMsg.senderName,
                                  ),
                                );
                              },
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: AppButton(
                                label: 'Reply',
                                icon: Icons.reply_rounded,
                                variant: AppButtonVariant.secondary,
                                onPressed: () {
                                  final lastMsgId = messages.last.id;
                                  context.push(
                                    '/compose?threadId=${thread.id}&messageId=$lastMsgId',
                                  );
                                },
                              ),
                            ),
                            AppSpacing.gapHorizontalSm,
                            Expanded(
                              child: AppButton(
                                label: 'Reply All',
                                icon: Icons.reply_all_rounded,
                                variant: AppButtonVariant.secondary,
                                onPressed: () {
                                  final lastMsgId = messages.last.id;
                                  context.push(
                                    '/compose?threadId=${thread.id}&messageId=$lastMsgId&replyAll=true',
                                  );
                                },
                              ),
                            ),
                            AppSpacing.gapHorizontalSm,
                            Expanded(
                              child: AppButton(
                                label: 'Forward',
                                icon: Icons.forward_rounded,
                                variant: AppButtonVariant.text,
                                onPressed: () {
                                  final lastMsgId = messages.last.id;
                                  context.push(
                                    '/compose?threadId=${thread.id}&messageId=$lastMsgId&forward=true',
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
            );
          },
        );
      },
    );
  }

  Widget _buildMessageTile(BuildContext context, Message message) {
    final theme = Theme.of(context);
    final dateStr = DateFormat('MMM d, h:mm a').format(message.timestamp);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                AppAvatar(name: message.senderName, size: 40),
                AppSpacing.gapHorizontalMd,
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        message.senderName,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        message.senderEmail,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  dateStr,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Sanitized Email View
          SafeEmailView(
            htmlBody: message.bodyHtml,
            senderEmail: message.senderEmail,
          ),
          // Sample attachment card if attachments exist
          if (message.subject.toLowerCase().contains('spec') ||
              message.subject.toLowerCase().contains('design')) ...[
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: _buildAttachmentCard(
                context,
                fileName: 'Design_System_Spec.pdf',
                fileSize: '1.4 MB',
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAttachmentCard(
    BuildContext context, {
    required String fileName,
    required String fileSize,
  }) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.picture_as_pdf_rounded,
              color: theme.colorScheme.primary,
              size: 24,
            ),
          ),
          AppSpacing.gapHorizontalMd,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fileName,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  fileSize,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.download_rounded),
            tooltip: 'Download attachment',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Downloading $fileName...')),
              );
            },
          ),
        ],
      ),
    );
  }
}
