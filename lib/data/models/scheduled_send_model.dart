import 'package:freezed_annotation/freezed_annotation.dart';

part 'scheduled_send_model.freezed.dart';
part 'scheduled_send_model.g.dart';

@freezed
abstract class ScheduledSendModel with _$ScheduledSendModel {
  const factory ScheduledSendModel({
    required String id,
    required String threadId,
    required String scheduledFor,
    required String status,
  }) = _ScheduledSendModel;

  factory ScheduledSendModel.fromJson(Map<String, dynamic> json) =>
      _$ScheduledSendModelFromJson(json);
}
