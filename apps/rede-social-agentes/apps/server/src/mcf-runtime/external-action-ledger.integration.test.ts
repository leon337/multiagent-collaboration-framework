import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { EvidenceValidator } from './evidence-validator.js';
import { ExternalActionLedger } from './external-action-ledger.js';

interface EventTypeRow {
  eventType: string;
}

interface CountRow {
  count: string;
}

const skill: McfSkillDefinition = {
  skillId: 'MCF-REVIEW-CODE',
  name: 'Revisar código',
  version: '1.0.0',
  purpose: 'Revisar código sem alteração persistente.',
  ownerAgents: ['Vinicius'],
  requiredInputs: ['diff_or_commit'],
  allowedTools: ['GitHub'],
  forbiddenTools: ['merge_without_gate'],
  permissionProfile: 'READ_AND_PROPOSE',
  executionSteps: ['inspecionar_diff', 'classificar_achados'],
  requiredEvidence: ['file_and_line_references', 'severity', 'recommendation'],
  acceptanceCriteria: ['findings_actionable'],
  failureModes: ['missing_context'],
  fallback: 'Limitar o veredito.',
  handoffTo: 'Rafael',
};

describe('MCF external action durable ledger integration', () => {
  let database: DatabaseService;
  let ledger: ExternalActionLedger;

  beforeAll(() => {
    database = new DatabaseService();
    ledger = new ExternalActionLedger(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('persists requested and allowed before execution, then completes the evidence lifecycle', async () => {
    const missionId = randomUUID();
    const phaseId = randomUUID();
    const now = new Date();

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "created_at", "updated_at"
        ) values ($1, $2::jsonb, 'EXECUTING', null, 'Vinicius', 1, $3, $3)`,
        [
          missionId,
          JSON.stringify({
            title: 'External action ledger test',
            objective: 'Reserve the attempt before calling the provider.',
            expectedOutcome: 'The complete external lifecycle is durable.',
            scope: ['ledger'],
            outOfScope: ['external write'],
            acceptanceCriteria: ['timeline complete'],
            riskClass: 'A',
            selectedAgents: ['Vinicius', 'Rafael'],
            selectedSkills: ['MCF-REVIEW-CODE'],
            sourceOfTruth: ['MCF-RUNTIME-006-A1'],
          }),
          now,
        ],
      );

      const attemptId = await ledger.reserve(
        {
          skill,
          agentId: 'Vinicius',
          inputs: { diff_or_commit: 'PR #71' },
          tool: {
            provider: 'github',
            operation: 'inspect-code',
            resource: 'leon337/multiagent-collaboration-framework',
          },
          context: { missionId, phaseId, expectedMissionVersion: 1 },
        },
        'github-code-review-read-only-v1',
      );

      const reserved = await database.query<EventTypeRow>(
        `select "event_type" as "eventType"
         from "mcf_events"
         where "mission_id" = $1 and "phase_id" = $2
         order by "sequence"`,
        [missionId, phaseId],
      );
      expect(reserved.rows.map((row) => row.eventType)).toEqual([
        'EXTERNAL_ACTION_REQUESTED',
        'EXTERNAL_ACTION_ALLOWED',
      ]);

      const evidence = new EvidenceValidator();
      const receipt = evidence.createTrustedReceipt({
        provider: 'github',
        operation: 'inspect-code',
        resource: 'leon337/multiagent-collaboration-framework',
        externalId: '71',
        commitSha: 'f'.repeat(40),
        status: 'SUCCEEDED',
        observedAt: new Date().toISOString(),
        metadata: {
          reviewedFiles: ['src/runtime.ts'],
          findingsCount: 0,
          findings: [],
          verdict: 'PASS',
          readOnly: true,
        },
      });
      await ledger.recordExecuted(attemptId, receipt);
      await ledger.recordEvidenceValidated(attemptId, receipt.receiptId);

      const completed = await database.query<EventTypeRow>(
        `select "event_type" as "eventType"
         from "mcf_events"
         where "mission_id" = $1 and "phase_id" = $2
         order by "sequence"`,
        [missionId, phaseId],
      );
      expect(completed.rows.map((row) => row.eventType)).toEqual([
        'EXTERNAL_ACTION_REQUESTED',
        'EXTERNAL_ACTION_ALLOWED',
        'EXTERNAL_ACTION_EXECUTED',
        'EXTERNAL_ACTION_EVIDENCE_VALIDATED',
      ]);
    } finally {
      await database.query('delete from "mcf_external_action_attempts" where "mission_id" = $1', [
        missionId,
      ]);
      await database.query('delete from "mcf_events" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_missions" where "id" = $1', [missionId]);
    }
  });

  it('rejects a stale mission version without reserving an attempt', async () => {
    const missionId = randomUUID();
    const phaseId = randomUUID();
    const now = new Date();

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "created_at", "updated_at"
        ) values ($1, $2::jsonb, 'EXECUTING', null, 'Vinicius', 2, $3, $3)`,
        [
          missionId,
          JSON.stringify({
            title: 'External reservation conflict',
            objective: 'Reject stale mission state.',
            expectedOutcome: 'No external attempt is reserved.',
            scope: ['ledger'],
            outOfScope: ['external write'],
            acceptanceCriteria: ['stale version blocked'],
            riskClass: 'A',
            selectedAgents: ['Vinicius', 'Rafael'],
            selectedSkills: ['MCF-REVIEW-CODE'],
            sourceOfTruth: ['MCF-RUNTIME-006-A1'],
          }),
          now,
        ],
      );

      await expect(
        ledger.reserve(
          {
            skill,
            agentId: 'Vinicius',
            inputs: { diff_or_commit: 'PR #71' },
            tool: {
              provider: 'github',
              operation: 'inspect-code',
              resource: 'leon337/multiagent-collaboration-framework',
            },
            context: { missionId, phaseId, expectedMissionVersion: 1 },
          },
          'github-code-review-read-only-v1',
        ),
      ).rejects.toMatchObject({ code: 'RESERVATION_CONFLICT', retryable: true });

      const attempts = await database.query<CountRow>(
        `select count(*)::text as "count"
         from "mcf_external_action_attempts"
         where "mission_id" = $1`,
        [missionId],
      );
      expect(attempts.rows[0]?.count).toBe('0');
    } finally {
      await database.query('delete from "mcf_external_action_attempts" where "mission_id" = $1', [
        missionId,
      ]);
      await database.query('delete from "mcf_events" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_missions" where "id" = $1', [missionId]);
    }
  });
});
