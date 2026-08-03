import { HttpException, Inject, Injectable } from '@nestjs/common';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Observable } from 'rxjs';
import { catchError, finalize, throwError } from 'rxjs';

import { OperationalLogService } from './operational-log.service.js';

@Injectable()
export class RequestTelemetryInterceptor implements NestInterceptor {
  constructor(
    @Inject(OperationalLogService) private readonly logs: OperationalLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();
    const startedAt = process.hrtime.bigint();
    let errorStatus: number | undefined;

    return next.handle().pipe(
      catchError((error: unknown) => {
        errorStatus = error instanceof HttpException ? error.getStatus() : 500;
        return throwError(() => error);
      }),
      finalize(() => {
        const durationMs = Number((process.hrtime.bigint() - startedAt) / 1_000_000n);
        const statusCode = errorStatus ?? reply.statusCode;
        this.logs.writeHttpCompletion({
          method: request.method,
          route: request.routeOptions?.url ?? 'unmatched',
          statusCode,
          durationMs,
          correlationId: request.id,
          outcome: statusCode >= 400 ? 'ERROR' : 'SUCCESS',
        });
      }),
    );
  }
}
