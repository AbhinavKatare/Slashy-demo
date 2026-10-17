import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:inbox_companion/data/models/participant_model.dart';

part 'message_model.freezed.dart';
part 'message_model.g.dart';

@Freezed(makeCollectionsUnmodifiable: false)
abstract class AttachmentModel with _$AttachmentModel {
  const factory AttachmentModel({
    required String id,
    required String filename,
    required String mimeType,
    required int sizeBytes,
    String? downloadUrl,
  }) = _AttachmentModel;

  factory AttachmentModel.fromJson(Map<String, dynamic> json) =>
      _$AttachmentModelFromJson(json);
}

@Freezed(makeCollectionsUnmodifiable: false)
abstract class MessageModel with _$MessageModel {
  const factory MessageModel({
    required String id,
    required String threadId,
    required ParticipantModel sender,
    required List<ParticipantModel> recipients,
    @Default([]) List<ParticipantModel> cc,
    @Default([]) List<ParticipantModel> bcc,
    required String subject,
    required String bodyHtml,
    required String bodyText,
    required String sentAt,
    required bool isDraft,
    @Default([]) List<AttachmentModel> attachments,
  }) = _MessageModel;

  factory MessageModel.fromJson(Map<String, dynamic> json) =>
      _$MessageModelFromJson(json);
}
