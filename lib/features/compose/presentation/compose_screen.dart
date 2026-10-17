import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/core/theme/tokens/spacing_tokens.dart';
import 'package:inbox_companion/core/widgets/buttons/app_button.dart';
import 'package:inbox_companion/core/widgets/snackbar/app_snackbar.dart';
import 'package:inbox_companion/features/compose/application/compose_controller.dart';
import 'package:inbox_companion/features/compose/application/compose_state.dart';
import 'package:inbox_companion/features/compose/domain/attachment_item.dart';
import 'package:inbox_companion/features/compose/domain/recipient.dart';
import 'package:inbox_companion/features/compose/presentation/compose_review_sheet.dart';
import 'package:inbox_companion/features/compose/presentation/schedule_send_sheet.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

final composeControllerProvider =
    StateNotifierProvider.autoDispose<ComposeController, ComposeState>((ref) {
      final db = ref.watch(appDatabaseProvider);
      final syncService = ref.watch(syncServiceProvider);
      final authState = ref.watch(authServiceProvider).state;
      final activeAccount = authState.currentAccount?.id ?? 'acc_work_01';

      return ComposeController(
        db: db,
        syncService: syncService,
        accountId: activeAccount,
      );
    });

class ComposeScreen extends ConsumerStatefulWidget {
  const ComposeScreen({
    super.key,
    this.replyThreadId,
    this.replyMessageId,
    this.isReplyAll = false,
    this.isForward = false,
    this.draftId,
    this.initialBody,
    this.isAiGenerated = false,
  });

  final String? replyThreadId;
  final String? replyMessageId;
  final bool isReplyAll;
  final bool isForward;
  final String? draftId;
  final String? initialBody;
  final bool isAiGenerated;

  @override
  ConsumerState<ComposeScreen> createState() => _ComposeScreenState();
}

class _ComposeScreenState extends ConsumerState<ComposeScreen> {
  final _toInputController = TextEditingController();
  final _ccInputController = TextEditingController();
  final _bccInputController = TextEditingController();
  final _subjectController = TextEditingController();
  final _bodyController = TextEditingController();

