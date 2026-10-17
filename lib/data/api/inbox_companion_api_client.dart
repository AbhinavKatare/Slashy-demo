import 'package:dio/dio.dart';
import 'package:inbox_companion/data/models/account_model.dart';
import 'package:inbox_companion/data/models/ai_draft_model.dart';
import 'package:inbox_companion/data/models/auth_tokens_model.dart';
import 'package:inbox_companion/data/models/calendar_model.dart';
import 'package:inbox_companion/data/models/draft_model.dart';
import 'package:inbox_companion/data/models/label_model.dart';
import 'package:inbox_companion/data/models/message_model.dart';
import 'package:inbox_companion/data/models/reminder_model.dart';
import 'package:inbox_companion/data/models/scheduled_send_model.dart';
import 'package:inbox_companion/data/models/search_model.dart';
import 'package:inbox_companion/data/models/task_model.dart';
import 'package:inbox_companion/data/models/thread_model.dart';

/// Typed API client adhering directly to the OpenAPI specification.
abstract class IInboxCompanionApiClient {
  // Auth
  Future<AuthTokensModel> login({
    required String email,
    required String password,
  });
  Future<AuthTokensModel> refreshToken({required String refreshToken});
  Future<void> logout();

  // Accounts
  Future<List<AccountModel>> listAccounts();
  Future<AccountModel> getAccount(String accountId);

  // Threads
  Future<ThreadListResponseModel> listThreads({
    String folder = 'inbox',
    String? labelId,
    bool? isUnread,
    String? cursor,
    int limit = 20,
  });
  Future<ThreadDetailModel> getThread(String threadId);
  Future<ThreadModel> updateThread(
    String threadId,
    Map<String, dynamic> update,
  );
  Future<void> deleteThread(String threadId);

  // Messages
  Future<MessageModel> getMessage(String messageId);
  Future<MessageModel> sendMessage(Map<String, dynamic> payload);

  // Labels
  Future<List<LabelModel>> listLabels();
  Future<LabelModel> createLabel({
    required String name,
    required String colorHex,
  });

  // Drafts
  Future<List<DraftModel>> listDrafts();
  Future<DraftModel> createDraft(Map<String, dynamic> payload);
  Future<DraftModel> updateDraft(String draftId, Map<String, dynamic> payload);
  Future<void> deleteDraft(String draftId);

  // Reminders
  Future<List<ReminderModel>> listReminders();
  Future<ReminderModel> createReminder({
    required String threadId,
    required String dueAt,
    String? title,
  });

  // Scheduled Sends
  Future<List<ScheduledSendModel>> listScheduledSends();
  Future<ScheduledSendModel> createScheduledSend(Map<String, dynamic> payload);
  Future<void> cancelScheduledSend(String scheduledId);

  // Search
  Future<SearchResultModel> searchAll({
    required String query,
    String type = 'all',
  });

  // Calendar
  Future<List<CalendarEventModel>> listCalendarEvents({
    required String start,
    required String end,
  });
  Future<CalendarEventModel> createCalendarEvent(Map<String, dynamic> payload);

  // Tasks
  Future<List<TaskModel>> listTasks({bool? isCompleted});
  Future<TaskModel> createTask(Map<String, dynamic> payload);
  Future<TaskModel> updateTask(String taskId, Map<String, dynamic> payload);
  Future<void> deleteTask(String taskId);

  // AI
  Future<AiDraftResponseModel> generateAiDraftReply({
    required String threadId,
    required String tone,
    String? instruction,
  });
  Future<AiSummarizeResponseModel> summarizeThread({required String threadId});
}

class InboxCompanionApiClient implements IInboxCompanionApiClient {
  const InboxCompanionApiClient(this._dio);

  final Dio _dio;

