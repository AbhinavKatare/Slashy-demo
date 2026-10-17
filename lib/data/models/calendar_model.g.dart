// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'calendar_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_CalendarEventModel _$CalendarEventModelFromJson(Map<String, dynamic> json) =>
    _CalendarEventModel(
      id: json['id'] as String,
      title: json['title'] as String,
      startAt: json['startAt'] as String,
      endAt: json['endAt'] as String,
      isAllDay: json['isAllDay'] as bool,
      location: json['location'] as String?,
      meetingUrl: json['meetingUrl'] as String?,
    );

Map<String, dynamic> _$CalendarEventModelToJson(_CalendarEventModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'startAt': instance.startAt,
      'endAt': instance.endAt,
      'isAllDay': instance.isAllDay,
      'location': instance.location,
      'meetingUrl': instance.meetingUrl,
    };