  final _toFocusNode = FocusNode();
  final _ccFocusNode = FocusNode();
  final _bccFocusNode = FocusNode();

  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initializeContent());
  }

  Future<void> _initializeContent() async {
    final controller = ref.read(composeControllerProvider.notifier);
    final db = ref.read(appDatabaseProvider);
    final authState = ref.read(authServiceProvider).state;
    final currentEmail =
        authState.currentAccount?.email ?? 'alex.work@acme-companion.test';

    if (widget.draftId != null) {
      await controller.restoreDraft(widget.draftId!);
      final state = ref.read(composeControllerProvider);
      _subjectController.text = state.subject;
      _bodyController.text = state.body;
    } else if (widget.replyThreadId != null && widget.replyMessageId != null) {
      final thread = await db.watchThreadById(widget.replyThreadId!).first;
      final messages = await db.watchMessages(widget.replyThreadId!).first;
      final targetMsg = messages.firstWhere(
        (m) => m.id == widget.replyMessageId,
        orElse: () => messages.last,
      );

      if (thread != null) {
        if (widget.isForward) {
          controller.initForward(thread: thread, message: targetMsg);
        } else if (widget.isReplyAll) {
          controller.initReplyAll(
            thread: thread,
            message: targetMsg,
            currentAccountEmail: currentEmail,
          );
        } else {
          controller.initReply(
            thread: thread,
            message: targetMsg,
            currentAccountEmail: currentEmail,
          );
        }

        final state = ref.read(composeControllerProvider);
        _subjectController.text = state.subject;
        _bodyController.text = state.body;
      }
    }

    if (widget.initialBody != null && widget.initialBody!.isNotEmpty) {
      _bodyController.text = widget.initialBody!;
      controller.setBody(widget.initialBody!);
    }

    setState(() {
      _isInitialized = true;
    });
  }

  @override
  void dispose() {
    _toInputController.dispose();
    _ccInputController.dispose();
    _bccInputController.dispose();
    _subjectController.dispose();
    _bodyController.dispose();
    _toFocusNode.dispose();
    _ccFocusNode.dispose();
    _bccFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final state = ref.watch(composeControllerProvider);
    final controller = ref.read(composeControllerProvider.notifier);

    return PopScope(
      canPop: !state.isDirty && !state.undoSendActive,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _showDiscardDialog(context, controller);
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            widget.isForward
                ? 'Forward Message'
                : (widget.replyThreadId != null ? 'Reply' : 'New Message'),
          ),
          actions: [
            // Autosave Status Badge
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF2A3042) : Colors.grey[200],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        state.autosaveStatus == 'saving'
                            ? Icons.sync
                            : (state.autosaveStatus == 'saved'
                                  ? Icons.check_circle_outline
                                  : Icons.cloud_queue),
                        size: 14,
                        color: state.autosaveStatus == 'saved'
                            ? Colors.green
                            : theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        state.autosaveStatus == 'saving'
                            ? 'Saving...'
                            : (state.autosaveStatus == 'saved'
                                  ? 'Autosaved'
                                  : 'Draft'),
                        style: theme.textTheme.labelSmall?.copyWith(
                          fontSize: 11,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // Attach file
            IconButton(
              icon: const Icon(Icons.attach_file),
              tooltip: 'Attach file',
              onPressed: () => _showAttachmentPicker(context, controller),
            ),
            // Schedule send
            IconButton(
              icon: Icon(
                Icons.schedule,
                color: state.scheduledSendAt != null
                    ? theme.colorScheme.primary
                    : null,
              ),
              tooltip: 'Schedule send',
              onPressed: () => _showScheduleSheet(context, state, controller),
            ),
            // Send button
            Padding(
              padding: const EdgeInsets.only(right: SpacingTokens.xs),
              child: IconButton(
                icon: const Icon(Icons.send),
                tooltip: 'Review and Send',
                onPressed: state.isValid
                    ? () => _showReviewSheet(context, state, controller)
                    : () {
                        final errors = state.validationErrors;
                        AppSnackbar.show(
                          context,
                          message: errors.isNotEmpty
                              ? errors.first
                              : 'Please add a recipient before sending.',
                          variant: AppSnackbarVariant.warning,
                        );
                      },
              ),
            ),
          ],
        ),
        body: _isInitialized
            ? Stack(
                children: [
                  SingleChildScrollView(
                    padding: const EdgeInsets.all(SpacingTokens.md),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Scheduled Banner
                        if (state.scheduledSendAt != null)
                          Container(
                            margin: const EdgeInsets.only(
                              bottom: SpacingTokens.sm,
                            ),
                            padding: const EdgeInsets.all(SpacingTokens.sm),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primaryContainer,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.access_time_filled,
                                  size: 18,
                                  color: theme.colorScheme.onPrimaryContainer,
                                ),
                                const SizedBox(width: SpacingTokens.xs),
                                Expanded(
                                  child: Text(
                                    'Delivery scheduled for ${DateFormat('EEE, MMM d @ h:mm a').format(state.scheduledSendAt!.toLocal())}',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color:
                                          theme.colorScheme.onPrimaryContainer,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.close, size: 16),
                                  onPressed: () =>
                                      controller.setScheduledSendTime(null),
                                ),
                              ],
                            ),
                          ),

                        // To recipients section
                        _buildRecipientField(
                          label: 'To',
                          recipients: state.toRecipients,
                          controller: _toInputController,
                          focusNode: _toFocusNode,
                          onAdd: controller.addToRecipient,
                          onRemove: controller.removeToRecipient,
                          extraActions: [
                            if (!state.isCcExpanded)
                              TextButton(
                                onPressed: controller.toggleCc,
                                child: const Text('Cc'),
                              ),
                            if (!state.isBccExpanded)
                              TextButton(
                                onPressed: controller.toggleBcc,
                                child: const Text('Bcc'),
                              ),
                          ],
                        ),
                        const Divider(height: 1),

                        // Cc section (expandable)
                        if (state.isCcExpanded) ...[
                          _buildRecipientField(
                            label: 'Cc',
                            recipients: state.ccRecipients,
                            controller: _ccInputController,
                            focusNode: _ccFocusNode,
                            onAdd: controller.addCcRecipient,
                            onRemove: controller.removeCcRecipient,
                          ),
                          const Divider(height: 1),
                        ],

                        // Bcc section (expandable)
                        if (state.isBccExpanded) ...[
                          _buildRecipientField(
                            label: 'Bcc',
                            recipients: state.bccRecipients,
                            controller: _bccInputController,
                            focusNode: _bccFocusNode,
                            onAdd: controller.addBccRecipient,
                            onRemove: controller.removeBccRecipient,
                          ),
                          const Divider(height: 1),
                        ],

                        // Subject
                        TextField(
                          controller: _subjectController,
                          decoration: const InputDecoration(
                            hintText: 'Subject',
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(
                              vertical: SpacingTokens.sm,
                            ),
                          ),
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          onChanged: controller.setSubject,
                        ),
                        const Divider(height: 1),

                        // Formatting Toolbar
                        _buildFormattingBar(context, controller),
                        const Divider(height: 1),

                        // Attachments Chips
                        if (state.attachments.isNotEmpty) ...[
                          const SizedBox(height: SpacingTokens.xs),
                          Wrap(
                            spacing: SpacingTokens.xs,
                            runSpacing: SpacingTokens.xs,
                            children: state.attachments.map((att) {
                              final isError = att.validationError != null;
                              return Chip(
                                avatar: Icon(
                                  isError
                                      ? Icons.error_outline
                                      : Icons.insert_drive_file,
                                  color: isError ? Colors.red : null,
                                  size: 18,
                                ),
                                label: Text(
                                  '${att.name} (${att.formattedSize})',
                                  style: TextStyle(
                                    color: isError ? Colors.red : null,
                                    fontSize: 12,
                                  ),
                                ),
                                deleteIcon: const Icon(Icons.close, size: 16),
                                onDeleted: () =>
                                    controller.removeAttachment(att.id),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: SpacingTokens.xs),
                          const Divider(height: 1),
                        ],
                        if (widget.isAiGenerated) ...[
                          Container(
                            margin: const EdgeInsets.symmetric(
                              vertical: SpacingTokens.xs,
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.tertiaryContainer
                                  .withValues(alpha: 0.6),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: theme.colorScheme.tertiary.withValues(
                                  alpha: 0.3,
                                ),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.auto_awesome,
                                  size: 14,
                                  color: theme.colorScheme.onTertiaryContainer,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'AI-Generated Draft (Editable • Requires explicit human Send)',
                                  style: theme.textTheme.labelSmall?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color:
                                        theme.colorScheme.onTertiaryContainer,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: SpacingTokens.xs),
                        ],

                        // Body TextField
                        TextField(
                          controller: _bodyController,
                          maxLines: null,
                          minLines: 12,
                          decoration: const InputDecoration(
                            hintText: 'Compose your email...',
                            border: InputBorder.none,
                          ),
                          onChanged: controller.setBody,
                        ),

                        // Signature preview
                        if (state.showSignature) ...[
                          const SizedBox(height: SpacingTokens.md),
                          Container(
                            padding: const EdgeInsets.all(SpacingTokens.sm),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.surfaceContainerHighest
                                  .withValues(alpha: 0.5),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: theme.colorScheme.outlineVariant,
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.draw, size: 16),
                                const SizedBox(width: SpacingTokens.xs),
                                Expanded(
                                  child: Text(
                                    '--\n${state.signature}',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.close, size: 16),
                                  tooltip: 'Remove signature for this email',
                                  onPressed: controller.toggleSignature,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  // Undo Send Overlay
                  if (state.undoSendActive)
                    Positioned(
                      bottom: SpacingTokens.lg,
                      left: SpacingTokens.lg,
                      right: SpacingTokens.lg,
                      child: Material(
                        elevation: 8,
                        borderRadius: BorderRadius.circular(16),
                        color: isDark
                            ? const Color(0xFF1E2230)
                            : Colors.black87,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: SpacingTokens.md,
                            vertical: SpacingTokens.sm,
                          ),
                          child: Row(
                            children: [
                              SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  value: state.undoRemainingSeconds / 10,
                                  strokeWidth: 2.5,
                                  color: Colors.amberAccent,
                                ),
                              ),
                              const SizedBox(width: SpacingTokens.md),
                              Expanded(
                                child: Text(
                                  'Sending in ${state.undoRemainingSeconds}s...',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              TextButton(
                                onPressed: controller.cancelUndo,
                                child: const Text(
                                  'UNDO',
                                  style: TextStyle(
                                    color: Colors.amberAccent,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              )
            : const Center(child: CircularProgressIndicator()),
      ),
    );
  }

  Widget _buildRecipientField({
    required String label,
    required List<Recipient> recipients,
    required TextEditingController controller,
    required FocusNode focusNode,
    required ValueChanged<Recipient> onAdd,
    required ValueChanged<Recipient> onRemove,
    List<Widget> extraActions = const [],
  }) {
    final theme = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        SizedBox(
          width: 48,
          child: Text(
            label,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Expanded(
          child: Wrap(
            spacing: 6,
            runSpacing: 4,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              ...recipients.map((r) {
                final hasError = r.validationError != null;
                return Chip(
                  avatar: CircleAvatar(
                    backgroundColor: hasError
                        ? Colors.red.withValues(alpha: 0.2)
                        : theme.colorScheme.primaryContainer,
                    child: Text(
                      r.displayName[0].toUpperCase(),
                      style: TextStyle(
                        fontSize: 11,
                        color: hasError ? Colors.red : null,
                      ),
                    ),
                  ),
                  label: Text(r.displayName),
                  side: hasError
                      ? const BorderSide(color: Colors.red, width: 1.5)
                      : null,
                  deleteIcon: const Icon(Icons.close, size: 14),
                  onDeleted: () => onRemove(r),
                );
              }),
              SizedBox(
                width: 140,
                child: TextField(
                  controller: controller,
                  focusNode: focusNode,
                  decoration: const InputDecoration(
                    hintText: 'Add email...',
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(vertical: 8),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  onSubmitted: (value) {
                    final email = value.trim();
                    if (email.isNotEmpty) {
                      onAdd(Recipient(email: email));
                      controller.clear();
                      focusNode.requestFocus();
                    }
                  },
                ),
              ),
            ],
          ),
        ),
        ...extraActions,
      ],
    );
  }

  Widget _buildFormattingBar(
    BuildContext context,
    ComposeController controller,
  ) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.format_bold, size: 20),
            tooltip: 'Bold',
            onPressed: () => _wrapSelection('**', '**'),
          ),
          IconButton(
            icon: const Icon(Icons.format_italic, size: 20),
            tooltip: 'Italic',
            onPressed: () => _wrapSelection('*', '*'),
          ),
          IconButton(
            icon: const Icon(Icons.format_list_bulleted, size: 20),
            tooltip: 'Bullet List',
            onPressed: () => _insertPrefix('• '),
          ),
          IconButton(
            icon: const Icon(Icons.format_list_numbered, size: 20),
            tooltip: 'Numbered List',
            onPressed: () => _insertPrefix('1. '),
          ),
          IconButton(
            icon: const Icon(Icons.link, size: 20),
            tooltip: 'Insert Link',
            onPressed: () => _showInsertLinkDialog(context),
          ),
          IconButton(
            icon: const Icon(Icons.draw, size: 20),
            tooltip: 'Toggle Signature',
            onPressed: controller.toggleSignature,
          ),
        ],
      ),
    );
  }

  void _wrapSelection(String prefix, String suffix) {
    final text = _bodyController.text;
    final selection = _bodyController.selection;
    if (selection.start < 0) return;

    final selected = selection.textInside(text);
    final newText =
        selection.textBefore(text) +
        prefix +
        selected +
        suffix +
        selection.textAfter(text);
    _bodyController.text = newText;
    ref.read(composeControllerProvider.notifier).setBody(newText);
  }

  void _insertPrefix(String prefix) {
    final text = _bodyController.text;
    final selection = _bodyController.selection;
    final pos = selection.start >= 0 ? selection.start : text.length;
    final newText = '${text.substring(0, pos)}\n$prefix${text.substring(pos)}';
    _bodyController.text = newText;
    ref.read(composeControllerProvider.notifier).setBody(newText);
  }

  void _showInsertLinkDialog(BuildContext context) {
    final urlController = TextEditingController();
    final labelController = TextEditingController();

    showDialog<void>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Insert Hyperlink'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: labelController,
              decoration: const InputDecoration(labelText: 'Link Text'),
            ),
            const SizedBox(height: SpacingTokens.sm),
            TextField(
              controller: urlController,
              decoration: const InputDecoration(
                labelText: 'Web Address (URL)',
                hintText: 'https://...',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('Cancel'),
          ),
          AppButton(
            label: 'Insert',
            onPressed: () {
              final label = labelController.text.trim();
              final url = urlController.text.trim();
              if (url.isNotEmpty) {
                final mdLink = '[${label.isNotEmpty ? label : url}]($url)';
                _wrapSelection(mdLink, '');
              }
              Navigator.of(dialogCtx).pop();
            },
          ),
        ],
      ),
    );
  }

  void _showAttachmentPicker(
    BuildContext context,
    ComposeController controller,
  ) {
    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.picture_as_pdf),
              title: const Text('Design-Tokens-Spec.pdf (142 KB)'),
              subtitle: const Text('Valid attachment'),
              onTap: () {
                Navigator.of(ctx).pop();
                controller.addAttachment(
                  AttachmentItem(
                    id: const Uuid().v4(),
                    name: 'Design-Tokens-Spec.pdf',
                    sizeBytes: 142050,
                    mimeType: 'application/pdf',
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.image),
              title: const Text('Component-Mockup.png (2.4 MB)'),
              subtitle: const Text('Valid image attachment'),
              onTap: () {
                Navigator.of(ctx).pop();
                controller.addAttachment(
                  AttachmentItem(
                    id: const Uuid().v4(),
                    name: 'Component-Mockup.png',
                    sizeBytes: 2516582,
                    mimeType: 'image/png',
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.warning, color: Colors.red),
              title: const Text('Blocked Script (installer.bat - 12 KB)'),
              subtitle: const Text('Demonstrates security extension filter'),
              onTap: () {
                Navigator.of(ctx).pop();
                controller.addAttachment(
                  AttachmentItem(
                    id: const Uuid().v4(),
                    name: 'installer.bat',
                    sizeBytes: 12288,
                    mimeType: 'application/x-bat',
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showScheduleSheet(
    BuildContext context,
    ComposeState state,
    ComposeController controller,
  ) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => ScheduleSendSheet(
        currentlyScheduled: state.scheduledSendAt,
        onScheduleSelected: (scheduled) {
          controller.setScheduledSendTime(scheduled);
          if (scheduled != null) {
            AppSnackbar.show(
              context,
              message:
                  'Scheduled for ${DateFormat('EEE, MMM d @ h:mm a').format(scheduled.toLocal())}',
              variant: AppSnackbarVariant.success,
            );
          }
        },
      ),
    );
  }

  void _showReviewSheet(
    BuildContext context,
    ComposeState state,
    ComposeController controller,
  ) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => ComposeReviewSheet(
        state: state,
        onConfirmSend: () {
          controller.startSendWithUndo(
            delaySeconds: 10,
            onDispatched: () {
              if (mounted) {
                AppSnackbar.show(
                  context,
                  message: 'Message sent successfully!',
                  variant: AppSnackbarVariant.success,
                );
                context.pop();
              }
            },
          );
        },
      ),
    );
  }

  void _showDiscardDialog(BuildContext context, ComposeController controller) {
    showDialog<void>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Discard Draft?'),
        content: const Text(
          'Your changes are autosaved locally. Do you want to keep this draft or delete it?',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(dialogCtx).pop();
              controller.discardDraft();
              context.pop();
            },
            child: const Text('Discard', style: TextStyle(color: Colors.red)),
          ),
          AppButton(
            label: 'Save & Close',
            onPressed: () async {
              await controller.saveDraft();
              if (dialogCtx.mounted) Navigator.of(dialogCtx).pop();
              if (context.mounted) context.pop();
            },
          ),
        ],
      ),
    );
  }
}
