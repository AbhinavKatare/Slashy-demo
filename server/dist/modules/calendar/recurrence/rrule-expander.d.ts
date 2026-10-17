export interface RRuleOptions {
    freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    interval?: number;
    count?: number;
    until?: Date;
    byDay?: string[];
}
export declare class RRuleExpander {
    static parse(rruleStr: string): RRuleOptions;
    static expand(start: Date, durationMs: number, rruleStr: string, windowStart: Date, windowEnd: Date): Array<{
        start: Date;
        end: Date;
    }>;
}
