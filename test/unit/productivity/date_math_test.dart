import 'package:flutter_test/flutter_test.dart';
import 'package:inbox_companion/features/productivity/domain/snooze_preset.dart';

void main() {
  group('Date Math & DST/Timezone Calculations Tests', () {
    test('tomorrowMorning always targets next day at 8:00 AM regardless of input hour', () {
      final morningTime = DateTime(2026, 10, 13, 7, 15);
      final nightTime = DateTime(2026, 10, 13, 23, 45);

      final nextFromMorning = SnoozeCalculator.tomorrowMorning(morningTime);
      final nextFromNight = SnoozeCalculator.tomorrowMorning(nightTime);

      expect(nextFromMorning.year, equals(2026));
      expect(nextFromMorning.month, equals(10));
      expect(nextFromMorning.day, equals(14));
      expect(nextFromMorning.hour, equals(8));
      expect(nextFromMorning.minute, equals(0));

      expect(nextFromNight.year, equals(2026));
      expect(nextFromNight.month, equals(10));
      expect(nextFromNight.day, equals(14));
      expect(nextFromNight.hour, equals(8));
      expect(nextFromNight.minute, equals(0));
    });

    test('tomorrowMorning handles DST transition date math cleanly', () {
      // Spring forward transition test (US Daylight Saving starts second Sunday of March)
      // e.g. March 8, 2026
      final beforeDst = DateTime(2026, 3, 7, 14, 0);
      final dstTarget = SnoozeCalculator.tomorrowMorning(beforeDst);

      expect(dstTarget.year, equals(2026));
      expect(dstTarget.month, equals(3));
      expect(dstTarget.day, equals(8));
      expect(dstTarget.hour, equals(8));
      expect(dstTarget.minute, equals(0));

      // Fall back transition test (first Sunday of November, e.g. Nov 1, 2026)
      final beforeFallBack = DateTime(2026, 10, 31, 16, 0);
      final fallBackTarget = SnoozeCalculator.tomorrowMorning(beforeFallBack);

      expect(fallBackTarget.year, equals(2026));
      expect(fallBackTarget.month, equals(11));
      expect(fallBackTarget.day, equals(1));
      expect(fallBackTarget.hour, equals(8));
      expect(fallBackTarget.minute, equals(0));
    });

    test('thisWeekend correctly computes target Saturday at 9:00 AM', () {
      // Tuesday, Oct 13, 2026
      final tuesday = DateTime(2026, 10, 13, 11, 0);
      final weekendFromTue = SnoozeCalculator.thisWeekend(tuesday);

      expect(weekendFromTue.weekday, equals(DateTime.saturday));
      expect(weekendFromTue.day, equals(17));
      expect(weekendFromTue.hour, equals(9));

      // Friday, Oct 16, 2026
      final friday = DateTime(2026, 10, 16, 15, 30);
      final weekendFromFri = SnoozeCalculator.thisWeekend(friday);

      expect(weekendFromFri.weekday, equals(DateTime.saturday));
      expect(weekendFromFri.day, equals(17));
      expect(weekendFromFri.hour, equals(9));

      // Saturday, Oct 17, 2026 -> should target following Saturday (Oct 24)
      final saturday = DateTime(2026, 10, 17, 10, 0);
      final nextSaturday = SnoozeCalculator.thisWeekend(saturday);

      expect(nextSaturday.weekday, equals(DateTime.saturday));
      expect(nextSaturday.day, equals(24));
      expect(nextSaturday.hour, equals(9));
    });

    test('nextWeek computes following Monday at 8:00 AM', () {
      // Tuesday, Oct 13, 2026 -> Next Monday is Oct 19
      final tuesday = DateTime(2026, 10, 13, 10, 0);
      final monday = SnoozeCalculator.nextWeek(tuesday);

      expect(monday.weekday, equals(DateTime.monday));
      expect(monday.day, equals(19));
      expect(monday.hour, equals(8));
      expect(monday.minute, equals(0));

      // Monday, Oct 19, 2026 -> Targets subsequent Monday (Oct 26)
      final onMonday = DateTime(2026, 10, 19, 14, 0);
      final subsequentMonday = SnoozeCalculator.nextWeek(onMonday);

      expect(subsequentMonday.weekday, equals(DateTime.monday));
      expect(subsequentMonday.day, equals(26));
      expect(subsequentMonday.hour, equals(8));
    });

    test('followUpIfNoReply computes exactly N days at 9:00 AM', () {
      final now = DateTime(2026, 10, 13, 15, 0);
      final followUp = SnoozeCalculator.followUpIfNoReply(now, days: 3);

      expect(followUp.day, equals(16));
      expect(followUp.hour, equals(9));
      expect(followUp.minute, equals(0));
    });

    test(
      'laterToday targets 6:00 PM before 5:00 PM and 9:00 PM after 5:00 PM',
      () {
        final morning = DateTime(2026, 10, 13, 11, 30);
        final lateAfternoon = DateTime(2026, 10, 13, 17, 15);

        final targetMorning = SnoozeCalculator.laterToday(morning);
        final targetEvening = SnoozeCalculator.laterToday(lateAfternoon);

        expect(targetMorning.hour, equals(18));
        expect(targetMorning.day, equals(13));

        expect(targetEvening.hour, equals(21));
        expect(targetEvening.day, equals(13));
      },
    );
  });
}
