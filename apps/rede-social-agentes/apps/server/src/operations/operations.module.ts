import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { OperationalLogService } from './operational-log.service.js';
import { RequestTelemetryInterceptor } from './request-telemetry.interceptor.js';

@Module({
  providers: [
    OperationalLogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestTelemetryInterceptor,
    },
  ],
})
export class OperationsModule {}
