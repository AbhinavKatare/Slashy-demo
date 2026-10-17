// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'label_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_LabelModel _$LabelModelFromJson(Map<String, dynamic> json) => _LabelModel(
  id: json['id'] as String,
  name: json['name'] as String,
  colorHex: json['colorHex'] as String,
  isSystem: json['isSystem'] as bool,
  unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
  totalCount: (json['totalCount'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$LabelModelToJson(_LabelModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'colorHex': instance.colorHex,
      'isSystem': instance.isSystem,
      'unreadCount': instance.unreadCount,
      'totalCount': instance.totalCount,
    };
