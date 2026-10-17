import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/data/api/inbox_companion_api_client.dart';
import 'package:inbox_companion/data/local/app_database.dart';
import 'package:inbox_companion/data/sync/sync_service.dart';
import 'package:inbox_companion/features/compose/application/compose_controller.dart';
import 'package:inbox_companion/features/compose/domain/attachment_item.dart';
import 'package:inbox_companion/features/compose/domain/recipient.dart';
import 'package:inbox_companion/features/compose/domain/schedule_preset.dart';
import 'package:mocktail/mocktail.dart';

class MockApiClient extends Mock implements InboxCompanionApiClient {}

void main() {
  late AppDatabase db;
  late MockApiClient mockApiClient;
  late SyncService syncService;

  setUp(() {
    db = AppDatabase.inMemory();
    mockApiClient = MockApiClient();
    syncService = SyncService(db: db, apiClient: mockApiClient);
  });

  tearDown(() async {
    syncService.dispose();
    await db.close();
  });

  group('Recipient Validation Tests', () {
    test('Valid email addresses pass validation', () {
      const valid1 = Recipient(email: 'alex@acme.test', name: 'Alex');
      const valid2 = Recipient(email: 'user.name+tag@domain.co.uk');

      expect(valid1.isValid, isTrue);
      expect(valid1.validationError, isNull);
      expect(valid2.isValid, isTrue);
      expect(valid2.validationError, isNull);
    });

    test('Malformed and empty email addresses fail validation', () {
      const empty = Recipient(email: '');
      const missingAt = Recipient(email: 'notanemail.com');
      const missingDomain = Recipient(email: 'user@');

      expect(empty.isValid, isFalse);
      expect(empty.validationError, isNotNull);
      expect(missingAt.isValid, isFalse);
      expect(missingAt.validationError, isNotNull);
      expect(missingDomain.isValid, isFalse);
      expect(missingDomain.validationError, isNotNull);
    });
  });

  group('Attachment Constraints & Security Tests', () {
    test('Allowed file formats under 10MB pass validation', () {
      const doc = AttachmentItem(
        id: 'att_1',
        name: 'Report.pdf',
        sizeBytes: 204800, // 200 KB
        mimeType: 'application/pdf',
      );
      expect(doc.isBlockedExtension, isFalse);
      expect(doc.isUnderSingleLimit, isTrue);
      expect(doc.validationError, isNull);
    });

    test('Dangerous executable extensions are blocked', () {
      const script = AttachmentItem(
        id: 'att_2',
        name: 'payload.bat',
        sizeBytes: 1024,
        mimeType: 'application/x-bat',
      );
      const exe = AttachmentItem(
        id: 'att_3',
        name: 'installer.EXE',
        sizeBytes: 50000,
        mimeType: 'application/octet-stream',
      );

      expect(script.isBlockedExtension, isTrue);
      expect(script.validationError, contains('blocked for security reasons'));
      expect(exe.isBlockedExtension, isTrue);
      expect(exe.validationError, contains('blocked for security reasons'));
    });

    test('Single attachment exceeding 10MB fails validation', () {
      const oversized = AttachmentItem(
        id: 'att_4',
        name: 'archive.zip',
        sizeBytes: 15 * 1024 * 1024, // 15 MB
        mimeType: 'application/zip',
      );

      expect(oversized.isUnderSingleLimit, isFalse);
      expect(oversized.validationError, contains('exceeds 10 MB limit'));
    });
  });

  group('Schedule Presets Tests', () {
    test('generatePresets generates valid presets with current timezone', () {
      final presets = SchedulePreset.generatePresets(
        referenceTime: DateTime(2026, 10, 13, 10, 0), // Tuesday 10am
      );

      expect(presets.isNotEmpty, isTrue);
      for (final p in presets) {
        expect(p.scheduledTime.isAfter(DateTime(2026, 10, 13, 10, 0)), isTrue);
        expect(p.description, contains(DateTime.now().timeZoneName));
      }
    });
  });

  group('ComposeController Reply, Forward & Autosave Tests', () {
    late Thread sampleThread;
    late Message sampleMessage;

    setUp(() {
      final now = DateTime.now();
      sampleThread = Thread(
        id: 'th_test_01',
        accountId: 'acc_01',
        subject: 'Q4 Budget Planning',
        snippet: 'Please find attached the budget proposal...',
        lastMessageTimestamp: now,
        unread: false,
        starred: false,
        archived: false,
        trashed: false,
        spam: false,
        hasAttachments: false,
        messageCount: 1,
        participantsJson: '[]',
        labelIdsJson: '[]',
      );

      sampleMessage = Message(
        id: 'msg_test_01',
        threadId: 'th_test_01',
        accountId: 'acc_01',
        senderName: 'Sarah Connor',
        senderEmail: 'sarah@skynet-resistance.test',
        toRecipientsJson: '[{"name":"Alex Morgan","email":"alex@acme.test"},{"name":"Kyle Reese","email":"kyle@resistance.test"}]',
        ccRecipientsJson:
            '[{"name":"John Connor","email":"john@resistance.test"}]',
        bccRecipientsJson: '[]',
        subject: 'Q4 Budget Planning',
        bodyPlain: 'Here are the preliminary numbers for next year.',
        bodyHtml: '<p>Here are the preliminary numbers for next year.</p>',
        timestamp: now,
        isRead: true,
        isStarred: false,
        isDraft: false,
      );
    });

    test('initReply sets recipient to sender and prepends Re: to subject', () {
      final controller = ComposeController(
        db: db,
        syncService: syncService,
        accountId: 'acc_01',
      );

      controller.initReply(
        thread: sampleThread,
        message: sampleMessage,
        currentAccountEmail: 'alex@acme.test',
      );

      expect(controller.state.toRecipients.length, equals(1));
      expect(
        controller.state.toRecipients.first.email,
        equals('sarah@skynet-resistance.test'),
      );
      expect(controller.state.subject, equals('Re: Q4 Budget Planning'));
      expect(controller.state.body, contains('Sarah Connor wrote:'));
    });

    test('initReplyAll includes all participants except current user', () {
      final controller = ComposeController(
        db: db,
        syncService: syncService,
        accountId: 'acc_01',
      );

      controller.initReplyAll(
        thread: sampleThread,
        message: sampleMessage,
        currentAccountEmail: 'alex@acme.test',
      );

      expect(controller.state.toRecipients.length, equals(1));
      expect(
        controller.state.toRecipients.first.email,
        equals('sarah@skynet-resistance.test'),
      );

      // Cc contains Kyle and John, but NOT Alex (current user) or Sarah (sender)
      final ccEmails = controller.state.ccRecipients
          .map((r) => r.email)
          .toList();
      expect(ccEmails, contains('kyle@resistance.test'));
      expect(ccEmails, contains('john@resistance.test'));
      expect(ccEmails, isNot(contains('alex@acme.test')));
      expect(ccEmails, isNot(contains('sarah@skynet-resistance.test')));
    });

    test('initForward leaves To empty and prepends Fwd:', () {
      final controller = ComposeController(
        db: db,
        syncService: syncService,
        accountId: 'acc_01',
      );

      controller.initForward(thread: sampleThread, message: sampleMessage);

      expect(controller.state.toRecipients, isEmpty);
      expect(controller.state.subject, equals('Fwd: Q4 Budget Planning'));
      expect(
        controller.state.body,
        contains('---------- Forwarded message ---------'),
      );
    });

    test(
      'Autosaves draft to local SQLite database and restores accurately',
      () async {
        final controller = ComposeController(
          db: db,
          syncService: syncService,
          accountId: 'acc_01',
        );

        controller.addToRecipient(
          const Recipient(email: 'partner@enterprise.test', name: 'Partner'),
        );
        controller.setSubject('Project Kickoff Proposal');
        controller.setBody('Looking forward to our collaboration next week.');

        // Save draft to SQLite
        await controller.saveDraft();

        expect(controller.state.autosaveStatus, equals('saved'));

        // Check draft exists in Drift table
        final drafts = await db.watchDrafts(accountId: 'acc_01').first;
        expect(drafts.length, equals(1));
        expect(drafts.first.subject, equals('Project Kickoff Proposal'));

        // Restore draft in fresh controller
        final restoredController = ComposeController(
          db: db,
          syncService: syncService,
          accountId: 'acc_01',
        );
        await restoredController.restoreDraft(drafts.first.id);

        expect(
          restoredController.state.subject,
          equals('Project Kickoff Proposal'),
        );
        expect(
          restoredController.state.toRecipients.first.email,
          equals('partner@enterprise.test'),
        );
        expect(
          restoredController.state.body,
          contains('Looking forward to our collaboration next week.'),
        );
      },
    );

    test('Undo send can be cancelled, preventing dispatch to outbox', () async {
      final controller = ComposeController(
        db: db,
        syncService: syncService,
        accountId: 'acc_01',
      );

      controller.addToRecipient(const Recipient(email: 'boss@acme.test'));
      controller.setSubject('Critical Update');
      controller.setBody('Please review immediately.');

      // User initiates send with 10s undo delay
      controller.startSendWithUndo(delaySeconds: 10);
      expect(controller.state.undoSendActive, isTrue);

      // User taps Undo
      controller.cancelUndo();

      expect(controller.state.undoSendActive, isFalse);

      // Verify nothing was queued in outbox
      final pendingOutbox = await db.watchPendingOutbox().first;
      expect(pendingOutbox, isEmpty);
    });
  });
}
