import { randomUUID } from 'node:crypto';

import type { DatabaseRow } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import type { McfEventInput } from './mcf-runtime.repository.js';
import {
  type BlockedAlertCandidate,
  MissionObservabilityRepository,
} from './mission-observability.repository.js';

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

function alertCandidate(
  missionId: string,
  id: string,
  expectedMissionVersion: number,
  occurredAt: Date,
): BlockedAlertCandidate {
  const event: McfEventInput = {
    id,
    missionId,
    phaseId: null,
    agentId: 'Renato',
    eventType: 'MISSION_BLOCKED_ALERT_RAISED',
    payload: {
      missionState: 'BLOCKED_RISK',
      missionVersion: expectedMissionVersion,
      reason: 'CI_FAILED',
      externalNotification: false,
      humanActionRequired: false,
    },
    idempotencyKey: `mission:${missionId}:blocked-alert:v${expectedMissionVersion}`,
    occurredAt,
  };

  return { event, expectedMissionVersion };
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
        repository.appendBlockedAlertsAtomically([
          alertCandidate(missionId, randomUUID(), 4, now),
        ]),
      ).resolves.toEqual({ inserted: 1, duplicates: 0, stale: 0 });
      await expect(
        repository.appendBlockedAlertsAtomically([
          alertCandidate(missionId, randomUUID(), 4, now),
        ]),
      ).resolves.toEqual({ inserted: 0, duplicates: 1, stale: 0 });

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

  it('rejects a stale blocked snapshot after mission state and version advance', async () => {
    const missionId = randomUUID();
    const now = new Date();
    const staleKey = `mission:${missionId}:blocked-alert:v4`;

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "created_at", "updated_at"
        ) values ($1, $2::jsonb, 'BLOCKED_RISK', null, 'Renato', 4, $3, $3)`,
        [missionId, contract('stale blocked snapshot'), now],
      );

      const snapshot = await repository.listMissionsByStates(['BLOCKED_RISK']);
      expect(snapshot.some((mission) => mission.id === missionId && mission.version === 4)).toBe(
        true,
      );

      await database.query(
        `update "mcf_missions"
         set "state" = 'EXECUTING', "version" = 5, "updated_at" = $2
         where "id" = $1`,
        [missionId, new Date(now.getTime() + 1000)],
      );

      await expect(
        repository.appendBlockedAlertsAtomically([
          alertCandidate(missionId, randomUUID(), 4, new Date(now.getTime() + 2000)),
        ]),
      ).resolves.toEqual({ inserted: 0, duplicates: 0, stale: 1 });

      const persisted = await database.query<CountRow>(
        `select count(*)::text as "count"
         from "mcf_events"
         where "mission_id" = $1 and "idempotency_key" = $2`,
        [missionId, staleKey],
      );
      expect(persisted.rows[0]?.count).toBe('0');
    } finally {
      await cleanup(database, missionId);
    }
  });
});
