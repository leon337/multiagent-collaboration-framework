import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';
import pg from 'pg';

import { MissionContinuationService } from './mission-continuation.service.js';
import { PostgresMissionContinuationRepository } from './mission-continuation.repository.js';
import type { DatabaseService } from '../database.service.js';

const url = process.env.MCF_AUTONOMY_POSTGRES_TEST_URL;
const describeDb = url ? describe : describe.skip;

describeDb('PostgresMissionContinuationRepository isolated transactional integration', () => {
  it('survives new service instances and keeps one notification under concurrent polls', async () => {
    const pool = new pg.Pool({ connectionString: url, max: 8 });
    try {
      const db = {
        query: async <TRow extends Record<string, unknown>>(
          text: string,
          values: readonly unknown[] = [],
        ) => {
          const result = await pool.query(text, [...values]);
          return { rows: result.rows as TRow[], rowCount: result.rowCount };
        },
      } as unknown as DatabaseService;
      const repo = new PostgresMissionContinuationRepository(db);
      const service = new MissionContinuationService(repo);
      const goal = 'Teste de continuidade isolada ' + randomUUID();
      const sha = '0bcea848934ada8593a9ff8be86ea3a41157e546';
      const input = { goal, releaseSha: sha, targetBindingId: 'PRODUCTION_UNBOUND' };
      const [one, same] = await Promise.all([service.register(input), service.register(input)]);
      expect(one.id).toBe(same.id);
      const observations = Array.from({ length: 100 }, () =>
        service.observe({
          continuationId: one.id,
          blockers: ['MISSING_SECRETS'],
          evidenceDigest: 'b'.repeat(64),
        }),
      );
      await Promise.all(observations);
      const after = await new MissionContinuationService(
        new PostgresMissionContinuationRepository(db),
      ).read(one.id);
      expect(after?.notificationCount).toBe(1);
      expect(after?.gateRequestCount).toBe(0);
      expect(after?.state).toBe('BLOCKED_EXTERNAL');
      expect(after?.version).toBe(101);
      await service.observe({
        continuationId: one.id,
        blockers: [],
        evidenceDigest: 'b'.repeat(64),
      });
      const ready = await service.read(one.id);
      expect(ready?.state).toBe('WAITING_CANONICAL_GATE');
      expect(ready?.gateRequestCount).toBe(0);
    } finally {
      await pool.end();
    }
  });
});
