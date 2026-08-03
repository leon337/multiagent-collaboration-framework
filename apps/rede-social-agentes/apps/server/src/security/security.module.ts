import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { DatabaseModule } from '../database.module.js';
import { AbuseProtectionGuard } from './abuse-protection.guard.js';
import { RateLimitService } from './rate-limit.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [
    RateLimitService,
    AbuseProtectionGuard,
    {
      provide: APP_GUARD,
      useExisting: AbuseProtectionGuard,
    },
  ],
})
export class SecurityModule {}
