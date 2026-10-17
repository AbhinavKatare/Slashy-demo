import 'dart:async';
import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inbox_companion/core/logging/app_logger.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:inbox_companion/data/sync/sync_service.dart';
import 'package:inbox_companion/features/compose/application/compose_state.dart';
import 'package:inbox_companion/features/compose/domain/attachment_item.dart';
import 'package:inbox_companion/features/compose/domain/recipient.dart';
import 'package:uuid/uuid.dart';

class ComposeController extends StateNotifier<ComposeState> {
  ComposeController({
    required this.db,
    required this.syncService,
    required String accountId,
    IAppLogger? logger,
  }) : _logger = logger ?? AppLogger(),
       _uuid = const Uuid(),
       super(ComposeState(draftId: const Uuid().v4(), accountId: accountId));

  final AppDatabase db;
  final SyncService syncService;
  final IAppLogger _logger;
  final Uuid _uuid;

  Timer? _autosaveTimer;
  Timer? _undoTimer;

  // -------------------------------------------------------------
  // INITIALIZERS
  // -------------------------------------------------------------

  /// Initializes a reply to a message
  void initReply({
    required Thread thread,
    required Message message,
    required String currentAccountEmail,
  }) {
    final cleanSubject = thread.subject.replaceFirst(
      RegExp(r'^Re:\s*', caseSensitive: false),
      '',
    );
    final quotedBody =
        '\n\nOn ${message.timestamp.toLocal()}, ${message.senderName} wrote:\n'
        '${message.bodyPlain.split('\n').map((l) => '> $l').join('\n')}';

    state = state.copyWith(
      threadId: thread.id,
      replyToMessageId: message.id,
      toRecipients: [
        Recipient(email: message.senderEmail, name: message.senderName),
      ],
      subject: 'Re: $cleanSubject',
      body: quotedBody,
      isDirty: true,
    );
    _scheduleAutosave();
  }

  /// Initializes a Reply-All to a thread
  void initReplyAll({
    required Thread thread,
    required Message message,
    required String currentAccountEmail,
  }) {
    final cleanSubject = thread.subject.replaceFirst(
      RegExp(r'^Re:\s*', caseSensitive: false),
      '',
    );
    final quotedBody =
        '\n\nOn ${message.timestamp.toLocal()}, ${message.senderName} wrote:\n'
        '${message.bodyPlain.split('\n').map((l) => '> $l').join('\n')}';

    // Parse existing recipients from JSON
    final rawTo = _parseRecipientsJson(message.toRecipientsJson);
    final rawCc = _parseRecipientsJson(message.ccRecipientsJson);

    final allOthers = <Recipient>[...rawTo, ...rawCc].where((r) {
      final email = r.email.toLowerCase();
      return email != currentAccountEmail.toLowerCase() &&
          email != message.senderEmail.toLowerCase();
    }).toList();

    state = state.copyWith(
      threadId: thread.id,
      replyToMessageId: message.id,
      toRecipients: [
        Recipient(email: message.senderEmail, name: message.senderName),
      ],
      ccRecipients: allOthers,
      isCcExpanded: allOthers.isNotEmpty,
      subject: 'Re: $cleanSubject',
      body: quotedBody,
      isDirty: true,
    );
    _scheduleAutosave();
  }

  /// Initializes forwarding of a message
  void initForward({required Thread thread, required Message message}) {
    final cleanSubject = thread.subject.replaceFirst(
      RegExp(r'^Fwd:\s*', caseSensitive: false),
      '',
    );
    final forwardedHeader =
        '\n\n---------- Forwarded message ---------\n'
        'From: ${message.senderName} <${message.senderEmail}>\n'
        'Date: ${message.timestamp.toLocal()}\n'
        'Subject: ${message.subject}\n\n'
        '${message.bodyPlain}';

    state = state.copyWith(
      threadId: thread.id,
      toRecipients: const [],
      subject: 'Fwd: $cleanSubject',
      body: forwardedHeader,
      isDirty: true,
    );
    _scheduleAutosave();
  }

  // -------------------------------------------------------------
  // MUTATION METHODS
  // -------------------------------------------------------------

  void addToRecipient(Recipient recipient) {
    if (state.toRecipients.any(
      (r) => r.email.toLowerCase() == recipient.email.toLowerCase(),
    )) {
      return;
    }
    state = state.copyWith(
      toRecipients: [...state.toRecipients, recipient],
      isDirty: true,
    );
    _scheduleAutosave();
  }

