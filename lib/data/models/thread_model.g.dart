// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'thread_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_ThreadModel _$ThreadModelFromJson(Map<String, dynamic> json) => _ThreadModel(
  id: json['id'] as String,
  accountId: json['accountId'] as String,
  subject: json['subject'] as String,
  snippet: json['snippet'] as String,
  lastMessageAt: json['lastMessageAt'] as String,
  isUnread: json['isUnread'] as bool,
  isStarred: json['isStarred'] as bool,
  messageCount: (json['messageCount'] as num).toInt(),
  participants: (json['participants'] as List<dynamic>)
      .map((e) => ParticipantModel.fromJson(e as Map<String, dynamic>))
      .toList(),
  labelIds: (json['labelIds'] as List<dynamic>)
      .map((e) => e as String)
      .toList(),
  hasAttachments: json['hasAttachments'] as bool? ?? false,
);

Map<String, dynamic> _$ThreadModelToJson(_ThreadModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'accountId': instance.accountId,
      'subject': instance.subject,
      'snippet': instance.snippet,
      'lastMessageAt': instance.lastMessageAt,
      'isUnread': instance.isUnread,
      'isStarred': instance.isStarred,
      'messageCount': instance.messageCount,
      'participants': instance.participants,
      'labelIds': instance.labelIds,
      'hasAttachments': instance.hasAttachments,
    };

_ThreadListResponseModel _$ThreadListResponseModelFromJson(
  Map<String, dynamic> json,
) => _ThreadListResponseModel(
  threads: (json['threads'] as List<dynamic>)
      .map((e) => ThreadModel.fromJson(e as Map<String, dynamic>))
      .toList(),
  nextCursor: json['nextCursor'] as String?,
  totalCount: (json['totalCount'] as num).toInt(),
);

Map<String, dynamic> _$ThreadListResponseModelToJson(
  _ThreadListResponseModel instance,
) => <String, dynamic>{
  'threads': instance.threads,
  'nextCursor': instance.nextCursor,
  'totalCount': instance.totalCount,
};

_ThreadDetailModel _$ThreadDetailModelFromJson(Map<String, dynamic> json) =>
    _ThreadDetailModel(
      thread: ThreadModel.fromJson(json['thread'] as Map<String, dynamic>),
      messages: (json['messages'] as List<dynamic>)
          .map((e) => MessageModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$ThreadDetailModelToJson(_ThreadDetailModel instance) =>
    <String, dynamic>{'thread': instance.thread, 'messages': instance.messages};
