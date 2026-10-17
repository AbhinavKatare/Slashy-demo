import 'package:drift/drift.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/core/config/app_config.dart';
import 'package:inbox_companion/core/providers/app_providers.dart';
import 'package:inbox_companion/core/theme/app_theme.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:inbox_companion/features/conversation/presentation/safe_email_view.dart';
import 'package:inbox_companion/features/inbox/presentation/inbox_screen.dart';

void main() {
  late AppDatabase db;

  setUp(() {
    db = AppDatabase.inMemory();
  });

  tearDown(() async {
    await db.close();
  });

  group('Mail Experience & Conversation Widget Tests', () {
    testWidgets('InboxScreen displays empty state when database is empty', (
      tester,
    ) async {
      final config = AppConfig.dev(useMockServer: false);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            configProvider.overrideWithValue(config),
            appDatabaseProvider.overrideWithValue(db),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const InboxScreen(),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('No conversations here'), findsOneWidget);
      expect(find.text('Inbox'), findsOneWidget);

      await tester.pumpWidget(const SizedBox());
      await tester.pump(const Duration(milliseconds: 50));
    });

    testWidgets('InboxScreen renders threads reactively from database stream', (
      tester,
    ) async {
      final config = AppConfig.dev(useMockServer: false);
      final now = DateTime.now();

      await db.upsertThread(
        ThreadsCompanion.insert(
          id: 'thread_xyz',
          accountId: 'acc_01',
          subject: 'Team Sync Meeting Notes',
          snippet: 'Here are the key takeaways from today...',
          lastMessageTimestamp: now,
          unread: const Value(true),
        ),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            configProvider.overrideWithValue(config),
            appDatabaseProvider.overrideWithValue(db),
          ],
          child: MaterialApp(
            theme: AppTheme.light(),
            home: const InboxScreen(),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Team Sync Meeting Notes'), findsOneWidget);
      expect(
        find.text('Here are the key takeaways from today...'),
        findsOneWidget,
      );

      await tester.pumpWidget(const SizedBox());
      await tester.pump(const Duration(milliseconds: 50));
    });

    testWidgets(
      'SafeEmailView displays privacy banner when remote images are blocked',
      (tester) async {
        const emailHtml =
            '<p>Welcome to the conference!</p><img src="https://events.example.com/badge.png">';

        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.light(),
            home: const Scaffold(
              body: SafeEmailView(
                htmlBody: emailHtml,
                senderEmail: 'events@example.com',
                initialAllowRemoteImages: false,
              ),
            ),
          ),
        );

        await tester.pumpAndSettle();

        expect(
          find.textContaining('Remote images blocked (1)'),
          findsOneWidget,
        );
        expect(find.text('Load Images Once'), findsOneWidget);
        expect(find.text('Always Load from Sender'), findsOneWidget);
        expect(
          find.textContaining('Welcome to the conference!'),
          findsOneWidget,
        );

        // Tap "Load Images Once"
        await tester.tap(find.text('Load Images Once'));
        await tester.pumpAndSettle();

        // Banner is removed
        expect(find.textContaining('Remote images blocked'), findsNothing);
      },
    );
  });
}
