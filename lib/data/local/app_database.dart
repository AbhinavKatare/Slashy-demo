import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:inbox_companion/data/local/tables.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'app_database.g.dart';

@DriftDatabase(
  tables: [
    Accounts,
    Threads,
    Messages,
    Labels,
    AttachmentsMeta,
    Drafts,
    OutboxEntries,
    Reminders,
    Tasks,
    Events,
    SyncStates,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? executor]) : super(executor ?? _openConnection());

  AppDatabase.inMemory() : super(NativeDatabase.memory());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (Migrator m) async {
      await m.createAll();
    },
    onUpgrade: (Migrator m, int from, int to) async {
      // Schema upgrades handled incrementally
    },
  );

  // -------------------------------------------------------------
  // REACTIVE STREAMS FOR UI
  // -------------------------------------------------------------

  Stream<List<Account>> watchAccounts() {
    return select(accounts).watch();
  }

  Stream<Account?> watchDefaultAccount() {
    return (select(
      accounts,
    )..where((tbl) => tbl.isDefault.equals(true))).watchSingleOrNull();
  }

  Stream<List<Thread>> watchThreads({
    String? accountId,
    String? folder,
    String? labelId,
  }) {
    final query = select(threads);

    query.where((tbl) {
      final conditions = <Expression<bool>>[];

      if (accountId != null && accountId.isNotEmpty && accountId != 'all') {
        conditions.add(tbl.accountId.equals(accountId));
      }

      if (folder != null) {
        switch (folder.toLowerCase()) {
          case 'inbox':
            conditions.add(
              tbl.archived.equals(false) &
                  tbl.trashed.equals(false) &
                  tbl.spam.equals(false),
            );
            break;
          case 'starred':
            conditions.add(
              tbl.starred.equals(true) & tbl.trashed.equals(false),
            );
            break;
          case 'archive':
            conditions.add(
              tbl.archived.equals(true) & tbl.trashed.equals(false),
            );
            break;
          case 'trash':
            conditions.add(tbl.trashed.equals(true));
            break;
          case 'spam':
            conditions.add(tbl.spam.equals(true));
            break;
          default:
            break;
        }
      }

      if (labelId != null && labelId.isNotEmpty) {
        // Label array json search
        conditions.add(tbl.labelIdsJson.like('%$labelId%'));
      }

      if (conditions.isEmpty) {
        return const Constant(true);
      }
      return conditions.reduce((a, b) => a & b);
    });

    query.orderBy([
      (t) => OrderingTerm(
        expression: t.lastMessageTimestamp,
        mode: OrderingMode.desc,
      ),
    ]);

    return query.watch();
  }

  Stream<Thread?> watchThreadById(String threadId) {
    return (select(
      threads,
    )..where((tbl) => tbl.id.equals(threadId))).watchSingleOrNull();
  }

  Stream<List<Message>> watchMessages(String threadId) {
    return (select(messages)
          ..where((tbl) => tbl.threadId.equals(threadId))
          ..orderBy([(t) => OrderingTerm.asc(t.timestamp)]))
        .watch();
  }

  Stream<List<Label>> watchLabels({String? accountId}) {
    final query = select(labels);
    if (accountId != null && accountId.isNotEmpty && accountId != 'all') {
      query.where((tbl) => tbl.accountId.equals(accountId));
    }
    return query.watch();
  }

  Stream<int> watchUnreadCount({String? accountId}) {
    final countExp = threads.id.count();
    final query = selectOnly(threads)..addColumns([countExp]);
    final conditions = <Expression<bool>>[
      threads.unread.equals(true),
      threads.archived.equals(false),
      threads.trashed.equals(false),
      threads.spam.equals(false),
    ];
    if (accountId != null && accountId.isNotEmpty && accountId != 'all') {
      conditions.add(threads.accountId.equals(accountId));
    }
    query.where(conditions.reduce((a, b) => a & b));
    return query.map((row) => row.read(countExp) ?? 0).watchSingle();
  }

  Stream<List<AttachmentsMetaCompanion>> watchAttachments(String messageId) {
    return (select(
      attachmentsMeta,
    )..where((tbl) => tbl.messageId.equals(messageId))).watch().map(
      (rows) => rows
          .map(
            (r) => AttachmentsMetaCompanion.insert(
              id: r.id,
              messageId: r.messageId,
              fileName: r.fileName,
              mimeType: r.mimeType,
              sizeBytes: r.sizeBytes,
              localPath: Value(r.localPath),
              contentId: Value(r.contentId),
              downloadState: Value(r.downloadState),
            ),
          )
          .toList(),
    );
  }

  Stream<List<OutboxEntry>> watchPendingOutbox() {
    return (select(outboxEntries)
          ..where(
            (tbl) => tbl.status.equals('pending') | tbl.status.equals('failed'),
          )
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .watch();
  }

  Stream<SyncState?> watchSyncState(String key) {
    return (select(
      syncStates,
    )..where((tbl) => tbl.key.equals(key))).watchSingleOrNull();
  }

  // -------------------------------------------------------------
  // UPSERTS & MUTATIONS
  // -------------------------------------------------------------

  Future<void> upsertAccount(AccountsCompanion account) async {
    await into(accounts).insertOnConflictUpdate(account);
  }

  Future<void> upsertThread(ThreadsCompanion thread) async {
    await into(threads).insertOnConflictUpdate(thread);
  }

  Future<void> upsertThreadsBatch(List<ThreadsCompanion> items) async {
    await batch((b) {
      b.insertAllOnConflictUpdate(threads, items);
    });
  }

  Future<void> upsertMessage(MessagesCompanion message) async {
    await into(messages).insertOnConflictUpdate(message);
  }

  Future<void> upsertMessagesBatch(List<MessagesCompanion> items) async {
    await batch((b) {
      b.insertAllOnConflictUpdate(messages, items);
    });
  }

  Future<void> upsertLabel(LabelsCompanion label) async {
    await into(labels).insertOnConflictUpdate(label);
  }

  Future<void> upsertSyncState(SyncStatesCompanion state) async {
    await into(syncStates).insertOnConflictUpdate(state);
  }

  Future<void> deleteAccountData(String accountId) async {
    await transaction(() async {
      await (delete(accounts)..where((t) => t.id.equals(accountId))).go();
      await (delete(threads)..where((t) => t.accountId.equals(accountId))).go();
      await (delete(
        messages,
      )..where((t) => t.accountId.equals(accountId))).go();
      await (delete(labels)..where((t) => t.accountId.equals(accountId))).go();
      await (delete(drafts)..where((t) => t.accountId.equals(accountId))).go();
      await (delete(
        outboxEntries,
      )..where((t) => t.accountId.equals(accountId))).go();
      await (delete(
        reminders,
      )..where((t) => t.accountId.equals(accountId))).go();
      await (delete(tasks)..where((t) => t.accountId.equals(accountId))).go();
      await (delete(events)..where((t) => t.accountId.equals(accountId))).go();
      await (delete(syncStates)..where((t) => t.key.like('$accountId%'))).go();
    });
  }

  // -------------------------------------------------------------
  // OUTBOX MUTATIONS
  // -------------------------------------------------------------

  Future<void> enqueueOutbox(OutboxEntriesCompanion entry) async {
    await into(outboxEntries).insert(entry);
  }

  Future<void> markOutboxInFlight(String id) async {
    await (update(outboxEntries)..where((t) => t.id.equals(id))).write(
      const OutboxEntriesCompanion(status: Value('in_flight')),
    );
  }

  Future<void> markOutboxCompleted(String id) async {
    await (delete(outboxEntries)..where((t) => t.id.equals(id))).go();
  }

  Future<void> markOutboxFailed(
    String id,
    String error, {
    DateTime? nextRetryAt,
  }) async {
    final current = await (select(
      outboxEntries,
    )..where((t) => t.id.equals(id))).getSingleOrNull();
    final newRetry = (current?.retryCount ?? 0) + 1;
    await (update(outboxEntries)..where((t) => t.id.equals(id))).write(
      OutboxEntriesCompanion(
        status: const Value('failed'),
        errorMessage: Value(error),
        retryCount: Value(newRetry),
        nextRetryAt: Value(nextRetryAt),
      ),
    );
  }

  Future<void> resetInFlightOutbox() async {
    await (update(outboxEntries)..where((t) => t.status.equals('in_flight')))
        .write(const OutboxEntriesCompanion(status: Value('pending')));
  }

  // -------------------------------------------------------------
  // DRAFTS
  // -------------------------------------------------------------
  Stream<List<Draft>> watchDrafts({String? accountId}) {
    final query = select(drafts);
    if (accountId != null && accountId.isNotEmpty && accountId != 'all') {
      query.where((tbl) => tbl.accountId.equals(accountId));
    }
    query.orderBy([(t) => OrderingTerm.desc(t.updatedAt)]);
    return query.watch();
  }

  Stream<Draft?> watchDraftById(String id) {
    return (select(
      drafts,
    )..where((tbl) => tbl.id.equals(id))).watchSingleOrNull();
  }

  Future<void> upsertDraft(DraftsCompanion draft) async {
    await into(drafts).insertOnConflictUpdate(draft);
  }

  Future<void> deleteDraft(String id) async {
    await (delete(drafts)..where((tbl) => tbl.id.equals(id))).go();
  }

  // -------------------------------------------------------------
  // REMINDERS
  // -------------------------------------------------------------
  Stream<List<Reminder>> watchReminders({String? accountId}) {
    final query = select(reminders);
    if (accountId != null && accountId.isNotEmpty && accountId != 'all') {
      query.where((tbl) => tbl.accountId.equals(accountId));
    }
    query.orderBy([(t) => OrderingTerm.asc(t.remindAt)]);
    return query.watch();
  }

  Future<void> upsertReminder(RemindersCompanion reminder) async {
    await into(reminders).insertOnConflictUpdate(reminder);
  }

  Future<void> deleteReminder(String id) async {
    await (delete(reminders)..where((tbl) => tbl.id.equals(id))).go();
  }

  // -------------------------------------------------------------
  // TASKS
  // -------------------------------------------------------------
  Stream<List<Task>> watchTasks({String? accountId}) {
    final query = select(tasks);
    if (accountId != null && accountId.isNotEmpty && accountId != 'all') {
      query.where((tbl) => tbl.accountId.equals(accountId));
    }
    query.orderBy([(t) => OrderingTerm.asc(t.dueDate)]);
    return query.watch();
  }

  Future<void> upsertTask(TasksCompanion task) async {
    await into(tasks).insertOnConflictUpdate(task);
  }

  Future<void> deleteTask(String id) async {
    await (delete(tasks)..where((tbl) => tbl.id.equals(id))).go();
  }

  // -------------------------------------------------------------
  // EVENTS
  // -------------------------------------------------------------
  Stream<List<Event>> watchEvents({DateTime? from, DateTime? to}) {
    final query = select(events);
    if (from != null) {
      query.where((tbl) => tbl.endTime.isBiggerOrEqualValue(from));
    }
    if (to != null) {
      query.where((tbl) => tbl.startTime.isSmallerOrEqualValue(to));
    }
    query.orderBy([(t) => OrderingTerm.asc(t.startTime)]);
    return query.watch();
  }

  Future<void> upsertEvent(EventsCompanion event) async {
    await into(events).insertOnConflictUpdate(event);
  }

  Future<void> deleteEvent(String id) async {
    await (delete(events)..where((tbl) => tbl.id.equals(id))).go();
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'inbox_companion.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
