import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:inbox_companion/data/models/participant_model.dart';

part 'draft_model.freezed.dart';
part 'draft_model.g.dart';

@Freezed(makeCollectionsUnmodifiable: false)
abstract class DraftModel with _$DraftModel {
  const factory DraftModel({
    required String id,
    String? threadId,
    @Default([]) List<ParticipantModel> recipients,
    required String subject,
    required String bodyText,
    required String updatedAt,
  }) = _DraftModel;

  factory DraftModel.fromJson(Map<String, dynamic> json) =>
      _$DraftModelFromJson(json);
}
