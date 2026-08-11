import { randomUUID } from 'node:crypto';

import type { DatabaseRow } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import type { McfEventInput } from './mcf-runtime.repository.js';
import { MissionObservabilityRepository } from './mission-observability.repository.js';

interface CountRow extends DatabaseRow {
  count: string;
}

function contract(title: string) {
  return JSON.stringify({
    title,
    objective: 'Prove blocked mission observability persistence.',
    expectedOutcome: 'One durable idempotent internal alert.',
    scope: ['observability'],
    outOfScope: ['external notification'],
    acceptanceCriteria: ['blocked mission visible', 'duplicate alert suppressed'],
    riskClass: 'B',
    selectedAgents: ['Mestre', 'Renato'],
    selectedSkills: ['MCF-TRACE-MISSION'],
    sourceOfTruth: ['mcf_missions', 'mcf_events'],
  });
}

async function cleanup(database: DatabaseService, missionId: string) {
  await database.query(`delete from "mcf_events" where "mission_id" = $1`, [missionId]);
  await database.query(`delete from "mcf_missions" where "id" = $1`, [missionId]);
}

describe('Mission observability persistence', () => {
  let database: DatabaseService;
  let repository: MissionObservabilityRepository;

  beforeAll(() => {
    database = new DatabaseService();
    repository = new MissionObservabilityRepository(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('reads canonical BLOCKED_RISK state and suppresses a duplicate internal alert', async () => {
    const missionId = randomUUID();
    const now = new Date();
    const alertKey = `mission:${missionId}:blocked-alert:v4`;

    const alert = (id: string): McfEventInput => ({
      id,
      missionId,
      phaseId: null,
      agentId: 'Renato',
      eventType: 'MISSION_BLOCKED_ALERT_RAISED',
      payload: {
        missionState: 'BLOCKED_RISK',
        missionVersion: 4,
        reason: 'CI_FAILED',
        externalNotification: false,
        humanActionRequired: false,
      },
      idempotencyKey: alertKey,
      occurredAt: now,
    });

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "created_at", "updated_at"
        ) values ($1, $2::jsonb, 'BLOCKED_RISK', null, 'Renato', 4, $3, $3)`,
        [missionId, contract('integration blocked mission'), now],
      );

      const blocked = await repository.listMissionsByStates(['BLOCKED_RISK']);
      expect(blocked.some((mission) => mission.id === missionId)).toBe(true);

      await expect(
        repository.appendEventsIdempotently([alert(randomUUID())]),
      ).resolves.toEqual({ inserted: 1, duplicates: 0 });
      await expect(
        repository.appendEventsIdempotently([alert(randomUUID())]),
      ).resolves.toEqual({ inserted: 0, duplicates: 1 });

      const persisted = await database.query<CountRow>(
        `select count(*)::text as "count"
         from "mcf_events"
         where "mission_id" = $1 and "idempotency_key" = $2`,
        [missionId, alertKey],
      );
      expect(persisted.rows[0]?.count).toBe('1');
    } finally {
      await cleanup(database, missionId);
    }
  });
});
