export interface RetryOptions {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
}
export declare function sleep(ms: number): Promise<void>;
export declare function parseRetryAfterHeader(headerVal: string | null): number | null;
export declare function calculateBackoff(attempt: number, baseMs?: number, maxMs?: number): number;
export declare function executeWithRetry<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T>;
