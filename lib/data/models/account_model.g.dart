// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'account_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AccountModel _$AccountModelFromJson(Map<String, dynamic> json) =>
    _AccountModel(
      id: json['id'] as String,
      email: json['email'] as String,
      provider: json['provider'] as String,
      isPrimary: json['isPrimary'] as bool,
      syncStatus: json['syncStatus'] as String,
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$AccountModelToJson(_AccountModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'email': instance.email,
      'provider': instance.provider,
      'isPrimary': instance.isPrimary,
      'syncStatus': instance.syncStatus,
      'unreadCount': instance.unreadCount,
    };
