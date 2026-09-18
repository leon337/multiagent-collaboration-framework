import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { DatabaseRow } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import { AdapterRegistry } from './adapter-registry.js';
import { CanonicalExternalActionLedger } from './canonical-external-action-ledger.js';
import { EvidenceValidator } from './evidence-validator.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import { LocalAgentTeamAdapter } from './local-agent-team.adapter.js';
import {
  LOCAL_AGENT_TEAM_AGENTS,
  LOCAL_AGENT_TEAM_OPERATION,
  LOCAL_AGENT_TEAM_PROVIDER,
  LOCAL_AGENT_TEAM_RESOURCE,
} from './local-agent-team.router.js';
import { MissionRuntimeService } from './mission-runtime.service.js';
import { OrderedMcfRuntimeRepository } from './ordered-mcf-runtime.repository.js';
import { PermissionEngine } from './permission-engine.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';
import { SkillExecutor } from './skill-executor.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';

interface ReceiptRow extends DatabaseRow {
  receiptId: string;
  validationStatus: string;
  metadata: Record<string, unknown>;
}

interface AttemptRow extends DatabaseRow {
  attemptId: string;
  status: string;
  receiptId: string | null;
}
describe('MCF local agent team durable runtime E2E', () => {
  let database: DatabaseService;
  let service: MissionRuntimeService;

  beforeAll(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-only-local-agent-team-postgres-e2e-receipt-secret-0001';

    database = new DatabaseService();
    const postgres = new PostgresMcfRuntimeRepository(database);
    const repository = new OrderedMcfRuntimeRepository(database, postgres);
    const registry = new SkillRegistryLoader();
    const evidence = new EvidenceValidator();
    const localTeam = new LocalAgentTeamAdapter(evidence, {
      enabled: true,
      timeoutMs: 5000,
      maxParallelism: 8,
    });
    const dispatcher = new ExternalActionDispatcher(
      new AdapterRegistry([localTeam]),
      new CanonicalExternalActionLedger(database),
    );
    const executor = new SkillExecutor(registry, new PermissionEngine(), evidence, dispatcher);
    service = new MissionRuntimeService(repository, executor, registry, evidence);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });
  it('persists mission, external attempt, consolidated receipt and events in PostgreSQL', async () => {
    const mission = await service.createMission({
      contract: {
        title: 'MCF local agent team durable E2E',
        objective: 'Executar capacidade total com oito agentes em paralelo.',
        expectedOutcome: 'PostgreSQL preserva evidência governada do runtime local.',
        scope: ['MCF-EXECUTE-LOCAL-TEAM'],
        outOfScope: ['production', 'release', 'LLM cognition'],
        acceptanceCriteria: ['unique processes', 'valid consolidated receipt', 'durable evidence'],
        riskClass: 'B',
        selectedAgents: ['Mestre', ...LOCAL_AGENT_TEAM_AGENTS],
        selectedSkills: ['MCF-EXECUTE-LOCAL-TEAM'],
        sourceOfTruth: ['skills/registry.yaml', 'docs/MCF-CURRENT-STATE.md'],
      },
    });
    const phaseId = randomUUID();

    try {
      const result = await service.executePhase(mission.id, {
        phaseId,
        skillId: 'MCF-EXECUTE-LOCAL-TEAM',
        agentId: 'Mestre',
        expectedMissionVersion: 1,
        inputs: {
          objective: 'Executar capacidade total com oito agentes em paralelo.',
        },
        tool: {
          provider: LOCAL_AGENT_TEAM_PROVIDER,
          operation: LOCAL_AGENT_TEAM_OPERATION,
          resource: LOCAL_AGENT_TEAM_RESOURCE,
        },
      });

      expect(result).toMatchObject({
        phaseState: 'COMPLETED',
        evidenceStatus: 'VALID',
        handoffTo: null,
      });
      const receiptId = result.receipt?.receiptId;
      expect(receiptId).toBeTruthy();

      const receipts = await database.query<ReceiptRow>(
        `select
          "receipt_id" as "receiptId",
          "validation_status" as "validationStatus",
          "metadata"
         from "mcf_tool_receipts"
         where "mission_id" = $1 and "receipt_id" = $2`,
        [mission.id, receiptId],
      );
      expect(receipts.rows).toHaveLength(1);
      expect(receipts.rows[0]?.validationStatus).toBe('VALID');
      expect(receipts.rows[0]?.metadata.selectedAgents).toEqual([...LOCAL_AGENT_TEAM_AGENTS]);

      const processIds = receipts.rows[0]?.metadata.processIds as number[];
      expect(processIds).toHaveLength(8);
      expect(new Set(processIds).size).toBe(8);

      const attempts = await database.query<AttemptRow>(
        `select
          "attempt_id" as "attemptId",
          "status",
          "receipt_id" as "receiptId"
         from "mcf_external_action_attempts"
         where "mission_id" = $1`,
        [mission.id],
      );
      expect(attempts.rows).toHaveLength(1);
      expect(attempts.rows[0]).toMatchObject({
        status: 'EVIDENCE_VALIDATED',
        receiptId,
      });
      const timeline = await service.timeline(mission.id);
      expect(timeline.events.map((event) => event.eventType)).toEqual(
        expect.arrayContaining([
          'MISSION_CREATED',
          'TOOL_RECEIPT_RECORDED',
          'EVIDENCE_VALIDATED',
          'PHASE_COMPLETED',
        ]),
      );
    } finally {
      await database.query('delete from "mcf_tool_receipts" where "mission_id" = $1', [mission.id]);
      await database.query('delete from "mcf_handoffs" where "mission_id" = $1', [mission.id]);
      await database.query('delete from "mcf_phases" where "mission_id" = $1', [mission.id]);
      await database.query('delete from "mcf_external_action_attempts" where "mission_id" = $1', [
        mission.id,
      ]);
      await database.query('delete from "mcf_events" where "mission_id" = $1', [mission.id]);
      await database.query('delete from "mcf_missions" where "id" = $1', [mission.id]);
    }
  });
});
