// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'draft_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_DraftModel _$DraftModelFromJson(Map<String, dynamic> json) => _DraftModel(
  id: json['id'] as String,
  threadId: json['threadId'] as String?,
  recipients:
      (json['recipients'] as List<dynamic>?)
          ?.map((e) => ParticipantModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  subject: json['subject'] as String,
  bodyText: json['bodyText'] as String,
  updatedAt: json['updatedAt'] as String,
);

Map<String, dynamic> _$DraftModelToJson(_DraftModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'threadId': instance.threadId,
      'recipients': instance.recipients,
      'subject': instance.subject,
      'bodyText': instance.bodyText,
      'updatedAt': instance.updatedAt,
    };
