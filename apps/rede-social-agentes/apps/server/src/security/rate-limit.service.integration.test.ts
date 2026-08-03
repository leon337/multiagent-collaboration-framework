import { randomUUID } from 'node:crypto';

import type { DatabaseRow } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { RateLimitService } from './rate-limit.service.js';

interface CounterRow extends DatabaseRow {
  key_hash: string;
  request_count: number;
}

describe('RateLimitService integration', () => {
  let database: DatabaseService;

  beforeAll(() => {
    database = new DatabaseService();
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('counts atomically and stores only a pseudonymized subject', async () => {
    const service = new RateLimitService(database);
    const subject = `ip:198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    const policy = {
      name: `integration-${randomUUID()}`,
      limit: 2,
      windowSeconds: 60,
    };
    const now = new Date('2026-08-03T06:30:15.000Z');

    try {
      const first = await service.consume(subject, policy, now);
      const second = await service.consume(subject, policy, now);
      const third = await service.consume(subject, policy, now);

      expect(first).toMatchObject({ allowed: true, remaining: 1 });
      expect(second).toMatchObject({ allowed: true, remaining: 0 });
      expect(third).toMatchObject({ allowed: false, remaining: 0, retryAfterSeconds: 45 });

      const stored = await database.query<CounterRow>(
        `
          select "key_hash", "request_count"
          from "abuse_rate_limits"
          where "policy" = $1
        `,
        [policy.name],
      );
      expect(stored.rows).toHaveLength(1);
      expect(stored.rows[0]?.request_count).toBe(3);
      expect(stored.rows[0]?.key_hash).toMatch(/^[a-f0-9]{64}$/u);
      expect(stored.rows[0]?.key_hash).not.toContain(subject);
    } finally {
      await database.query('delete from "abuse_rate_limits" where "policy" = $1', [policy.name]);
    }
  });
});
