import { CalendarService } from '../../src/modules/calendar/calendar.service';
import { NotificationsService } from '../../src/modules/notifications/notifications.service';
import { RRuleExpander } from '../../src/modules/calendar/recurrence/rrule-expander';

describe('Calendar Recurrence, DST & Notifications FCM (Task 11)', () => {
  let dbMock: any;
  let calendarService: CalendarService;
  let notificationsService: NotificationsService;
  const userId = 'user-uuid-1';

  beforeEach(() => {
    dbMock = {
      query: jest.fn(),
    };
    calendarService = new CalendarService(dbMock);
    notificationsService = new NotificationsService(dbMock);
  });

  describe('Calendar Recurrence (RRULE) & DST Wall-Clock Preservation', () => {
    it('parses RRULE strings into structured options', () => {
      const opts = RRuleExpander.parse('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR;COUNT=8');
      expect(opts.freq).toBe('WEEKLY');
      expect(opts.interval).toBe(2);
      expect(opts.byDay).toEqual(['MO', 'FR']);
      expect(opts.count).toBe(8);
    });

    it('expands daily recurrence instances within query window', () => {
      const start = new Date('2026-10-10T09:00:00.000Z');
      const windowStart = new Date('2026-10-10T00:00:00.000Z');
      const windowEnd = new Date('2026-10-14T23:59:59.000Z');

      const instances = RRuleExpander.expand(
        start,
        60 * 60 * 1000, // 1 hour
        'FREQ=DAILY;INTERVAL=1;COUNT=5',
        windowStart,
        windowEnd,
      );

      expect(instances.length).toBe(5);
      expect(instances[0].start.toISOString()).toBe('2026-10-10T09:00:00.000Z');
      expect(instances[1].start.toISOString()).toBe('2026-10-11T09:00:00.000Z');
      expect(instances[4].start.toISOString()).toBe('2026-10-14T09:00:00.000Z');
    });

    it('preserves wall-clock start hours across DST transitions', () => {
      // In US, DST ends on first Sunday in November (Nov 1, 2026).
      // Oct 30 is EDT (UTC-4); Nov 6 is EST (UTC-5).
      const start = new Date('2026-10-30T13:00:00.000Z'); // 9:00 AM EDT
      const windowStart = new Date('2026-10-25T00:00:00.000Z');
      const windowEnd = new Date('2026-11-15T00:00:00.000Z');

      const instances = RRuleExpander.expand(
        start,
        30 * 60 * 1000,
        'FREQ=WEEKLY;INTERVAL=1;COUNT=3',
        windowStart,
        windowEnd,
      );

      expect(instances.length).toBe(3);
      // All instances preserve the exact 13:00 UTC wall-clock time
      expect(instances[0].start.getUTCHours()).toBe(13);
      expect(instances[1].start.getUTCHours()).toBe(13);
      expect(instances[2].start.getUTCHours()).toBe(13);
    });
  });

  describe('Calendar Conflict Detection Hints', () => {
    it('detects overlapping event and computes exact overlap duration in minutes', async () => {
      dbMock.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'event-existing-1',
            title: 'Team Sprint Planning',
            start_time: new Date('2026-10-14T10:00:00.000Z'),
            end_time: new Date('2026-10-14T11:00:00.000Z'),
          },
        ],
      });

      const conflicts = await calendarService.detectConflicts(
        userId,
        new Date('2026-10-14T10:30:00.000Z'),
        new Date('2026-10-14T11:30:00.000Z'),
      );

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].conflictingEventId).toBe('event-existing-1');
      expect(conflicts[0].title).toBe('Team Sprint Planning');
      expect(conflicts[0].overlapMinutes).toBe(30); // 10:30 to 11:00 is 30 mins
    });
  });

  describe('Notifications FCM (Channels, Quiet Hours, Collapse Keys & Deduplication)', () => {
    it('correctly evaluates overnight quiet hours (22:00 to 07:00)', () => {
      // 23:30 is within quiet hours
      const night = new Date('2026-10-14T23:30:00.000Z');
      expect(notificationsService.isWithinQuietHours('22:00', '07:00', night)).toBe(true);

      // 03:15 is within quiet hours
      const earlyMorning = new Date('2026-10-14T03:15:00.000Z');
      expect(notificationsService.isWithinQuietHours('22:00', '07:00', earlyMorning)).toBe(true);

      // 14:00 is outside quiet hours
      const afternoon = new Date('2026-10-14T14:00:00.000Z');
      expect(notificationsService.isWithinQuietHours('22:00', '07:00', afternoon)).toBe(false);
    });

    it('suppresses non-urgent notifications during quiet hours', async () => {
      jest.spyOn(notificationsService, 'isWithinQuietHours').mockReturnValue(true);

      const res = await notificationsService.sendNotification(
        userId,
        { channel: 'urgent_mail', title: 'New message from Alex', isUrgent: false },
        { quietHoursEnabled: true, quietStart: '22:00', quietEnd: '07:00' },
      );

      expect(res.status).toBe('suppressed_quiet_hours');
    });

    it('delivers urgent notifications even during quiet hours', async () => {
      jest.spyOn(notificationsService, 'isWithinQuietHours').mockReturnValue(true);

      const res = await notificationsService.sendNotification(
        userId,
        { channel: 'urgent_mail', title: 'Security Alert: New Sign-in', isUrgent: true },
        { quietHoursEnabled: true, quietStart: '22:00', quietEnd: '07:00' },
      );

      expect(res.status).toBe('dispatched');
      expect(res.title).toBe('Security Alert: New Sign-in');
    });

    it('drops duplicate notification within 5-minute deduplication window', async () => {
      const payload = {
        channel: 'tasks' as const,
        title: 'Task due tomorrow: Complete slide deck',
        collapseKey: 'task-123',
      };

      // First dispatch succeeds
      const first = await notificationsService.sendNotification(userId, payload);
      expect(first.status).toBe('dispatched');

      // Immediate second dispatch is dropped as duplicate
      const second = await notificationsService.sendNotification(userId, payload);
      expect(second.status).toBe('dropped_duplicate');
    });
  });
});
