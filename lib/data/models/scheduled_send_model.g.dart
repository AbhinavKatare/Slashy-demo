// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'scheduled_send_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ScheduledSendModel _$ScheduledSendModelFromJson(Map<String, dynamic> json) =>
    _ScheduledSendModel(
      id: json['id'] as String,
      threadId: json['threadId'] as String,
      scheduledFor: json['scheduledFor'] as String,
      status: json['status'] as String,
    );

Map<String, dynamic> _$ScheduledSendModelToJson(_ScheduledSendModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'threadId': instance.threadId,
      'scheduledFor': instance.scheduledFor,
      'status': instance.status,
    };
