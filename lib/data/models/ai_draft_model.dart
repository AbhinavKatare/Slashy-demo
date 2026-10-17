import 'package:freezed_annotation/freezed_annotation.dart';

part 'ai_draft_model.freezed.dart';
part 'ai_draft_model.g.dart';

@Freezed(makeCollectionsUnmodifiable: false)
abstract class AiDraftResponseModel with _$AiDraftResponseModel {
  const factory AiDraftResponseModel({
    required String draftSubject,
    required String draftBody,
    required double confidenceScore,
  }) = _AiDraftResponseModel;

  factory AiDraftResponseModel.fromJson(Map<String, dynamic> json) =>
      _$AiDraftResponseModelFromJson(json);
}

@Freezed(makeCollectionsUnmodifiable: false)
abstract class AiSummarizeResponseModel with _$AiSummarizeResponseModel {
  const factory AiSummarizeResponseModel({
    required String overview,
    required List<String> keyTakeaways,
    required List<String> suggestedActions,
  }) = _AiSummarizeResponseModel;

  factory AiSummarizeResponseModel.fromJson(Map<String, dynamic> json) =>
      _$AiSummarizeResponseModelFromJson(json);
}
