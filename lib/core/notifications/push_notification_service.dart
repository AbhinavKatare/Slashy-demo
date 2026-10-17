import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:inbox_companion/core/logging/app_logger.dart';
import 'package:inbox_companion/data/sync/sync_service.dart';

class PushNotificationService {
  PushNotificationService({
    required this.syncService,
    FlutterSecureStorage? secureStorage,
    IAppLogger? logger,
  }) : _secureStorage = secureStorage ?? const FlutterSecureStorage(),
       _logger = logger ?? AppLogger();

  final SyncService syncService;
  final FlutterSecureStorage _secureStorage;
  final IAppLogger _logger;

  static const String channelHighImportanceMail = 'mail_high_importance';
  static const String channelReminders = 'reminders_channel';
  static const String channelSilentSync = 'silent_sync';

  static const String _kQuietHoursEnabledKey = 'notif_quiet_hours_enabled';
  static const String _kQuietHoursStartKey = 'notif_quiet_hours_start_hour';
  static const String _kQuietHoursEndKey = 'notif_quiet_hours_end_hour';

  Future<bool> isQuietHoursEnabled() async {
    final val = await _secureStorage.read(key: _kQuietHoursEnabledKey);
    return val == 'true';
  }

  Future<void> setQuietHours({
    required bool enabled,
    int startHour = 22,
    int endHour = 7,
  }) async {
    await _secureStorage.write(
      key: _kQuietHoursEnabledKey,
      value: enabled.toString(),
    );
    await _secureStorage.write(
      key: _kQuietHoursStartKey,
      value: startHour.toString(),
    );
    await _secureStorage.write(
      key: _kQuietHoursEndKey,
      value: endHour.toString(),
    );
  }

  /// Determines if quiet hours are currently in effect
  bool isQuietHoursActive({
    DateTime? currentTime,
    int startHour = 22, // 10 PM
    int endHour = 7, // 7 AM
  }) {
    final now = currentTime ?? DateTime.now();
    final hour = now.hour;

    if (startHour > endHour) {
      // Overnight window (e.g. 22:00 to 07:00)
      return hour >= startHour || hour < endHour;
    } else {
      // Same-day window (e.g. 13:00 to 15:00)
      return hour >= startHour && hour < endHour;
    }
  }

  /// Handles inline notification actions (Archive, Mark as Read) routing through Outbox
  Future<void> handleInlineAction({
    required String action,
    required String threadId,
    required String accountId,
  }) async {
    _logger.info(
      'Processing notification inline action "$action" for thread $threadId.',
    );

    switch (action.toLowerCase()) {
      case 'archive':
        await syncService.enqueueOptimisticAction(
          accountId: accountId,
          actionType: OutboxActionType.archiveThread,
          targetId: threadId,
        );
        break;
      case 'mark_read':
      case 'read':
        await syncService.enqueueOptimisticAction(
          accountId: accountId,
          actionType: OutboxActionType.markRead,
          targetId: threadId,
        );
        break;
      case 'trash':
      case 'delete':
        await syncService.enqueueOptimisticAction(
          accountId: accountId,
          actionType: OutboxActionType.trashThread,
          targetId: threadId,
        );
        break;
      default:
        _logger.warning('Unknown notification inline action: $action');
    }
  }

  /// Resolves deep link into application router location
  String? resolveDeepLink(Uri uri) {
    if (uri.scheme != 'inboxcompanion') return null;

    if (uri.host == 'thread' || uri.path.startsWith('/thread/')) {
      final threadId = uri.pathSegments.isNotEmpty
          ? uri.pathSegments.last
          : uri.queryParameters['id'];
      if (threadId != null) return '/conversation/$threadId';
    }

    if (uri.host == 'compose' || uri.path == '/compose') {
      return '/compose';
    }

    if (uri.host == 'search' || uri.path == '/search') {
      final q = uri.queryParameters['q'];
      return q != null ? '/search?q=$q' : '/search';
    }

    return '/inbox';
  }
}
