import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inbox_companion/core/logging/app_logger.dart';
import 'package:inbox_companion/core/notifications/notification_scheduler.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:inbox_companion/data/mock/mock_seed_data.dart';
import 'package:inbox_companion/data/sync/sync_service.dart';
import 'package:uuid/uuid.dart';

final notificationSchedulerProvider = Provider<NotificationScheduler>((ref) {
  return NotificationScheduler();
});

final productivityControllerProvider = Provider<ProductivityController>((ref) {
  final db = ref.watch(appDatabaseProvider);
  final syncService = ref.watch(syncServiceProvider);
  final scheduler = ref.watch(notificationSchedulerProvider);
  return ProductivityController(
    db: db,
    syncService: syncService,
    scheduler: scheduler,
  );
});

class ProductivityController {
  ProductivityController({
    required this.db,
    required this.syncService,
    required this.scheduler,
    IAppLogger? logger,
  })  : _logger = logger ?? AppLogger(),
        _uuid = const Uuid();

  final AppDatabase db;
  final SyncService syncService;
  final NotificationScheduler scheduler;
  final IAppLogger _logger;
  final Uuid _uuid;

  /// Snoozes a thread and schedules a local reminder
  Future<void> snoozeThread({
    required String threadId,
    required String accountId,
    required String threadSubject,
    required DateTime targetTime,
    String? note,
  }) async {
    final reminderId = _uuid.v4();
    final now = DateTime.now();

    // 1. Insert reminder in local Drift database
    await db.upsertReminder(
      RemindersCompanion(
        id: Value(reminderId),
        threadId: Value(threadId),
        accountId: Value(accountId),
        remindAt: Value(targetTime),
        note: Value(note ?? 'Snoozed thread reminder'),
        isCompleted: const Value(false),
        createdAt: Value(now),
      ),
    );

    // 2. Optimistically archive thread from active inbox
    await syncService.enqueueOptimisticAction(
      accountId: accountId,
      actionType: OutboxActionType.archiveThread,
      targetId: threadId,
    );

    // 3. Schedule platform notification
    await scheduler.scheduleReminderNotification(
      id: reminderId,
      title: 'Snoozed Email: $threadSubject',
      body: note ?? 'Tap to view conversation.',
      scheduledTime: targetTime,
      payload: threadId,
    );

    _logger.info('Thread $threadId snoozed until $targetTime.');
  }

  /// Creates a task linked to an email thread
  Future<String> createTaskFromThread({
    required String accountId,
    required String title,
    String? threadId,
    String? notes,
    DateTime? dueDate,
  }) async {
    final taskId = _uuid.v4();
    final now = DateTime.now();

    await db.upsertTask(
      TasksCompanion(
        id: Value(taskId),
        accountId: Value(accountId),
        threadId: Value(threadId),
        title: Value(title),
        notes: Value(notes),
        dueDate: Value(dueDate),
        isCompleted: const Value(false),
        createdAt: Value(now),
      ),
    );

    // Record through sync outbox
    await syncService.enqueueOptimisticAction(
      accountId: accountId,
      actionType: OutboxActionType.applyLabel,
      targetId: threadId ?? taskId,
      payload: {'taskId': taskId, 'title': title},
    );

    _logger.info('Task "$title" (id: $taskId) created.');
    return taskId;
  }

  /// Toggles task completion with optimistic SQLite write
  Future<void> toggleTaskCompleted({
    required String taskId,
    required bool isCompleted,
    required String accountId,
  }) async {
    await (db.update(db.tasks)..where((t) => t.id.equals(taskId))).write(
      TasksCompanion(isCompleted: Value(isCompleted)),
    );

    _logger.info('Task $taskId marked as completed=$isCompleted.');
  }

  /// Deletes a task
  Future<void> deleteTask(String taskId) async {
    await db.deleteTask(taskId);
    _logger.info('Task $taskId deleted.');
  }

  /// Seeds (or refreshes) demo calendar events with today-relative timestamps.
  /// Always upserts so that stale past-dated events are corrected on every open.
  Future<void> seedCalendarEventsIfEmpty(String accountId) async {
    final nowUtc = DateTime.now();
    await db.upsertEvent(
      EventsCompanion(
        id: const Value('evt_01'),
        accountId: Value(accountId),
        title: const Value('Design System & Component Gallery Walkthrough'),
        description: const Value('Walkthrough and review discussion.'),
        startTime: Value(nowUtc.add(const Duration(hours: 1))),
        endTime: Value(nowUtc.add(const Duration(hours: 2))),
        location: const Value('Virtual Conf Room Alpha'),
        conferenceUrl: const Value('https://meet.google.com/abc-demo-xyz'),
        organizerEmail: const Value('alex.morgan@acme-companion.test'),
        isAllDay: const Value(false),
      ),
    );
    await db.upsertEvent(
      EventsCompanion(
        id: const Value('evt_02'),
        accountId: Value(accountId),
        title: const Value('Sprint Planning & Architecture Alignment'),
        description: const Value('Weekly engineering team alignment.'),
        startTime: Value(nowUtc.add(const Duration(hours: 4))),
        endTime: Value(nowUtc.add(const Duration(hours: 5))),
        location: const Value('Main Conference Room B'),
        conferenceUrl: const Value('https://meet.google.com/sprint-42-align'),
        organizerEmail: const Value('samira@orbital-systems.test'),
        isAllDay: const Value(false),
      ),
    );
    await db.upsertEvent(
      EventsCompanion(
        id: const Value('evt_03'),
        accountId: Value(accountId),
        title: const Value('Q4 Product Roadmap Review'),
        description: const Value(
            'Cross-functional review of Q4 priorities and milestones.'),
        startTime: Value(nowUtc.add(const Duration(hours: 7))),
        endTime: Value(nowUtc.add(const Duration(hours: 8))),
        location: const Value('Zoom — link in invite'),
        conferenceUrl: const Value('https://zoom.us/j/demo-roadmap-q4'),
        organizerEmail: const Value('priya@orbital-systems.test'),
        isAllDay: const Value(false),
      ),
    );
    _logger.info('Demo calendar events upserted with fresh timestamps.');
  }

  /// Seeds (or refreshes) demo tasks. Always upserts so due dates stay current.
  Future<void> seedTasksIfEmpty(String accountId) async {
    final now = DateTime.now();
    for (final tsk in MockSeedData.tasks) {
      await db.upsertTask(
        TasksCompanion(
          id: Value(tsk['id'] as String),
          accountId: Value(accountId),
          threadId: Value(tsk['threadId'] as String?),
          title: Value(tsk['title'] as String),
          notes: const Value('High priority item from email triage.'),
          dueDate: Value(now.add(const Duration(days: 1))),
          isCompleted: Value(tsk['isCompleted'] as bool? ?? false),
          createdAt: Value(now),
        ),
      );
    }
    _logger.info('Demo tasks upserted into Drift.');
  }
}
