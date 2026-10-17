import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:inbox_companion/data/models/message_model.dart';
import 'package:inbox_companion/data/models/participant_model.dart';

part 'thread_model.freezed.dart';
part 'thread_model.g.dart';

@Freezed(makeCollectionsUnmodifiable: false)
abstract class ThreadModel with _$ThreadModel {
  const factory ThreadModel({
    required String id,
    required String accountId,
    required String subject,
    required String snippet,
    required String lastMessageAt,
    required bool isUnread,
    required bool isStarred,
    required int messageCount,
    required List<ParticipantModel> participants,
    required List<String> labelIds,
    @Default(false) bool hasAttachments,
  }) = _ThreadModel;

  factory ThreadModel.fromJson(Map<String, dynamic> json) =>
      _$ThreadModelFromJson(json);
}

@Freezed(makeCollectionsUnmodifiable: false)
abstract class ThreadListResponseModel with _$ThreadListResponseModel {
  const factory ThreadListResponseModel({
    required List<ThreadModel> threads,
    String? nextCursor,
    required int totalCount,
  }) = _ThreadListResponseModel;

  factory ThreadListResponseModel.fromJson(Map<String, dynamic> json) =>
      _$ThreadListResponseModelFromJson(json);
}

@Freezed(makeCollectionsUnmodifiable: false)
abstract class ThreadDetailModel with _$ThreadDetailModel {
  const factory ThreadDetailModel({
    required ThreadModel thread,
    required List<MessageModel> messages,
  }) = _ThreadDetailModel;

  factory ThreadDetailModel.fromJson(Map<String, dynamic> json) =>
      _$ThreadDetailModelFromJson(json);
}
