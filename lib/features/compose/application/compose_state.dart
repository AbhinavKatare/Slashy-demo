import 'package:equatable/equatable.dart';
import 'package:inbox_companion/features/compose/domain/attachment_item.dart';
import 'package:inbox_companion/features/compose/domain/recipient.dart';

class ComposeState extends Equatable {
  const ComposeState({
    required this.draftId,
    required this.accountId,
    this.threadId,
    this.replyToMessageId,
    this.toRecipients = const [],
    this.ccRecipients = const [],
    this.bccRecipients = const [],
    this.subject = '',
    this.body = '',
    this.signature = 'Sent from Inbox Companion',
    this.showSignature = true,
    this.attachments = const [],
    this.scheduledSendAt,
    this.isCcExpanded = false,
    this.isBccExpanded = false,
    this.isDirty = false,
    this.autosaveStatus = 'idle',
    this.lastSavedAt,
    this.undoSendActive = false,
    this.undoRemainingSeconds = 10,
  });

  final String draftId;
  final String accountId;
  final String? threadId;
  final String? replyToMessageId;
  final List<Recipient> toRecipients;
  final List<Recipient> ccRecipients;
  final List<Recipient> bccRecipients;
  final String subject;
  final String body;
  final String signature;
  final bool showSignature;
  final List<AttachmentItem> attachments;
  final DateTime? scheduledSendAt;
  final bool isCcExpanded;
  final bool isBccExpanded;
  final bool isDirty;
  final String autosaveStatus;
  final DateTime? lastSavedAt;
  final bool undoSendActive;
  final int undoRemainingSeconds;

  int get totalAttachmentBytes =>
      attachments.fold(0, (sum, a) => sum + a.sizeBytes);

  bool get isTotalAttachmentSizeValid =>
      totalAttachmentBytes <= AttachmentItem.kMaxTotalAttachmentsBytes;

  List<String> get validationErrors {
    final errors = <String>[];
    if (toRecipients.isEmpty) {
      errors.add('At least one recipient is required in "To".');
    }
    for (final r in toRecipients) {
      final err = r.validationError;
      if (err != null) errors.add('Invalid recipient "${r.email}": $err');
    }
    for (final r in ccRecipients) {
      final err = r.validationError;
      if (err != null) errors.add('Invalid Cc recipient "${r.email}": $err');
    }
    for (final r in bccRecipients) {
      final err = r.validationError;
      if (err != null) errors.add('Invalid Bcc recipient "${r.email}": $err');
    }
    for (final a in attachments) {
      final err = a.validationError;
      if (err != null) errors.add(err);
    }
    if (!isTotalAttachmentSizeValid) {
      errors.add(
        'Total attachments exceed 25 MB limit (${(totalAttachmentBytes / (1024 * 1024)).toStringAsFixed(1)} MB).',
      );
    }
    return errors;
  }

  bool get isValid => validationErrors.isEmpty;

  ComposeState copyWith({
    String? draftId,
    String? accountId,
    String? threadId,
    String? replyToMessageId,
    List<Recipient>? toRecipients,
    List<Recipient>? ccRecipients,
    List<Recipient>? bccRecipients,
    String? subject,
    String? body,
    String? signature,
    bool? showSignature,
    List<AttachmentItem>? attachments,
    DateTime? scheduledSendAt,
    bool clearScheduledSend = false,
    bool? isCcExpanded,
    bool? isBccExpanded,
    bool? isDirty,
    String? autosaveStatus,
    DateTime? lastSavedAt,
    bool? undoSendActive,
    int? undoRemainingSeconds,
  }) {
    return ComposeState(
      draftId: draftId ?? this.draftId,
      accountId: accountId ?? this.accountId,
      threadId: threadId ?? this.threadId,
      replyToMessageId: replyToMessageId ?? this.replyToMessageId,
      toRecipients: toRecipients ?? this.toRecipients,
      ccRecipients: ccRecipients ?? this.ccRecipients,
      bccRecipients: bccRecipients ?? this.bccRecipients,
      subject: subject ?? this.subject,
      body: body ?? this.body,
      signature: signature ?? this.signature,
      showSignature: showSignature ?? this.showSignature,
      attachments: attachments ?? this.attachments,
      scheduledSendAt: clearScheduledSend
          ? null
          : (scheduledSendAt ?? this.scheduledSendAt),
      isCcExpanded: isCcExpanded ?? this.isCcExpanded,
      isBccExpanded: isBccExpanded ?? this.isBccExpanded,
      isDirty: isDirty ?? this.isDirty,
      autosaveStatus: autosaveStatus ?? this.autosaveStatus,
      lastSavedAt: lastSavedAt ?? this.lastSavedAt,
      undoSendActive: undoSendActive ?? this.undoSendActive,
      undoRemainingSeconds: undoRemainingSeconds ?? this.undoRemainingSeconds,
    );
  }

  @override
  List<Object?> get props => [
    draftId,
    accountId,
    threadId,
    replyToMessageId,
    toRecipients,
    ccRecipients,
    bccRecipients,
    subject,
    body,
    signature,
    showSignature,
    attachments,
    scheduledSendAt,
    isCcExpanded,
    isBccExpanded,
    isDirty,
    autosaveStatus,
    lastSavedAt,
    undoSendActive,
    undoRemainingSeconds,
  ];
}
