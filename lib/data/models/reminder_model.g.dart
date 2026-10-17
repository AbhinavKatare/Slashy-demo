// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reminder_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ReminderModel _$ReminderModelFromJson(Map<String, dynamic> json) =>
    _ReminderModel(
      id: json['id'] as String,
      threadId: json['threadId'] as String,
      title: json['title'] as String?,
      dueAt: json['dueAt'] as String,
      isCompleted: json['isCompleted'] as bool,
    );

Map<String, dynamic> _$ReminderModelToJson(_ReminderModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'threadId': instance.threadId,
      'title': instance.title,
      'dueAt': instance.dueAt,
      'isCompleted': instance.isCompleted,
    };
