import 'package:freezed_annotation/freezed_annotation.dart';

part 'label_model.freezed.dart';
part 'label_model.g.dart';

@freezed
abstract class LabelModel with _$LabelModel {
  const factory LabelModel({
    required String id,
    required String name,
    required String colorHex,
    required bool isSystem,
    @Default(0) int unreadCount,
    @Default(0) int totalCount,
  }) = _LabelModel;

  factory LabelModel.fromJson(Map<String, dynamic> json) =>
      _$LabelModelFromJson(json);
}
