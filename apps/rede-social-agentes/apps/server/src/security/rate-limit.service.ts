import { createHmac } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type { DatabaseRow } from '@rsa/database';

import { loadRuntimeConfig } from '../config.js';
import { DatabaseService } from '../database.service.js';
import type { AbusePolicy } from './abuse-policy.js';

interface CounterRow extends DatabaseRow {
  request_count: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

@Injectable()
export class RateLimitService {
  private readonly secret = loadRuntimeConfig().RATE_LIMIT_KEY_SECRET;

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  hashSubject(subject: string): string {
    return createHmac('sha256', this.secret).update(subject).digest('hex');
  }

  async consume(
    subject: string,
    policy: AbusePolicy,
    now = new Date(),
  ): Promise<RateLimitDecision> {
    const windowMilliseconds = policy.windowSeconds * 1000;
    const windowStartMilliseconds =
      Math.floor(now.getTime() / windowMilliseconds) * windowMilliseconds;
    const windowStartedAt = new Date(windowStartMilliseconds);
    const result = await this.database.query<CounterRow>(
      `
        insert into "abuse_rate_limits" (
          "key_hash", "policy", "window_started_at", "request_count"
        ) values ($1, $2, $3, 1)
        on conflict ("key_hash", "policy", "window_started_at")
        do update set
          "request_count" = "abuse_rate_limits"."request_count" + 1,
          "updated_at" = now()
        returning "request_count"
      `,
      [this.hashSubject(subject), policy.name, windowStartedAt],
    );

    const requestCount = result.rows[0]?.request_count;
    if (requestCount === undefined) {
      throw new Error('Rate limit counter did not return a value.');
    }

    const windowEndsAt = windowStartMilliseconds + windowMilliseconds;
    const retryAfterSeconds = Math.max(1, Math.ceil((windowEndsAt - now.getTime()) / 1000));
    return {
      allowed: requestCount <= policy.limit,
      limit: policy.limit,
      remaining: Math.max(0, policy.limit - requestCount),
      retryAfterSeconds,
    };
  }
}
