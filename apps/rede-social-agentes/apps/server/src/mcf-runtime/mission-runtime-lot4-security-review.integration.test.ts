import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DatabaseService } from '../database.service.js';
import { EvidenceValidator } from './evidence-validator.js';
import { MissionRuntimeService } from './mission-runtime.service.js';
import { OrderedMcfRuntimeRepository } from './ordered-mcf-runtime.repository.js';
import { PermissionEngine } from './permission-engine.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';
import { SkillExecutor } from './skill-executor.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';

describe('MissionRuntime Lot 4C security review persistence', () => {
  let database: DatabaseService;
  let service: MissionRuntimeService;

  beforeAll(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-lot4c-security-0001';
    database = new DatabaseService();
    const postgres = new PostgresMcfRuntimeRepository(database);
    const repository = new OrderedMcfRuntimeRepository(database, postgres);
    const registry = new SkillRegistryLoader();
    const evidence = new EvidenceValidator();
    const executor = new SkillExecutor(registry, new PermissionEngine(), evidence);
    service = new MissionRuntimeService(repository, executor, registry, evidence);
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('persists authorized security evidence, Emily handoff and version progression', async () => {
    const mission = await service.createMission({
      contract: {
        title: 'Lot 4C security persistence proof',
        objective: 'Review the internal runtime boundary for security risks.',
        expectedOutcome: 'Validated threat/control evidence survives persistence.',
        scope: ['MCF-SECURITY-REVIEW'],
        outOfScope: ['secrets', 'external write', 'production'],
        acceptanceCriteria: ['critical risks are addressed or blocked'],
        riskClass: 'C',
        selectedAgents: ['Ricardo', 'Emily'],
        selectedSkills: ['MCF-SECURITY-REVIEW'],
        sourceOfTruth: ['skills/registry.yaml', 'docs/agentes/RICARDO.md'],
      },
    });

    try {
      const result = await service.executePhase(mission.id, {
        phaseId: randomUUID(),
        skillId: 'MCF-SECURITY-REVIEW',
        agentId: 'Ricardo',
        expectedMissionVersion: 1,
        inputs: {
          system_or_change: 'Internal runtime security boundary.',
          sensitiveAuthorization: true,
          execution_evidence: {
            threats: [{ id: 'T1', threat: 'Sensitive execution without authorization' }],
            controls: [{ threat_id: 'T1', control: 'SENSITIVE_CONTROLLED authorization' }],
            residual_risk: { level: 'low', critical_unaddressed: false },
          },
        },
        tool: {
          provider: 'internal',
          operation: 'inspect-security-review',
          resource: 'mcf-agent-runtime',
        },
      });

      expect(result).toMatchObject({
        phaseState: 'COMPLETED',
        evidenceStatus: 'VALID',
        handoffTo: 'Emily',
      });
      expect(result.mission.version).toBe(2);
      expect(result.mission.currentAgentId).toBe('Emily');
      expect(result.receipt?.metadata.executionEvidence).toMatchObject({
        residual_risk: { level: 'low', critical_unaddressed: false },
      });

      const timeline = await service.timeline(mission.id);
      expect(timeline.mission.version).toBe(2);
      expect(timeline.events.some((event) => event.eventType === 'TOOL_RECEIPT_RECORDED')).toBe(true);
      expect(timeline.events.some((event) => event.eventType === 'EVIDENCE_VALIDATED')).toBe(true);
      expect(timeline.events.some((event) => event.eventType === 'HANDOFF_CREATED')).toBe(true);
      expect(timeline.events.some((event) => event.eventType === 'PHASE_COMPLETED')).toBe(true);
    } finally {
      await database.query('delete from "mcf_missions" where "id" = $1', [mission.id]);
    }
  });
});
