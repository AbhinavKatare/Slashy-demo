import { Injectable, LoggerService } from '@nestjs/common';

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

export function redactPII(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Redact JWT tokens if present
    if (data.startsWith('Bearer ') || data.split('.').length === 3) {
      return '[REDACTED_JWT]';
    }
    // Partially mask email patterns
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
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = redactPII(val);
      }
    }
    return sanitized;
  }

  return data;
}

@Injectable()
export class JsonLoggerService implements LoggerService {
  private formatLog(
    level: string,
    message: any,
    context?: string,
    extra?: Record<string, any>,
  ): string {
    const logObject = {
      timestamp: new Date().toISOString(),
      level,
      context: context || 'Application',
      message: typeof message === 'string' ? redactPII(message) : redactPII(message),
      ...redactPII(extra || {}),
    };
    return JSON.stringify(logObject);
  }

  log(message: any, context?: string) {
    process.stdout.write(this.formatLog('INFO', message, context) + '\n');
  }

  error(message: any, trace?: string, context?: string) {
    process.stderr.write(this.formatLog('ERROR', message, context, { stack: trace }) + '\n');
  }

  warn(message: any, context?: string) {
    process.stdout.write(this.formatLog('WARN', message, context) + '\n');
  }

  debug(message: any, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      process.stdout.write(this.formatLog('DEBUG', message, context) + '\n');
    }
  }

  verbose(message: any, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      process.stdout.write(this.formatLog('VERBOSE', message, context) + '\n');
    }
  }
}
