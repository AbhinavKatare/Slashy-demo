import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/core/logging/app_logger.dart';
import 'package:inbox_companion/core/notifications/push_notification_service.dart';
import 'package:inbox_companion/data/sync/sync_service.dart';

class RecordedAction {
  RecordedAction({
    required this.accountId,
    required this.actionType,
    required this.targetId,
    required this.payload,
  });

  final String accountId;
  final OutboxActionType actionType;
  final String targetId;
  final Map<String, dynamic> payload;
}

class FakeSyncService extends Fake implements SyncService {
  final List<RecordedAction> actions = [];

  @override
  Future<String> enqueueOptimisticAction({
    required String accountId,
    required OutboxActionType actionType,
    required String targetId,
    Map<String, dynamic> payload = const {},
  }) async {
    actions.add(
      RecordedAction(
        accountId: accountId,
        actionType: actionType,
        targetId: targetId,
        payload: payload,
      ),
    );
    return 'outbox_id_1';
  }
}

class FakeSecureStorage extends Fake implements FlutterSecureStorage {
  final Map<String, String> data = {};

  @override
  Future<String?> read({
    required String key,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    return data[key];
  }

  @override
  Future<void> write({
    required String key,
    required String? value,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    if (value != null) {
      data[key] = value;
    } else {
      data.remove(key);
    }
  }
}

class SilentLogger extends Fake implements IAppLogger {
  @override
  void info(String message, {String? tag, dynamic data}) {}

  @override
  void warning(
    String message, {
    String? tag,
    dynamic data,
    Object? error,
    StackTrace? stackTrace,
  }) {}
}

void main() {
  late FakeSyncService fakeSyncService;
  late FakeSecureStorage fakeSecureStorage;
  late PushNotificationService notificationService;

  setUp(() {
    fakeSyncService = FakeSyncService();
    fakeSecureStorage = FakeSecureStorage();
    notificationService = PushNotificationService(
      syncService: fakeSyncService,
      secureStorage: fakeSecureStorage,
      logger: SilentLogger(),
    );
  });

  group('PushNotificationService Quiet Hours Calculation', () {
    test('Overnight quiet hours window (22:00 to 07:00)', () {
      // 23:15 is inside overnight window
      expect(
        notificationService.isQuietHoursActive(
          currentTime: DateTime(2026, 10, 13, 23, 15),
          startHour: 22,
          endHour: 7,
        ),
        isTrue,
      );

      // Exactly at start (22:00) is inside
      expect(
        notificationService.isQuietHoursActive(
          currentTime: DateTime(2026, 10, 13, 22, 0),
          startHour: 22,
          endHour: 7,
        ),
        isTrue,
      );

      // 06:45 is inside
      expect(
        notificationService.isQuietHoursActive(
          currentTime: DateTime(2026, 10, 14, 6, 45),
          startHour: 22,
          endHour: 7,
        ),
        isTrue,
      );

      // Exactly at end (07:00) is outside
      expect(
        notificationService.isQuietHoursActive(
          currentTime: DateTime(2026, 10, 14, 7, 0),
          startHour: 22,
          endHour: 7,
        ),
        isFalse,
      );

      // Mid-day (14:30) is outside
      expect(
        notificationService.isQuietHoursActive(
          currentTime: DateTime(2026, 10, 14, 14, 30),
          startHour: 22,
          endHour: 7,
        ),
        isFalse,
      );
    });

    test('Same-day quiet hours window (13:00 to 15:00)', () {
      // 14:00 is inside
      expect(
        notificationService.isQuietHoursActive(
          currentTime: DateTime(2026, 10, 13, 14, 0),
          startHour: 13,
          endHour: 15,
        ),
        isTrue,
      );

      // 12:59 is outside
      expect(
        notificationService.isQuietHoursActive(
          currentTime: DateTime(2026, 10, 13, 12, 59),
          startHour: 13,
          endHour: 15,
        ),
        isFalse,
      );

      // 15:00 is outside
      expect(
        notificationService.isQuietHoursActive(
          currentTime: DateTime(2026, 10, 13, 15, 0),
          startHour: 13,
          endHour: 15,
        ),
        isFalse,
      );
    });

    test(
      'Saves and retrieves quiet hours preferences in secure storage',
      () async {
        expect(await notificationService.isQuietHoursEnabled(), isFalse);

        await notificationService.setQuietHours(
          enabled: true,
          startHour: 21,
          endHour: 8,
        );

        expect(await notificationService.isQuietHoursEnabled(), isTrue);
        expect(fakeSecureStorage.data['notif_quiet_hours_start_hour'], '21');
        expect(fakeSecureStorage.data['notif_quiet_hours_end_hour'], '8');
      },
    );
  });

  group('Notification Inline Actions Routing via Outbox', () {
    test('Archive action enqueues archiveThread to syncService', () async {
      await notificationService.handleInlineAction(
        action: 'archive',
        threadId: 'th_001',
        accountId: 'acc_001',
      );

      expect(fakeSyncService.actions.length, 1);
      final first = fakeSyncService.actions.first;
      expect(first.accountId, 'acc_001');
      expect(first.actionType, OutboxActionType.archiveThread);
      expect(first.targetId, 'th_001');
    });

    test('Mark as read action enqueues markRead to syncService', () async {
      await notificationService.handleInlineAction(
        action: 'mark_read',
        threadId: 'th_002',
        accountId: 'acc_001',
      );

      expect(fakeSyncService.actions.length, 1);
      final first = fakeSyncService.actions.first;
      expect(first.accountId, 'acc_001');
      expect(first.actionType, OutboxActionType.markRead);
      expect(first.targetId, 'th_002');
    });

    test('Trash action enqueues trashThread to syncService', () async {
      await notificationService.handleInlineAction(
        action: 'delete',
        threadId: 'th_003',
        accountId: 'acc_001',
      );

      expect(fakeSyncService.actions.length, 1);
      final first = fakeSyncService.actions.first;
      expect(first.accountId, 'acc_001');
      expect(first.actionType, OutboxActionType.trashThread);
      expect(first.targetId, 'th_003');
    });

    test('Unknown action is safely ignored without enqueueing', () async {
      await notificationService.handleInlineAction(
        action: 'invalid_action',
        threadId: 'th_004',
        accountId: 'acc_001',
      );

      expect(fakeSyncService.actions, isEmpty);
    });
  });

  group('Deep Link Resolution', () {
    test('Resolves thread URI to conversation screen path', () {
      final uri = Uri.parse('inboxcompanion://thread/th_555');
      final target = notificationService.resolveDeepLink(uri);
      expect(target, '/conversation/th_555');
    });

    test('Resolves compose URI to compose route', () {
      final uri = Uri.parse('inboxcompanion://compose');
      final target = notificationService.resolveDeepLink(uri);
      expect(target, '/compose');
    });

    test('Resolves search URI with query parameters', () {
      final uri = Uri.parse('inboxcompanion://search?q=urgent');
      final target = notificationService.resolveDeepLink(uri);
      expect(target, '/search?q=urgent');
    });

    test('Ignores external or invalid scheme URIs', () {
      final uri = Uri.parse('https://example.com/thread/123');
      final target = notificationService.resolveDeepLink(uri);
      expect(target, isNull);
    });
  });
}
