import 'package:drift/drift.dart';

class Accounts extends Table {
  TextColumn get id => text()();
  TextColumn get email => text()();
  TextColumn get displayName => text()();
  TextColumn get provider => text()(); // google, microsoft, mock
  TextColumn get avatarUrl => text().nullable()();
  BoolColumn get isDefault => boolean().withDefault(const Constant(false))();
  BoolColumn get reconnectNeeded =>
      boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class Threads extends Table {
  TextColumn get id => text()();
  TextColumn get accountId => text()();
  TextColumn get subject => text()();
  TextColumn get snippet => text()();
  BoolColumn get unread => boolean().withDefault(const Constant(true))();
  BoolColumn get starred => boolean().withDefault(const Constant(false))();
  BoolColumn get archived => boolean().withDefault(const Constant(false))();
  BoolColumn get trashed => boolean().withDefault(const Constant(false))();
  BoolColumn get spam => boolean().withDefault(const Constant(false))();
  BoolColumn get hasAttachments =>
      boolean().withDefault(const Constant(false))();
  DateTimeColumn get lastMessageTimestamp => dateTime()();
  IntColumn get messageCount => integer().withDefault(const Constant(1))();
  TextColumn get participantsJson => text().withDefault(const Constant('[]'))();
  TextColumn get labelIdsJson => text().withDefault(const Constant('[]'))();

  @override
  Set<Column> get primaryKey => {id};
}

class Messages extends Table {
  TextColumn get id => text()();
  TextColumn get threadId => text()();
  TextColumn get accountId => text()();
  TextColumn get senderName => text()();
  TextColumn get senderEmail => text()();
  TextColumn get toRecipientsJson => text().withDefault(const Constant('[]'))();
  TextColumn get ccRecipientsJson => text().withDefault(const Constant('[]'))();
  TextColumn get bccRecipientsJson =>
      text().withDefault(const Constant('[]'))();
  TextColumn get subject => text()();
  TextColumn get bodyHtml => text()();
  TextColumn get bodyPlain => text()();
  DateTimeColumn get timestamp => dateTime()();
  BoolColumn get isRead => boolean().withDefault(const Constant(true))();
  BoolColumn get isStarred => boolean().withDefault(const Constant(false))();
  BoolColumn get isDraft => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

class Labels extends Table {
  TextColumn get id => text()();
  TextColumn get accountId => text()();
  TextColumn get name => text()();
  TextColumn get colorHex => text()();
  IntColumn get unreadCount => integer().withDefault(const Constant(0))();
  TextColumn get type =>
      text().withDefault(const Constant('user'))(); // system, user

  @override
  Set<Column> get primaryKey => {id};
}

class AttachmentsMeta extends Table {
  @override
  String get tableName => 'attachments_meta';

  TextColumn get id => text()();
  TextColumn get messageId => text()();
  TextColumn get fileName => text()();
  TextColumn get mimeType => text()();
  IntColumn get sizeBytes => integer()();
  TextColumn get localPath => text().nullable()();
  TextColumn get contentId => text().nullable()();
  TextColumn get downloadState => text().withDefault(
    const Constant('pending'),
  )(); // pending, downloaded, failed

  @override
  Set<Column> get primaryKey => {id};
}

class Drafts extends Table {
  TextColumn get id => text()();
  TextColumn get accountId => text()();
  TextColumn get threadId => text().nullable()();
  TextColumn get replyToMessageId => text().nullable()();
  TextColumn get toRecipientsJson => text().withDefault(const Constant('[]'))();
  TextColumn get ccRecipientsJson => text().withDefault(const Constant('[]'))();
  TextColumn get bccRecipientsJson =>
      text().withDefault(const Constant('[]'))();
  TextColumn get subject => text().withDefault(const Constant(''))();
  TextColumn get bodyHtml => text().withDefault(const Constant(''))();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class OutboxEntries extends Table {
  @override
  String get tableName => 'outbox';

  TextColumn get id => text()();
  TextColumn get idempotencyKey => text()();
  TextColumn get accountId => text()();
  TextColumn get actionType => text()(); // send_message, archive_thread, unarchive_thread, trash_thread, untrash_thread, star_thread, unstar_thread, mark_read, mark_unread, apply_label, remove_label
  TextColumn get targetId => text()();
  TextColumn get payloadJson => text().withDefault(const Constant('{}'))();
  TextColumn get status => text().withDefault(
    const Constant('pending'),
  )(); // pending, in_flight, failed, completed
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get nextRetryAt => dateTime().nullable()();
  TextColumn get errorMessage => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class Reminders extends Table {
  TextColumn get id => text()();
  TextColumn get threadId => text()();
  TextColumn get accountId => text()();
  DateTimeColumn get remindAt => dateTime()();
  TextColumn get note => text().nullable()();
  BoolColumn get isCompleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class Tasks extends Table {
  TextColumn get id => text()();
  TextColumn get accountId => text()();
  TextColumn get threadId => text().nullable()();
  TextColumn get title => text()();
  TextColumn get notes => text().nullable()();
  DateTimeColumn get dueDate => dateTime().nullable()();
  BoolColumn get isCompleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class Events extends Table {
  TextColumn get id => text()();
  TextColumn get accountId => text()();
  TextColumn get title => text()();
  TextColumn get description => text().nullable()();
  DateTimeColumn get startTime => dateTime()();
  DateTimeColumn get endTime => dateTime()();
  TextColumn get location => text().nullable()();
  TextColumn get conferenceUrl => text().nullable()();
  TextColumn get organizerEmail => text().nullable()();
  BoolColumn get isAllDay => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {id};
}

class SyncStates extends Table {
  @override
  String get tableName => 'sync_state';

  TextColumn get key => text()(); // e.g. accountId_threads
  DateTimeColumn get lastSyncTimestamp => dateTime().nullable()();
  TextColumn get cursor => text().nullable()();
  TextColumn get deltaToken => text().nullable()();
  TextColumn get status =>
      text().withDefault(const Constant('idle'))(); // idle, syncing, error
  TextColumn get errorMessage => text().nullable()();

  @override
  Set<Column> get primaryKey => {key};
}
