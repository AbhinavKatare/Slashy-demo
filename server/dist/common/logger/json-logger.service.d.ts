import { LoggerService } from '@nestjs/common';
export declare function redactPII(data: any): any;
export declare class JsonLoggerService implements LoggerService {
    private formatLog;
    log(message: any, context?: string): void;
    error(message: any, trace?: string, context?: string): void;
    warn(message: any, context?: string): void;
    debug(message: any, context?: string): void;
    verbose(message: any, context?: string): void;
}
