import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

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

@Catch()
export class Rfc7807ExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(Rfc7807ExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail = 'An unexpected server error occurred.';
    let code = 'INTERNAL_ERROR';
    let errors: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        detail = res;
        title = exception.name;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        title = body.title || exception.name || title;
        detail = body.detail || body.message || detail;
        code = body.code || this.mapStatusToCode(status);

        if (Array.isArray(body.message)) {
          // Class-validator format
          errors = this.groupValidationErrors(body.message);
          detail = 'One or more request fields failed validation.';
          code = 'VALIDATION_ERROR';
        } else if (body.errors) {
          errors = body.errors;
        }
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    const problem: ProblemDetails = {
      type: `https://api.inboxcompanion.app/errors/${code.toLowerCase().replace(/_/g, '-')}`,
      title,
      status,
      detail: typeof detail === 'string' ? detail : JSON.stringify(detail),
      instance: request.originalUrl || request.url,
      code,
      timestamp: new Date().toISOString(),
    };

    if (errors) {
      problem.errors = errors;
    }

    response.status(status).contentType('application/problem+json').json(problem);
  }

  private mapStatusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }

  private groupValidationErrors(messages: string[]): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};
    for (const msg of messages) {
      const parts = msg.split(' ');
      const field = parts[0] || 'general';
      if (!grouped[field]) {
        grouped[field] = [];
      }
      grouped[field].push(msg);
    }
    return grouped;
  }
}
