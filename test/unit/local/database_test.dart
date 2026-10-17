import 'package:drift/drift.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/data/local/app_database.dart';

void main() {
  late AppDatabase db;

  setUp(() {
    db = AppDatabase.inMemory();
  });

  tearDown(() async {
    await db.close();
  });

  group('Drift SQLite Database Unit Tests', () {
    test('Can insert, update, and stream accounts', () async {
      final now = DateTime.now();
      await db.upsertAccount(
        AccountsCompanion.insert(
          id: 'acc_01',
          email: 'test@example.com',
          displayName: 'Test User',
          provider: 'google',
          isDefault: const Value(true),
          createdAt: now,
          updatedAt: now,
        ),
      );

      final accounts = await db.watchAccounts().first;
      expect(accounts.length, equals(1));
      expect(accounts.first.email, equals('test@example.com'));
      expect(accounts.first.isDefault, isTrue);
    });

    test('Streams reactive threads ordered by timestamp', () async {
      final now = DateTime.now();
      await db.upsertThread(
        ThreadsCompanion.insert(
          id: 't_01',
          accountId: 'acc_01',
          subject: 'Older thread',
          snippet: 'Snippet 1',
          lastMessageTimestamp: now.subtract(const Duration(hours: 2)),
        ),
      );
      await db.upsertThread(
        ThreadsCompanion.insert(
          id: 't_02',
          accountId: 'acc_01',
          subject: 'Newer thread',
          snippet: 'Snippet 2',
          lastMessageTimestamp: now,
        ),
      );

      final list = await db
          .watchThreads(accountId: 'acc_01', folder: 'inbox')
          .first;
      expect(list.length, equals(2));
      expect(list.first.id, equals('t_02')); // newer first
    });

    test('deleteAccountData wipes all related records cleanly', () async {
      final now = DateTime.now();
      await db.upsertAccount(
        AccountsCompanion.insert(
          id: 'acc_01',
          email: 'test@example.com',
          displayName: 'Test User',
          provider: 'google',
          createdAt: now,
          updatedAt: now,
        ),
      );
      await db.upsertThread(
        ThreadsCompanion.insert(
          id: 't_01',
          accountId: 'acc_01',
          subject: 'Thread',
          snippet: 'Snippet',
          lastMessageTimestamp: now,
        ),
      );

      // Verify exists
      expect((await db.watchAccounts().first).length, equals(1));
      expect(
        (await db.watchThreads(accountId: 'acc_01').first).length,
        equals(1),
      );

      // Nuke account data
      await db.deleteAccountData('acc_01');

      expect((await db.watchAccounts().first).isEmpty, isTrue);
      expect(
        (await db.watchThreads(accountId: 'acc_01').first).isEmpty,
        isTrue,
      );
    });

    test(
      'resetInFlightOutbox resets stranded items on process restart',
      () async {
        await db.enqueueOutbox(
          OutboxEntriesCompanion.insert(
            id: 'out_01',
            idempotencyKey: 'idem_01',
            accountId: 'acc_01',
            actionType: 'archiveThread',
            targetId: 't_01',
            createdAt: DateTime.now(),
          ),
        );

        await db.markOutboxInFlight('out_01');
        var pending = await db.watchPendingOutbox().first;
        expect(pending.isEmpty, isTrue); // in_flight is not pending

        // Simulate process restart
        await db.resetInFlightOutbox();

        pending = await db.watchPendingOutbox().first;
        expect(pending.length, equals(1));
        expect(pending.first.status, equals('pending'));
      },
    );
  });
}
