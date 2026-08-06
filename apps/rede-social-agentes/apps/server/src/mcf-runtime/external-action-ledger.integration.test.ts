import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';

interface EventTypeRow {
  eventType: string;
}

describe('MCF external action ledger integration', () => {
  let database: DatabaseService;

  beforeAll(() => {
    database = new DatabaseService();
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('mirrors the complete external action lifecycle in causal order', async () => {
    const missionId = randomUUID();
    const phaseId = randomUUID();
    const now = new Date();

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "created_at", "updated_at"
        ) values ($1, $2::jsonb, 'EXECUTING', $3, 'Vinicius', 1, $4, $4)`,
        [
          missionId,
          JSON.stringify({
            title: 'External action ledger test',
            objective: 'Validate the external action event lifecycle.',
            expectedOutcome: 'Every external action event is persisted in order.',
            scope: ['ledger'],
            outOfScope: ['external write'],
            acceptanceCriteria: ['timeline complete'],
            riskClass: 'A',
            selectedAgents: ['Vinicius', 'Rafael'],
            selectedSkills: ['MCF-REVIEW-CODE'],
            sourceOfTruth: ['MCF-RUNTIME-006-A1'],
          }),
          phaseId,
          now,
        ],
      );
      await database.query(
        `insert into "mcf_phases" (
          "id", "mission_id", "skill_id", "agent_id", "state", "cycle",
          "inputs", "expected_evidence", "started_at", "completed_at",
          "created_at", "updated_at"
        ) values ($1, $2, 'MCF-REVIEW-CODE', 'Vinicius', 'COMPLETED', 1,
          '{}'::jsonb, '[]'::jsonb, $3, $3, $3, $3)`,
        [phaseId, missionId, now],
      );

      const events = [
        {
          type: 'TOOL_REQUESTED',
          payload: {
            provider: 'github',
            operation: 'inspect-code',
            resource: 'leon337/multiagent-collaboration-framework',
          },
          key: 'tool-requested',
        },
        {
          type: 'TOOL_RECEIPT_RECORDED',
          payload: { provider: 'github', receiptId: randomUUID(), status: 'SUCCEEDED' },
          key: 'receipt-recorded',
        },
        {
          type: 'EVIDENCE_VALIDATED',
          payload: { receiptId: randomUUID() },
          key: 'evidence-valid',
        },
      ];

      for (const item of events) {
        await database.query(
          `insert into "mcf_events" (
            "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
            "idempotency_key", "occurred_at"
          ) values ($1, $2, $3, 'Vinicius', $4, $5::jsonb, $6, $7)`,
          [
            randomUUID(),
            missionId,
            phaseId,
            item.type,
            JSON.stringify(item.payload),
            `${missionId}:${item.key}`,
            now,
          ],
        );
      }

      const result = await database.query<EventTypeRow>(
        `select "event_type" as "eventType"
         from "mcf_events"
         where "mission_id" = $1
           and "phase_id" = $2
           and "event_type" like 'EXTERNAL_ACTION_%'
         order by "occurred_at", "id"`,
        [missionId, phaseId],
      );

      expect(result.rows.map((row) => row.eventType)).toEqual([
        'EXTERNAL_ACTION_REQUESTED',
        'EXTERNAL_ACTION_ALLOWED',
        'EXTERNAL_ACTION_EXECUTED',
        'EXTERNAL_ACTION_EVIDENCE_VALIDATED',
      ]);
    } finally {
      await database.query('delete from "mcf_events" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_phases" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_missions" where "id" = $1', [missionId]);
    }
  });
});
