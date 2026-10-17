import 'package:intl/intl.dart';

class SnoozeOption {
  const SnoozeOption({
    required this.id,
    required this.title,
    required this.targetTime,
    required this.description,
    this.isFollowUp = false,
  });

  final String id;
  final String title;
  final DateTime targetTime;
  final String description;
  final bool isFollowUp;
}

class SnoozeCalculator {
  /// Computes "Later today" at 6:00 PM (or 9:00 PM if already past 5:00 PM)
  static DateTime laterToday(DateTime now) {
    final hour = now.hour < 17 ? 18 : 21;
    return DateTime(now.year, now.month, now.day, hour, 0);
  }

  /// Computes "Tomorrow morning" at 8:00 AM (safe across 23-hour and 25-hour DST transition days)
  static DateTime tomorrowMorning(DateTime now) {
    final nextDay = now.add(const Duration(days: 1));
    return DateTime(nextDay.year, nextDay.month, nextDay.day, 8, 0);
  }

  /// Computes "This weekend" (Saturday 9:00 AM)
  static DateTime thisWeekend(DateTime now) {
    var daysUntilSaturday = (DateTime.saturday - now.weekday + 7) % 7;
    if (daysUntilSaturday == 0) daysUntilSaturday = 7;
    final target = now.add(Duration(days: daysUntilSaturday));
    return DateTime(target.year, target.month, target.day, 9, 0);
  }

  /// Computes "Next week" (Next Monday at 8:00 AM)
  static DateTime nextWeek(DateTime now) {
    var daysUntilMonday = (DateTime.monday - now.weekday + 7) % 7;
    if (daysUntilMonday == 0) daysUntilMonday = 7;
    final target = now.add(Duration(days: daysUntilMonday));
    return DateTime(target.year, target.month, target.day, 8, 0);
  }

  /// Computes "Follow-up if no reply in [days] days" at 9:00 AM
  static DateTime followUpIfNoReply(DateTime now, {int days = 3}) {
    final target = now.add(Duration(days: days));
    return DateTime(target.year, target.month, target.day, 9, 0);
  }

  /// Generates full list of snooze options for UI selection
  static List<SnoozeOption> generateOptions({DateTime? referenceTime}) {
    final now = referenceTime ?? DateTime.now();
    final tz = now.timeZoneName;
    final fmt = DateFormat('EEE, MMM d, h:mm a');

    final later = laterToday(now);
    final tomorrow = tomorrowMorning(now);
    final weekend = thisWeekend(now);
    final nextWk = nextWeek(now);
    final followUp = followUpIfNoReply(now, days: 3);

    return [
      SnoozeOption(
        id: 'later_today',
        title: 'Later today',
        targetTime: later,
        description: '${fmt.format(later)} ($tz)',
      ),
      SnoozeOption(
        id: 'tomorrow',
        title: 'Tomorrow morning',
        targetTime: tomorrow,
        description: '${fmt.format(tomorrow)} ($tz)',
      ),
      SnoozeOption(
        id: 'weekend',
        title: 'This weekend',
        targetTime: weekend,
        description: '${fmt.format(weekend)} ($tz)',
      ),
      SnoozeOption(
        id: 'next_week',
        title: 'Next week',
        targetTime: nextWk,
        description: '${fmt.format(nextWk)} ($tz)',
      ),
      SnoozeOption(
        id: 'follow_up',
        title: 'Follow-up (if no reply)',
        targetTime: followUp,
        description: 'Remind on ${fmt.format(followUp)} ($tz)',
        isFollowUp: true,
      ),
    ];
  }
}