  void removeToRecipient(Recipient recipient) {
    state = state.copyWith(
      toRecipients: state.toRecipients
          .where((r) => r.email != recipient.email)
          .toList(),
      isDirty: true,
    );
    _scheduleAutosave();
  }

  void addCcRecipient(Recipient recipient) {
    if (state.ccRecipients.any(
      (r) => r.email.toLowerCase() == recipient.email.toLowerCase(),
    )) {
      return;
    }
    state = state.copyWith(
      ccRecipients: [...state.ccRecipients, recipient],
      isDirty: true,
    );
    _scheduleAutosave();
  }

  void removeCcRecipient(Recipient recipient) {
    state = state.copyWith(
      ccRecipients: state.ccRecipients
          .where((r) => r.email != recipient.email)
          .toList(),
      isDirty: true,
    );
    _scheduleAutosave();
  }

  void addBccRecipient(Recipient recipient) {
    if (state.bccRecipients.any(
      (r) => r.email.toLowerCase() == recipient.email.toLowerCase(),
    )) {
      return;
    }
    state = state.copyWith(
      bccRecipients: [...state.bccRecipients, recipient],
      isDirty: true,
    );
    _scheduleAutosave();
  }

  void removeBccRecipient(Recipient recipient) {
    state = state.copyWith(
      bccRecipients: state.bccRecipients
          .where((r) => r.email != recipient.email)
          .toList(),
      isDirty: true,
    );
    _scheduleAutosave();
  }

  void setSubject(String subject) {
    state = state.copyWith(subject: subject, isDirty: true);
    _scheduleAutosave();
  }

  void setBody(String body) {
    state = state.copyWith(body: body, isDirty: true);
    _scheduleAutosave();
  }

  void toggleCc() {
    state = state.copyWith(isCcExpanded: !state.isCcExpanded);
  }

  void toggleBcc() {
    state = state.copyWith(isBccExpanded: !state.isBccExpanded);
  }

  void toggleSignature() {
    state = state.copyWith(showSignature: !state.showSignature);
    _scheduleAutosave();
  }

  void addAttachment(AttachmentItem attachment) {
    state = state.copyWith(
      attachments: [...state.attachments, attachment],
      isDirty: true,
    );
    _scheduleAutosave();
  }

  void removeAttachment(String attachmentId) {
    state = state.copyWith(
      attachments: state.attachments
          .where((a) => a.id != attachmentId)
          .toList(),
      isDirty: true,
    );
    _scheduleAutosave();
  }

  void setScheduledSendTime(DateTime? time) {
    if (time == null) {
      state = state.copyWith(clearScheduledSend: true, isDirty: true);
    } else {
      state = state.copyWith(scheduledSendAt: time, isDirty: true);
    }
    _scheduleAutosave();
  }

  // -------------------------------------------------------------
  // AUTOSAVE & RESTORE
  // -------------------------------------------------------------

  void _scheduleAutosave() {
    _autosaveTimer?.cancel();
    _autosaveTimer = Timer(const Duration(milliseconds: 1500), () {
      saveDraft();
    });
  }

  Future<void> saveDraft() async {
    if (!state.isDirty) return;
    state = state.copyWith(autosaveStatus: 'saving');

    try {
      final now = DateTime.now();
      final bodyWithSig = state.showSignature && state.signature.isNotEmpty
          ? '${state.body}\n\n--\n${state.signature}'
          : state.body;

      final draftCompanion = DraftsCompanion(
        id: Value(state.draftId),
        accountId: Value(state.accountId),
        threadId: Value(state.threadId),
        replyToMessageId: Value(state.replyToMessageId),
        toRecipientsJson: Value(
          jsonEncode(state.toRecipients.map((r) => r.toJson()).toList()),
        ),
        ccRecipientsJson: Value(
          jsonEncode(state.ccRecipients.map((r) => r.toJson()).toList()),
        ),
        bccRecipientsJson: Value(
          jsonEncode(state.bccRecipients.map((r) => r.toJson()).toList()),
        ),
        subject: Value(state.subject),
        bodyHtml: Value('<p>${bodyWithSig.replaceAll('\n', '<br>')}</p>'),
        updatedAt: Value(now),
      );

      await db.upsertDraft(draftCompanion);
      state = state.copyWith(
        autosaveStatus: 'saved',
        lastSavedAt: now,
        isDirty: false,
      );
      _logger.info('Draft ${state.draftId} autosaved to local SQLite.');
    } catch (e, st) {
      _logger.error('Failed to autosave draft', error: e, stackTrace: st);
      state = state.copyWith(autosaveStatus: 'error');
    }
  }

