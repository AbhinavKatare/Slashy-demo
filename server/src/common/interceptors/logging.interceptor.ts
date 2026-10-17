import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { redactPII } from '../logger/json-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode;
          this.logger.log(
            JSON.stringify({
              type: 'HTTP_ACCESS',
              method,
              url: originalUrl,
              statusCode,
              durationMs: duration,
              ip,
              userAgent,
              query: redactPII(req.query),
            }),
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error?.status || 500;
          this.logger.warn(
            JSON.stringify({
              type: 'HTTP_ACCESS_ERROR',
              method,
              url: originalUrl,
              statusCode,
              durationMs: duration,
              ip,
              errorMessage: error?.message,
            }),
          );
        },
      }),
    );
  }
}
