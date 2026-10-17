"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = sleep;
exports.parseRetryAfterHeader = parseRetryAfterHeader;
exports.calculateBackoff = calculateBackoff;
exports.executeWithRetry = executeWithRetry;
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function parseRetryAfterHeader(headerVal) {
    if (!headerVal)
        return null;
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
function calculateBackoff(attempt, baseMs = 500, maxMs = 30000) {
    const exp = Math.min(maxMs, baseMs * Math.pow(2, attempt));
    const jitter = Math.random() * 0.25 * exp;
    return Math.min(maxMs, exp + jitter);
}
async function executeWithRetry(operation, options = {}) {
    const maxAttempts = options.maxAttempts ?? 3;
    const baseDelayMs = options.baseDelayMs ?? 1000;
    const maxDelayMs = options.maxDelayMs ?? 15000;
    let lastError;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (err) {
            lastError = err;
            const status = err.status || err.statusCode;
            if (status === 429 || status === 503) {
                const retryAfterMs = parseRetryAfterHeader(err.retryAfter || err.headers?.['retry-after']);
                const delay = retryAfterMs !== null ? retryAfterMs : calculateBackoff(attempt, baseDelayMs, maxDelayMs);
                if (attempt < maxAttempts - 1) {
                    await sleep(delay);
                    continue;
                }
            }
            throw err;
        }
    }
    throw lastError;
}
//# sourceMappingURL=resilience.js.map