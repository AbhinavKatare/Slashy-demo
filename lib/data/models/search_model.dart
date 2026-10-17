import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:inbox_companion/data/models/calendar_model.dart';
import 'package:inbox_companion/data/models/participant_model.dart';
import 'package:inbox_companion/data/models/task_model.dart';
import 'package:inbox_companion/data/models/thread_model.dart';

part 'search_model.freezed.dart';
part 'search_model.g.dart';

@Freezed(makeCollectionsUnmodifiable: false)
abstract class SearchResultModel with _$SearchResultModel {
  const factory SearchResultModel({
    required List<ThreadModel> threads,
    required List<ParticipantModel> contacts,
    required List<CalendarEventModel> events,
    required List<TaskModel> tasks,
  }) = _SearchResultModel;

  factory SearchResultModel.fromJson(Map<String, dynamic> json) =>
      _$SearchResultModelFromJson(json);
}