  @override
  Future<AuthTokensModel> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    return AuthTokensModel.fromJson(response.data!);
  }

  @override
  Future<AuthTokensModel> refreshToken({required String refreshToken}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );
    return AuthTokensModel.fromJson(response.data!);
  }

  @override
  Future<void> logout() async {
    await _dio.post<void>('/auth/logout');
  }

  @override
  Future<List<AccountModel>> listAccounts() async {
    final response = await _dio.get<List<dynamic>>('/accounts');
    return (response.data ?? [])
        .map((item) => AccountModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<AccountModel> getAccount(String accountId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/accounts/$accountId',
    );
    return AccountModel.fromJson(response.data!);
  }

  @override
  Future<ThreadListResponseModel> listThreads({
    String folder = 'inbox',
    String? labelId,
    bool? isUnread,
    String? cursor,
    int limit = 20,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/threads',
      queryParameters: {
        'folder': folder,
        if (labelId != null) 'labelId': labelId,
        if (isUnread != null) 'isUnread': isUnread,
        if (cursor != null) 'cursor': cursor,
        'limit': limit,
      },
    );
    return ThreadListResponseModel.fromJson(response.data!);
  }

  @override
  Future<ThreadDetailModel> getThread(String threadId) async {
    final response = await _dio.get<Map<String, dynamic>>('/threads/$threadId');
    return ThreadDetailModel.fromJson(response.data!);
  }

  @override
  Future<ThreadModel> updateThread(
    String threadId,
    Map<String, dynamic> update,
  ) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/threads/$threadId',
      data: update,
    );
    return ThreadModel.fromJson(response.data!);
  }

  @override
  Future<void> deleteThread(String threadId) async {
    await _dio.delete<void>('/threads/$threadId');
  }

  @override
  Future<MessageModel> getMessage(String messageId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/messages/$messageId',
    );
    return MessageModel.fromJson(response.data!);
  }

  @override
  Future<MessageModel> sendMessage(Map<String, dynamic> payload) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/messages/send',
      data: payload,
    );
    return MessageModel.fromJson(response.data!);
  }

  @override
  Future<List<LabelModel>> listLabels() async {
    final response = await _dio.get<List<dynamic>>('/labels');
    return (response.data ?? [])
        .map((item) => LabelModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<LabelModel> createLabel({
    required String name,
    required String colorHex,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/labels',
      data: {'name': name, 'colorHex': colorHex},
    );
    return LabelModel.fromJson(response.data!);
  }

  @override
  Future<List<DraftModel>> listDrafts() async {
    final response = await _dio.get<List<dynamic>>('/drafts');
    return (response.data ?? [])
        .map((item) => DraftModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<DraftModel> createDraft(Map<String, dynamic> payload) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/drafts',
      data: payload,
    );
    return DraftModel.fromJson(response.data!);
  }

  @override
  Future<DraftModel> updateDraft(
    String draftId,
    Map<String, dynamic> payload,
  ) async {
    final response = await _dio.put<Map<String, dynamic>>(
      '/drafts/$draftId',
      data: payload,
    );
    return DraftModel.fromJson(response.data!);
  }

  @override
  Future<void> deleteDraft(String draftId) async {
    await _dio.delete<void>('/drafts/$draftId');
  }

  @override
  Future<List<ReminderModel>> listReminders() async {
    final response = await _dio.get<List<dynamic>>('/reminders');
    return (response.data ?? [])
        .map((item) => ReminderModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<ReminderModel> createReminder({
    required String threadId,
    required String dueAt,
    String? title,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/reminders',
      data: {
        'threadId': threadId,
        'dueAt': dueAt,
        if (title != null) 'title': title,
      },
    );
    return ReminderModel.fromJson(response.data!);
  }

  @override
  Future<List<ScheduledSendModel>> listScheduledSends() async {
    final response = await _dio.get<List<dynamic>>('/scheduled-sends');
    return (response.data ?? [])
        .map(
          (item) => ScheduledSendModel.fromJson(item as Map<String, dynamic>),
        )
        .toList();
  }

  @override
  Future<ScheduledSendModel> createScheduledSend(
    Map<String, dynamic> payload,
  ) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/scheduled-sends',
      data: payload,
    );
    return ScheduledSendModel.fromJson(response.data!);
  }

  @override
  Future<void> cancelScheduledSend(String scheduledId) async {
    await _dio.delete<void>('/scheduled-sends/$scheduledId');
  }

  @override
  Future<SearchResultModel> searchAll({
    required String query,
    String type = 'all',
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/search',
      queryParameters: {'q': query, 'type': type},
    );
    return SearchResultModel.fromJson(response.data!);
  }

  @override
  Future<List<CalendarEventModel>> listCalendarEvents({
    required String start,
    required String end,
  }) async {
    final response = await _dio.get<List<dynamic>>(
      '/calendar/events',
      queryParameters: {'start': start, 'end': end},
    );
    return (response.data ?? [])
        .map(
          (item) => CalendarEventModel.fromJson(item as Map<String, dynamic>),
        )
        .toList();
  }

  @override
  Future<CalendarEventModel> createCalendarEvent(
    Map<String, dynamic> payload,
  ) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/calendar/events',
      data: payload,
    );
    return CalendarEventModel.fromJson(response.data!);
  }

  @override
  Future<List<TaskModel>> listTasks({bool? isCompleted}) async {
    final response = await _dio.get<List<dynamic>>(
      '/tasks',
      queryParameters: {if (isCompleted != null) 'isCompleted': isCompleted},
    );
    return (response.data ?? [])
        .map((item) => TaskModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<TaskModel> createTask(Map<String, dynamic> payload) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/tasks',
      data: payload,
    );
    return TaskModel.fromJson(response.data!);
  }

  @override
  Future<TaskModel> updateTask(
    String taskId,
    Map<String, dynamic> payload,
  ) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/tasks/$taskId',
      data: payload,
    );
    return TaskModel.fromJson(response.data!);
  }

  @override
  Future<void> deleteTask(String taskId) async {
    await _dio.delete<void>('/tasks/$taskId');
  }

  @override
  Future<AiDraftResponseModel> generateAiDraftReply({
    required String threadId,
    required String tone,
    String? instruction,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/ai/draft-reply',
      data: {
        'threadId': threadId,
        'tone': tone,
        if (instruction != null) 'instruction': instruction,
      },
    );
    return AiDraftResponseModel.fromJson(response.data!);
  }

  @override
  Future<AiSummarizeResponseModel> summarizeThread({
    required String threadId,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/ai/summarize-thread',
      data: {'threadId': threadId},
    );
    return AiSummarizeResponseModel.fromJson(response.data!);
  }
}