  /// Restores a draft from Drift database
  Future<void> restoreDraft(String draftId) async {
    final draft = await db.watchDraftById(draftId).first;
    if (draft == null) return;

    final to = _parseRecipientsJson(draft.toRecipientsJson);
    final cc = _parseRecipientsJson(draft.ccRecipientsJson);
    final bcc = _parseRecipientsJson(draft.bccRecipientsJson);

    // Clean html tags back to plain text for editing
    final plainBody = draft.bodyHtml
        .replaceAll('<p>', '')
        .replaceAll('</p>', '\n')
        .replaceAll('<br>', '\n')
        .replaceAll('<br/>', '\n');

    state = state.copyWith(
      draftId: draft.id,
      accountId: draft.accountId,
      threadId: draft.threadId,
      replyToMessageId: draft.replyToMessageId,
      toRecipients: to,
      ccRecipients: cc,
      bccRecipients: bcc,
      isCcExpanded: cc.isNotEmpty,
      isBccExpanded: bcc.isNotEmpty,
      subject: draft.subject,
      body: plainBody,
      lastSavedAt: draft.updatedAt,
      isDirty: false,
      autosaveStatus: 'saved',
    );
    _logger.info('Restored draft ${draft.id} successfully.');
  }

  // -------------------------------------------------------------
  // SEND & UNDO SEND
  // -------------------------------------------------------------

  /// Initiates sending with an undoable countdown
  void startSendWithUndo({
    int delaySeconds = 10,
    void Function()? onDispatched,
  }) {
    if (!state.isValid) return;

    _autosaveTimer?.cancel();
    state = state.copyWith(
      undoSendActive: true,
      undoRemainingSeconds: delaySeconds,
    );

    _undoTimer?.cancel();
    _undoTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (state.undoRemainingSeconds > 1) {
        state = state.copyWith(
          undoRemainingSeconds: state.undoRemainingSeconds - 1,
        );
      } else {
        timer.cancel();
        _undoTimer = null;
        dispatchSend();
        onDispatched?.call();
      }
    });
  }

  /// Cancels the in-flight send during the countdown window
  void cancelUndo() {
    _undoTimer?.cancel();
    _undoTimer = null;
    state = state.copyWith(undoSendActive: false);
    _logger.info('Send cancelled by user during undo window.');
  }

  /// Immediately dispatches the message to the sync outbox
  Future<void> dispatchSend() async {
    _undoTimer?.cancel();
    _undoTimer = null;

    final bodyWithSig = state.showSignature && state.signature.isNotEmpty
        ? '${state.body}\n\n--\n${state.signature}'
        : state.body;

    final payload = {
      'id': _uuid.v4(),
      'threadId': state.threadId ?? _uuid.v4(),
      'accountId': state.accountId,
      'recipients': state.toRecipients.map((r) => r.toJson()).toList(),
      'cc': state.ccRecipients.map((r) => r.toJson()).toList(),
      'bcc': state.bccRecipients.map((r) => r.toJson()).toList(),
      'subject': state.subject,
      'bodyText': bodyWithSig,
      'bodyHtml': '<p>${bodyWithSig.replaceAll('\n', '<br>')}</p>',
      'attachments': state.attachments.map((a) => a.toJson()).toList(),
      'scheduledFor': state.scheduledSendAt?.toUtc().toIso8601String(),
    };

    await syncService.enqueueOptimisticAction(
      accountId: state.accountId,
      actionType: OutboxActionType.sendMessage,
      targetId: state.threadId ?? payload['id'] as String,
      payload: payload,
    );

    // Delete local draft since it is now queued in Outbox
    await db.deleteDraft(state.draftId);
    state = state.copyWith(undoSendActive: false, isDirty: false);
    _logger.info('Message queued for sending in outbox.');
  }

  /// Deletes and discards current draft
  Future<void> discardDraft() async {
    _autosaveTimer?.cancel();
    _undoTimer?.cancel();
    await db.deleteDraft(state.draftId);
    _logger.info('Draft ${state.draftId} discarded.');
  }

  List<Recipient> _parseRecipientsJson(String jsonStr) {
    try {
      final list = jsonDecode(jsonStr) as List<dynamic>;
      return list
          .map((item) => Recipient.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  @override
  void dispose() {
    _autosaveTimer?.cancel();
    _undoTimer?.cancel();
    super.dispose();
  }
}
