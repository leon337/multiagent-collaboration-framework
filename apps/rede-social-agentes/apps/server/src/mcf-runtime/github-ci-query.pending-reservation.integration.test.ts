import { randomUUID } from 'node:crypto';

import type { McfSkillDefinition, McfToolReceipt } from '@rsa/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { ExternalActionLedger } from './external-action-ledger.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';

interface MissionReservationRow {
  activeExternalAttemptId: string | null;
  state: string;
  version: number;
}

interface AttemptRow {
  status: string;
}

const repositoryName = 'leon337/multiagent-collaboration-framework';
const commitSha = 'a'.repeat(40);

const skill: McfSkillDefinition = {
  skillId: 'MCF-RUN-TESTS',
  name: 'Executar validação e testes',
  version: '1.0.0',
  purpose: 'Consultar CI por SHA exato sem fabricar sucesso.',
  ownerAgents: ['Renato'],
  requiredInputs: ['acceptance_criteria', 'test_target'],
  allowedTools: ['GitHub'],
  forbiddenTools: ['fabricated_pass'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: ['consultar_ci', 'coletar_evidencia'],
  requiredEvidence: ['commands_or_workflows', 'passed', 'failed', 'logs'],
  acceptanceCriteria: ['all_critical_tests_pass'],
  failureModes: ['environment_unavailable'],
  fallback: 'Registrar bloqueio verificável.',
  handoffTo: 'Emily',
};

function pendingReceipt(): McfToolReceipt {
  return {
    receiptId: randomUUID(),
    provider: 'github-actions',
    operation: 'query-ci',
    resource: repositoryName,
    externalId: 'workflow-run-pending',
    commitSha,
    status: 'SUCCEEDED',
    observedAt: new Date().toISOString(),
    payloadDigest: 'b'.repeat(64),
    signature: 'c'.repeat(64),
    metadata: { conclusion: 'IN_PROGRESS' },
  };
}

describe('MCF query-ci pending external reservation', () => {
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

  it('persists IN_PROGRESS as pending and releases the owning reservation without false evidence events', async () => {
    const missionId = randomUUID();
    const phaseId = randomUUID();
    const createdAt = new Date();
    const receipt = pendingReceipt();

    try {
      await database.query(
        `insert into "mcf_missions" (
          "id", "contract", "state", "current_phase_id", "current_agent_id",
          "version", "created_at", "updated_at"
        ) values ($1, $2::jsonb, 'EXECUTING', null, 'Renato', 1, $3, $3)`,
        [
          missionId,
          JSON.stringify({
            title: 'Pending CI reservation release',
            objective: 'Persist a truthful in-progress CI observation without completing tests.',
            expectedOutcome: 'Mission waits for later evidence with no reservation deadlock.',
            scope: ['runtime', 'ci-query'],
            outOfScope: ['external writes'],
            acceptanceCriteria: ['only SUCCESS completes MCF-RUN-TESTS'],
            riskClass: 'B',
            selectedAgents: ['Renato', 'Emily'],
            selectedSkills: [skill.skillId],
            sourceOfTruth: ['MCF-RUNTIME-006-A2'],
          }),
          createdAt,
        ],
      );

      const attemptId = await ledger.reserve(
        {
          skill,
          agentId: 'Renato',
          inputs: {
            acceptance_criteria: ['all_critical_tests_pass'],
            test_target: commitSha,
            repository: repositoryName,
          },
          tool: {
            provider: 'github-actions',
            operation: 'query-ci',
            resource: repositoryName,
          },
          context: {
            missionId,
            phaseId,
            expectedMissionVersion: 1,
          },
        },
        'github-ci-query-read-only-v1',
      );
      await ledger.recordExecuted(attemptId, receipt);

      const persisted = await repository.persistExecution({
        missionId,
        expectedMissionVersion: 1,
        externalAttemptId: attemptId,
        phase: {
          id: phaseId,
          missionId,
          skillId: skill.skillId,
          agentId: 'Renato',
          state: 'WAITING_EVIDENCE',
          cycle: 1,
          inputs: {
            acceptance_criteria: ['all_critical_tests_pass'],
            test_target: commitSha,
            repository: repositoryName,
          },
          expectedEvidence: skill.requiredEvidence,
          startedAt: createdAt,
          completedAt: null,
          createdAt,
          updatedAt: createdAt,
        },
        permissionProfile: skill.permissionProfile,
        missionState: 'WAITING_EXTERNAL',
        nextAgentId: null,
        receipt,
        evidenceStatus: 'PENDING',
        handoff: null,
        events: [],
      });

      expect(persisted.mission).toMatchObject({
        state: 'WAITING_EXTERNAL',
        version: 2,
      });
      expect(persisted.phase.state).toBe('WAITING_EVIDENCE');

      const mission = await database.query<MissionReservationRow>(
        `select
           "active_external_attempt_id" as "activeExternalAttemptId",
           "state",
           "version"
         from "mcf_missions"
         where "id" = $1`,
        [missionId],
      );
      expect(mission.rows[0]).toEqual({
        activeExternalAttemptId: null,
        state: 'WAITING_EXTERNAL',
        version: 2,
      });

      const attempt = await database.query<AttemptRow>(
        `select "status" from "mcf_external_action_attempts" where "attempt_id" = $1`,
        [attemptId],
      );
      expect(attempt.rows[0]?.status).toBe('EXECUTED');

      const storedReceipt = await database.query<{ validationStatus: string }>(
        `select "validation_status" as "validationStatus"
         from "mcf_tool_receipts"
         where "receipt_id" = $1`,
        [receipt.receiptId],
      );
      expect(storedReceipt.rows[0]?.validationStatus).toBe('PENDING');

      const falseEvidenceEvents = await database.query<{ eventType: string }>(
        `select "event_type" as "eventType"
         from "mcf_events"
         where "mission_id" = $1
           and "event_type" in (
             'EVIDENCE_VALIDATED',
             'EVIDENCE_REJECTED',
             'PHASE_COMPLETED',
             'RECOVERY_STARTED',
             'EXTERNAL_ACTION_EVIDENCE_VALIDATED'
           )`,
        [missionId],
      );
      expect(falseEvidenceEvents.rows).toEqual([]);
    } finally {
      await database.query('delete from "mcf_tool_receipts" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_handoffs" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_phases" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_external_action_attempts" where "mission_id" = $1', [
        missionId,
      ]);
      await database.query('delete from "mcf_events" where "mission_id" = $1', [missionId]);
      await database.query('delete from "mcf_missions" where "id" = $1', [missionId]);
    }
  });
});
