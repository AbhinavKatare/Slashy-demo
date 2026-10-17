import 'package:intl/intl.dart';

/// Preset schedule option for Schedule Send
class SchedulePreset {
  const SchedulePreset({
    required this.label,
    required this.scheduledTime,
    required this.description,
  });

  final String label;
  final DateTime scheduledTime;
  final String description;

  /// Generates dynamic schedule presets based on current device local time
  static List<SchedulePreset> generatePresets({DateTime? referenceTime}) {
    final now = referenceTime ?? DateTime.now();
    final tzName = now.timeZoneName;
    final timeFormat = DateFormat('EEE, MMM d, h:mm a');

    final presets = <SchedulePreset>[];

    // Later today: 6:00 PM (if currently before 5:00 PM)
    if (now.hour < 17) {
      final laterToday = DateTime(now.year, now.month, now.day, 18, 0);
      presets.add(
        SchedulePreset(
          label: 'This afternoon',
          scheduledTime: laterToday,
          description: '${timeFormat.format(laterToday)} ($tzName)',
        ),
      );
    }

    // Tomorrow morning: 8:00 AM
    final tomorrow = now.add(const Duration(days: 1));
    final tomorrowMorning = DateTime(
      tomorrow.year,
      tomorrow.month,
      tomorrow.day,
      8,
      0,
    );
    presets.add(
      SchedulePreset(
        label: 'Tomorrow morning',
        scheduledTime: tomorrowMorning,
        description: '${timeFormat.format(tomorrowMorning)} ($tzName)',
      ),
    );

    // Tomorrow afternoon: 1:00 PM
    final tomorrowAfternoon = DateTime(
      tomorrow.year,
      tomorrow.month,
      tomorrow.day,
      13,
      0,
    );
    presets.add(
      SchedulePreset(
        label: 'Tomorrow afternoon',
        scheduledTime: tomorrowAfternoon,
        description: '${timeFormat.format(tomorrowAfternoon)} ($tzName)',
      ),
    );

    // Next Monday morning: 8:00 AM
    var daysUntilMonday = (DateTime.monday - now.weekday + 7) % 7;
    if (daysUntilMonday == 0) daysUntilMonday = 7;
    final nextMonday = now.add(Duration(days: daysUntilMonday));
    final nextMondayMorning = DateTime(
      nextMonday.year,
      nextMonday.month,
      nextMonday.day,
      8,
      0,
    );
    presets.add(
      SchedulePreset(
        label: 'Next Monday morning',
        scheduledTime: nextMondayMorning,
        description: '${timeFormat.format(nextMondayMorning)} ($tzName)',
      ),
    );

    return presets;
  }
}
