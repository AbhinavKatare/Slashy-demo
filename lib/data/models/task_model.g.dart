// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'task_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_TaskModel _$TaskModelFromJson(Map<String, dynamic> json) => _TaskModel(
  id: json['id'] as String,
  title: json['title'] as String,
  threadId: json['threadId'] as String?,
  dueAt: json['dueAt'] as String?,
  isCompleted: json['isCompleted'] as bool,
  priority: json['priority'] as String? ?? 'medium',
);

Map<String, dynamic> _$TaskModelToJson(_TaskModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'threadId': instance.threadId,
      'dueAt': instance.dueAt,
      'isCompleted': instance.isCompleted,
      'priority': instance.priority,
    };
