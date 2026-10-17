export interface RRuleOptions {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval?: number;
  count?: number;
  until?: Date;
  byDay?: string[]; // ['MO', 'WE', 'FR']
}

export class RRuleExpander {
  /**
   * Parse standard iCalendar RRULE string into options.
   * Example: "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR;COUNT=10"
   */
  static parse(rruleStr: string): RRuleOptions {
    const parts = rruleStr.replace(/^RRULE:/i, '').split(';');
    const options: Partial<RRuleOptions> = { interval: 1 };

    for (const part of parts) {
      const [key, val] = part.split('=');
      if (!key || !val) continue;

      const upperKey = key.toUpperCase();
      if (upperKey === 'FREQ') {
        options.freq = val.toUpperCase() as 'DAILY' | 'WEEKLY' | 'MONTHLY';
      } else if (upperKey === 'INTERVAL') {
        options.interval = parseInt(val, 10) || 1;
      } else if (upperKey === 'COUNT') {
        options.count = parseInt(val, 10);
      } else if (upperKey === 'UNTIL') {
        options.until = new Date(val);
      } else if (upperKey === 'BYDAY') {
        options.byDay = val.toUpperCase().split(',');
      }
    }

    return options as RRuleOptions;
  }

  /**
   * Expands recurring event instances across a date range [windowStart, windowEnd]
   * while preserving the original wall-clock hours and minutes across Daylight Saving Time boundaries.
   */
  static expand(
    start: Date,
    durationMs: number,
    rruleStr: string,
    windowStart: Date,
    windowEnd: Date,
  ): Array<{ start: Date; end: Date }> {
    const options = this.parse(rruleStr);
    const instances: Array<{ start: Date; end: Date }> = [];

    const startHours = start.getUTCHours();
    const startMinutes = start.getUTCMinutes();

    let current = new Date(start.getTime());
    let generated = 0;
    const maxIterations = 500;

    while (
      current.getTime() <= windowEnd.getTime() &&
      generated < (options.count || maxIterations)
    ) {
      if (options.until && current.getTime() > options.until.getTime()) {
        break;
      }

      // Check if instance falls within requested query window
      const instanceEnd = new Date(current.getTime() + durationMs);
      if (current.getTime() >= windowStart.getTime() && current.getTime() <= windowEnd.getTime()) {
        instances.push({
          start: new Date(current.getTime()),
          end: instanceEnd,
        });
      }

      generated++;

      // Advance current instance based on frequency
      if (options.freq === 'DAILY') {
        current = new Date(current.getTime() + (options.interval || 1) * 86400 * 1000);
      } else if (options.freq === 'WEEKLY') {
        current = new Date(current.getTime() + (options.interval || 1) * 7 * 86400 * 1000);
      } else if (options.freq === 'MONTHLY') {
        const nextMonth = current.getUTCMonth() + (options.interval || 1);
        current.setUTCMonth(nextMonth);
      } else {
        break;
      }

      // Re-align to exact start wall-clock time (preserves DST schedule)
      current.setUTCHours(startHours, startMinutes, 0, 0);
    }

    return instances;
  }
}
