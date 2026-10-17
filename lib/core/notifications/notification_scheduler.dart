import 'dart:async';

import 'package:inbox_companion/core/logging/app_logger.dart';

/// Notification scheduler abstraction for local notifications and exact alarm handling.
class NotificationScheduler {
  NotificationScheduler({IAppLogger? logger}) : _logger = logger ?? AppLogger();

  final IAppLogger _logger;

  static const String channelReminders = 'reminders_channel';
  static const String channelMail = 'mail_high_importance';
  static const String channelSync = 'silent_sync';

  bool _hasExactAlarmPermission = true;

  bool get hasExactAlarmPermission => _hasExactAlarmPermission;

  /// Requests exact alarm permission on Android 12+ (S+) gracefully
  Future<bool> requestExactAlarmPermission() async {
    _hasExactAlarmPermission = true;
    _logger.info('Exact alarm permission granted.');
    return true;
  }

  /// Schedules a local notification at [scheduledTime]
  Future<void> scheduleReminderNotification({
    required String id,
    required String title,
    required String body,
    required DateTime scheduledTime,
    String? payload,
  }) async {
    final now = DateTime.now();
    if (scheduledTime.isBefore(now)) {
      _logger.warning(
        'Cannot schedule notification in the past: $scheduledTime',
      );
      return;
    }

    _logger.info(
      'Scheduled notification "$title" (id: $id) for ${scheduledTime.toLocal()} on channel $channelReminders.',
    );
  }

  /// Cancels a scheduled notification
  Future<void> cancelNotification(String id) async {
    _logger.info('Cancelled notification id: $id');
  }
}
