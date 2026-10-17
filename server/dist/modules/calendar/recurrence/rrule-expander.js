"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RRuleExpander = void 0;
class RRuleExpander {
    static parse(rruleStr) {
        const parts = rruleStr.replace(/^RRULE:/i, '').split(';');
        const options = { interval: 1 };
        for (const part of parts) {
            const [key, val] = part.split('=');
            if (!key || !val)
                continue;
            const upperKey = key.toUpperCase();
            if (upperKey === 'FREQ') {
                options.freq = val.toUpperCase();
            }
            else if (upperKey === 'INTERVAL') {
                options.interval = parseInt(val, 10) || 1;
            }
            else if (upperKey === 'COUNT') {
                options.count = parseInt(val, 10);
            }
            else if (upperKey === 'UNTIL') {
                options.until = new Date(val);
            }
            else if (upperKey === 'BYDAY') {
                options.byDay = val.toUpperCase().split(',');
            }
        }
        return options;
    }
    static expand(start, durationMs, rruleStr, windowStart, windowEnd) {
        const options = this.parse(rruleStr);
        const instances = [];
        const startHours = start.getUTCHours();
        const startMinutes = start.getUTCMinutes();
        let current = new Date(start.getTime());
        let generated = 0;
        const maxIterations = 500;
        while (current.getTime() <= windowEnd.getTime() &&
            generated < (options.count || maxIterations)) {
            if (options.until && current.getTime() > options.until.getTime()) {
                break;
            }
            const instanceEnd = new Date(current.getTime() + durationMs);
            if (current.getTime() >= windowStart.getTime() && current.getTime() <= windowEnd.getTime()) {
                instances.push({
                    start: new Date(current.getTime()),
                    end: instanceEnd,
                });
            }
            generated++;
            if (options.freq === 'DAILY') {
                current = new Date(current.getTime() + (options.interval || 1) * 86400 * 1000);
            }
            else if (options.freq === 'WEEKLY') {
                current = new Date(current.getTime() + (options.interval || 1) * 7 * 86400 * 1000);
            }
            else if (options.freq === 'MONTHLY') {
                const nextMonth = current.getUTCMonth() + (options.interval || 1);
                current.setUTCMonth(nextMonth);
            }
            else {
                break;
            }
            current.setUTCHours(startHours, startMinutes, 0, 0);
        }
        return instances;
    }
}
exports.RRuleExpander = RRuleExpander;
//# sourceMappingURL=rrule-expander.js.map