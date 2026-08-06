import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ExternalActionLedger } from './external-action-ledger.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';

interface ReservationRow {
  activeExternalAttemptId: string | null;
  version: number;
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

describe('MCF external action mission reservation', () => {
  let database: DatabaseService;
  let ledger: ExternalActionLedger;
  let repository: PostgresMcfRuntimeRepository;

  beforeAll(() => {
    database = new DatabaseService();
    ledger = new ExternalActionLedger(database);
    repository = new PostgresMcfRuntimeRepository(database);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('blocks concurrent mission persistence and releases only for the terminal owning attempt', async () => {
    const missionId = randomUUID();
    const externalPhaseId = randomUUID();
    const concurrentPhaseId = randomUUID();
    const createdAt = new Date();

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "created_at", "updated_at"
        ) values ($1, $2::jsonb, 'EXECUTING', null, 'Vinicius', 1, $3, $3)`,
        [
          missionId,
          JSON.stringify({
            title: 'External reservation ownership',
            objective: 'Prevent concurrent mission advancement during provider execution.',
            expectedOutcome: 'Only the terminal owning attempt may persist and release.',
            scope: ['runtime reservation'],
            outOfScope: ['external write'],
            acceptanceCriteria: ['concurrent persistence blocked'],
            riskClass: 'A',
            selectedAgents: ['Vinicius', 'Rafael'],
            selectedSkills: ['MCF-REVIEW-CODE'],
            sourceOfTruth: ['MCF-RUNTIME-006-A1'],
          }),
          createdAt,
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
          context: {
            missionId,
            phaseId: externalPhaseId,
            expectedMissionVersion: 1,
          },
        },
        'github-code-review-read-only-v1',
      );

      const phase = (id: string, state: 'COMPLETED' | 'RECOVERING') => ({
        id,
        missionId,
        skillId: skill.skillId,
        agentId: 'Vinicius',
        state,
        cycle: 1,
        inputs: { diff_or_commit: 'PR #71' },
        expectedEvidence: skill.requiredEvidence,
        startedAt: createdAt,
        completedAt: state === 'COMPLETED' ? createdAt : null,
        createdAt,
        updatedAt: createdAt,
      });

      await expect(
        repository.persistExecution({
          missionId,
          expectedMissionVersion: 1,
          externalAttemptId: null,
          phase: phase(concurrentPhaseId, 'COMPLETED'),
          permissionProfile: 'READ_AND_PROPOSE',
          missionState: 'EXECUTING',
          nextAgentId: null,
          receipt: null,
          evidenceStatus: 'PENDING',
          handoff: null,
          events: [],
        }),
      ).rejects.toMatchObject({ name: 'McfMissionVersionConflictError' });

      const active = await database.query<ReservationRow>(
        `select
           "active_external_attempt_id" as "activeExternalAttemptId",
           "version"
         from "mcf_missions"
         where "id" = $1`,
        [missionId],
      );
      expect(active.rows[0]).toEqual({
        activeExternalAttemptId: attemptId,
        version: 1,
      });

      await ledger.recordFailed(attemptId, {
        code: 'ADAPTER_FAILURE',
        message: 'controlled terminal failure',
        retryable: false,
        statusCode: null,
      });

      const persisted = await repository.persistExecution({
        missionId,
        expectedMissionVersion: 1,
        externalAttemptId: attemptId,
        phase: phase(externalPhaseId, 'RECOVERING'),
        permissionProfile: 'READ_AND_PROPOSE',
        missionState: 'RECOVERING',
        nextAgentId: null,
        receipt: null,
        evidenceStatus: 'INVALID',
        handoff: null,
        events: [],
      });
      expect(persisted.mission.version).toBe(2);

      const released = await database.query<ReservationRow>(
        `select
           "active_external_attempt_id" as "activeExternalAttemptId",
           "version"
         from "mcf_missions"
         where "id" = $1`,
        [missionId],
      );
      expect(released.rows[0]).toEqual({
        activeExternalAttemptId: null,
        version: 2,
      });
    } finally {
      await database.query('delete from "mcf_tool_receipts" where "mission_id" = $1', [
        missionId,
      ]);
      await database.query('delete from "mcf_handoffs" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_phases" where "mission_id" = $1', [missionId]);
      await database.query(
        'delete from "mcf_external_action_attempts" where "mission_id" = $1',
        [missionId],
      );
      await database.query('delete from "mcf_events" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_missions" where "id" = $1', [missionId]);
    }
  });
});
