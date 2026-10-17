"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonLoggerService = void 0;
exports.redactPII = redactPII;
const common_1 = require("@nestjs/common");
const SENSITIVE_KEYS = new Set([
    'authorization',
    'cookie',
    'set-cookie',
    'password',
    'token',
    'accesstoken',
    'refreshtoken',
    'access_token',
    'refresh_token',
    'secret',
    'clientsecret',
    'client_secret',
    'bodyhtml',
    'bodyplain',
    'body_html',
    'body_plain',
    'encrypted_access_token',
    'encrypted_refresh_token',
    'encryption_key',
]);
function redactPII(data) {
    if (data === null || data === undefined)
        return data;
    if (typeof data === 'string') {
        if (data.startsWith('Bearer ') || data.split('.').length === 3) {
            return '[REDACTED_JWT]';
        }
        if (data.includes('@') && data.includes('.')) {
            const parts = data.split('@');
            if (parts.length === 2 && parts[0].length > 1) {
                return `${parts[0][0]}***@${parts[1]}`;
            }
        }
        return data;
    }
    if (Array.isArray(data)) {
        return data.map((item) => redactPII(item));
    }
    if (typeof data === 'object') {
        const sanitized = {};
        for (const [key, val] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            if (SENSITIVE_KEYS.has(lowerKey)) {
                sanitized[key] = '[REDACTED]';
            }
            else {
                sanitized[key] = redactPII(val);
            }
        }
        return sanitized;
    }
    return data;
}
let JsonLoggerService = class JsonLoggerService {
    formatLog(level, message, context, extra) {
        const logObject = {
            timestamp: new Date().toISOString(),
            level,
            context: context || 'Application',
            message: typeof message === 'string' ? redactPII(message) : redactPII(message),
            ...redactPII(extra || {}),
        };
        return JSON.stringify(logObject);
    }
    log(message, context) {
        process.stdout.write(this.formatLog('INFO', message, context) + '\n');
    }
    error(message, trace, context) {
        process.stderr.write(this.formatLog('ERROR', message, context, { stack: trace }) + '\n');
    }
    warn(message, context) {
        process.stdout.write(this.formatLog('WARN', message, context) + '\n');
    }
    debug(message, context) {
        if (process.env.NODE_ENV !== 'production') {
            process.stdout.write(this.formatLog('DEBUG', message, context) + '\n');
        }
    }
    verbose(message, context) {
        if (process.env.NODE_ENV !== 'production') {
            process.stdout.write(this.formatLog('VERBOSE', message, context) + '\n');
        }
    }
};
exports.JsonLoggerService = JsonLoggerService;
exports.JsonLoggerService = JsonLoggerService = __decorate([
    (0, common_1.Injectable)()
], JsonLoggerService);
//# sourceMappingURL=json-logger.service.js.map