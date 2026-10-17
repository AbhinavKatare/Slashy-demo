import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:drift/drift.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/core/error/failures.dart';
import 'package:inbox_companion/data/api/inbox_companion_api_client.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:inbox_companion/data/models/thread_model.dart';
import 'package:inbox_companion/data/sync/sync_service.dart';
import 'package:mocktail/mocktail.dart';

class MockApiClient extends Mock implements InboxCompanionApiClient {}

class MockConnectivity extends Mock implements Connectivity {}

void main() {
  late AppDatabase db;
  late MockApiClient mockApiClient;
  late MockConnectivity mockConnectivity;
  late SyncService syncService;

  setUp(() {
    db = AppDatabase.inMemory();
    mockApiClient = MockApiClient();
    mockConnectivity = MockConnectivity();

    when(() => mockConnectivity.onConnectivityChanged)
        .thenAnswer((_) => Stream.value([ConnectivityResult.wifi]));

    syncService = SyncService(
      db: db,
      apiClient: mockApiClient,
      connectivity: mockConnectivity,
    );
  });

  tearDown(() async {
    syncService.dispose();
    await db.close();
  });

  group('SyncService & Outbox Queue Tests', () {
    test(
      'Applies optimistic update immediately and executes server call',
      () async {
        final now = DateTime.now();
        await db.upsertThread(
          ThreadsCompanion.insert(
            id: 't_01',
            accountId: 'acc_01',
            subject: 'Test Thread',
            snippet: 'Snippet',
            lastMessageTimestamp: now,
            archived: const Value(false),
          ),
        );

        final dummyThread = ThreadModel(
          id: 't_01',
          accountId: 'acc_01',
          subject: 'Test Thread',
          snippet: 'Snippet',
          lastMessageAt: DateTime.now().toIso8601String(),
          isUnread: false,
          isStarred: false,
          messageCount: 1,
          participants: const [],
          labelIds: const [],
        );

        when(() => mockApiClient.updateThread('t_01', any()))
            .thenAnswer((_) async => dummyThread);

        // Enqueue optimistic archive
        await syncService.enqueueOptimisticAction(
          accountId: 'acc_01',
          actionType: OutboxActionType.archiveThread,
          targetId: 't_01',
        );

        // Verify thread is immediately archived in local Drift DB
        final thread = await db.watchThreadById('t_01').first;
        expect(thread?.archived, isTrue);

        // Wait for outbox processing
        await syncService.processOutbox();

        // Verify API was called and outbox entry completed (removed)
        verify(() => mockApiClient.updateThread('t_01', any())).called(1);
        final pending = await db.watchPendingOutbox().first;
        expect(pending.isEmpty, isTrue);
      },
    );

    test('Rolls back optimistic update on server rejection', () async {
      final now = DateTime.now();
      await db.upsertThread(
        ThreadsCompanion.insert(
          id: 't_02',
          accountId: 'acc_01',
          subject: 'Test Thread 2',
          snippet: 'Snippet 2',
          lastMessageTimestamp: now,
          starred: const Value(false),
        ),
      );

      when(() => mockApiClient.updateThread('t_02', any())).thenThrow(
        const ValidationFailure(message: 'Thread does not exist on server'),
      );

      await syncService.enqueueOptimisticAction(
        accountId: 'acc_01',
        actionType: OutboxActionType.starThread,
        targetId: 't_02',
      );

      // Optimistic star applied initially
      var thread = await db.watchThreadById('t_02').first;
      expect(thread?.starred, isTrue);

      // Process outbox -> server throws permanent rejection
      await syncService.processOutbox();

      // Verify local DB was rolled back to unstarred!
      thread = await db.watchThreadById('t_02').first;
      expect(thread?.starred, isFalse);
    });

    test(
      'undoAction rolls back optimistic update and removes outbox entry',
      () async {
        final now = DateTime.now();
        await db.upsertThread(
          ThreadsCompanion.insert(
            id: 't_03',
            accountId: 'acc_01',
            subject: 'Test Thread 3',
            snippet: 'Snippet 3',
            lastMessageTimestamp: now,
            unread: const Value(true),
          ),
        );

        final outboxId = await syncService.enqueueOptimisticAction(
          accountId: 'acc_01',
          actionType: OutboxActionType.markRead,
          targetId: 't_03',
        );

        var thread = await db.watchThreadById('t_03').first;
        expect(thread?.unread, isFalse);

        // User taps "Undo"
        await syncService.undoAction(outboxId);

        // Thread is restored to unread
        thread = await db.watchThreadById('t_03').first;
        expect(thread?.unread, isTrue);
      },
    );
  });
}
