import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export interface ProblemDetails {
    type: string;
    title: string;
    status: number;
    detail: string;
    instance: string;
    code?: string;
    errors?: Record<string, string[]>;
    timestamp: string;
}
export declare class Rfc7807ExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
    private mapStatusToCode;
    private groupValidationErrors;
}
