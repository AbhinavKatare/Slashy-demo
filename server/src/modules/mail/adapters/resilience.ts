/**
 * Resilience utilities: 429 / 503 Retry-After backoff with exponential jitter
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseRetryAfterHeader(headerVal: string | null): number | null {
  if (!headerVal) return null;
  const seconds = parseInt(headerVal, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }
  const date = Date.parse(headerVal);
  if (!isNaN(date)) {
    return Math.max(0, date - Date.now());
  }
  return null;
}

export function calculateBackoff(attempt: number, baseMs = 500, maxMs = 30000): number {
  const exp = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  // Add 10-25% random jitter to avoid thundering herd
  const jitter = Math.random() * 0.25 * exp;
  return Math.min(maxMs, exp + jitter);
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 15000;

  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const status = err.status || err.statusCode;

      // Handle 429 Too Many Requests or 503 Service Unavailable
      if (status === 429 || status === 503) {
        const retryAfterMs = parseRetryAfterHeader(err.retryAfter || err.headers?.['retry-after']);
        const delay =
          retryAfterMs !== null ? retryAfterMs : calculateBackoff(attempt, baseDelayMs, maxDelayMs);

        if (attempt < maxAttempts - 1) {
          await sleep(delay);
          continue;
        }
      }

      // Non-retryable error
      throw err;
    }
  }

  throw lastError;
}
