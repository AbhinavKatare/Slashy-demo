// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'message_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AttachmentModel _$AttachmentModelFromJson(Map<String, dynamic> json) =>
    _AttachmentModel(
      id: json['id'] as String,
      filename: json['filename'] as String,
      mimeType: json['mimeType'] as String,
      sizeBytes: (json['sizeBytes'] as num).toInt(),
      downloadUrl: json['downloadUrl'] as String?,
    );

Map<String, dynamic> _$AttachmentModelToJson(_AttachmentModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'filename': instance.filename,
      'mimeType': instance.mimeType,
      'sizeBytes': instance.sizeBytes,
      'downloadUrl': instance.downloadUrl,
    };

_MessageModel _$MessageModelFromJson(Map<String, dynamic> json) =>
    _MessageModel(
      id: json['id'] as String,
      threadId: json['threadId'] as String,
      sender: ParticipantModel.fromJson(json['sender'] as Map<String, dynamic>),
      recipients: (json['recipients'] as List<dynamic>)
          .map((e) => ParticipantModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      cc:
          (json['cc'] as List<dynamic>?)
              ?.map((e) => ParticipantModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      bcc:
          (json['bcc'] as List<dynamic>?)
              ?.map((e) => ParticipantModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      subject: json['subject'] as String,
      bodyHtml: json['bodyHtml'] as String,
      bodyText: json['bodyText'] as String,
      sentAt: json['sentAt'] as String,
      isDraft: json['isDraft'] as bool,
      attachments:
          (json['attachments'] as List<dynamic>?)
              ?.map((e) => AttachmentModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$MessageModelToJson(_MessageModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'threadId': instance.threadId,
      'sender': instance.sender,
      'recipients': instance.recipients,
      'cc': instance.cc,
      'bcc': instance.bcc,
      'subject': instance.subject,
      'bodyHtml': instance.bodyHtml,
      'bodyText': instance.bodyText,
      'sentAt': instance.sentAt,
      'isDraft': instance.isDraft,
      'attachments': instance.attachments,
    };
