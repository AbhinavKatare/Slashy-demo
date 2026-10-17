// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ai_draft_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AiDraftResponseModel _$AiDraftResponseModelFromJson(
  Map<String, dynamic> json,
) => _AiDraftResponseModel(
  draftSubject: json['draftSubject'] as String,
  draftBody: json['draftBody'] as String,
  confidenceScore: (json['confidenceScore'] as num).toDouble(),
);

Map<String, dynamic> _$AiDraftResponseModelToJson(
  _AiDraftResponseModel instance,
) => <String, dynamic>{
  'draftSubject': instance.draftSubject,
  'draftBody': instance.draftBody,
  'confidenceScore': instance.confidenceScore,
};

_AiSummarizeResponseModel _$AiSummarizeResponseModelFromJson(
  Map<String, dynamic> json,
) => _AiSummarizeResponseModel(
  overview: json['overview'] as String,
  keyTakeaways: (json['keyTakeaways'] as List<dynamic>)
      .map((e) => e as String)
      .toList(),
  suggestedActions: (json['suggestedActions'] as List<dynamic>)
      .map((e) => e as String)
      .toList(),
);

Map<String, dynamic> _$AiSummarizeResponseModelToJson(
  _AiSummarizeResponseModel instance,
) => <String, dynamic>{
  'overview': instance.overview,
  'keyTakeaways': instance.keyTakeaways,
  'suggestedActions': instance.suggestedActions,
};
