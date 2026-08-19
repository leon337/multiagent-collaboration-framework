import { describe, expect, it, vi } from 'vitest';

import type { DatabaseService } from '../database.service.js';
import type { McfEventInput } from './mcf-runtime.repository.js';
import { ProductionAuthorizationRepository } from './production-authorization.repository.js';

const event: McfEventInput = {
  id: '33333333-3333-4333-8333-333333333333',
  missionId: '11111111-1111-4111-8111-111111111111',
  phaseId: '22222222-2222-4222-8222-222222222222',
  agentId: 'Leo',
  eventType: 'GATE_APPROVED',
  payload: {
    gate: 'PRODUCTION_PROMOTION',
    operationalAuthority: 'LEO',
    decision: 'APPROVE',
    targetSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  },
  idempotencyKey: 'production-gate:test',
  occurredAt: new Date('2026-08-19T17:03:00.000Z'),
};

function harness(rows: Array<{ id: string }>) {
  const query = vi.fn(async () => ({ rows }));
  const database = { query } as unknown as DatabaseService;
  return {
    repository: new ProductionAuthorizationRepository(database),
    query,
  };
}

describe('ProductionAuthorizationRepository', () => {
  it('appends a gate to mcf_events with idempotency conflict protection', async () => {
    const { repository, query } = harness([{ id: event.id }]);

    await expect(repository.appendGateEvent(event)).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('on conflict (idempotency_key) do nothing'),
      [
        event.id,
        event.missionId,
        event.phaseId,
        event.agentId,
        event.eventType,
        JSON.stringify(event.payload),
        event.idempotencyKey,
        event.occurredAt,
      ],
    );
  });

  it('returns duplicate when the canonical idempotency key already exists', async () => {
    const { repository, query } = harness([]);

    await expect(repository.appendGateEvent(event)).resolves.toBe(false);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
