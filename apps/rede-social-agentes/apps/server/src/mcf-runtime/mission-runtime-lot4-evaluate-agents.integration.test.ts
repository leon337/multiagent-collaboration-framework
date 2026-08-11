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

describe('MissionRuntime Lot 4B agent evaluation persistence', () => {
  let database: DatabaseService;
  let service: MissionRuntimeService;

  beforeAll(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-lot4b-evaluation-0001';
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

  it('persists validated evaluation evidence, Emily handoff and version progression', async () => {
    const mission = await service.createMission({
      contract: {
        title: 'Lot 4B evaluation persistence proof',
        objective: 'Evaluate agent behavior with reproducible evidence.',
        expectedOutcome: 'Validated scorecard survives the MissionRuntime persistence boundary.',
        scope: ['MCF-EVALUATE-AGENTS'],
        outOfScope: ['production', 'external write'],
        acceptanceCriteria: ['evaluation evidence persists and version advances'],
        riskClass: 'C',
        selectedAgents: ['Beatriz', 'Emily'],
        selectedSkills: ['MCF-EVALUATE-AGENTS'],
        sourceOfTruth: ['skills/registry.yaml', 'docs/agentes/BEATRIZ.md'],
      },
    });

    try {
      const result = await service.executePhase(mission.id, {
        phaseId: randomUUID(),
        skillId: 'MCF-EVALUATE-AGENTS',
        agentId: 'Beatriz',
        expectedMissionVersion: 1,
        inputs: {
          behavior_or_configuration: 'Evaluate agent handoff behavior.',
          criteria: ['handoff consistency', 'evidence fidelity'],
          execution_evidence: {
            test_cases: [{ id: 'handoff-1', expected: 'Emily receives the evaluation' }],
            scores: { handoff_consistency: 1, evidence_fidelity: 0.95 },
            regressions: [],
          },
        },
        tool: {
          provider: 'internal',
          operation: 'evaluate-agents',
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
        scores: { handoff_consistency: 1, evidence_fidelity: 0.95 },
        regressions: [],
      });

      const timeline = await service.timeline(mission.id);
      expect(timeline.mission.version).toBe(2);
      expect(timeline.events.some((event) => event.eventType === 'TOOL_RECEIPT_RECORDED')).toBe(
        true,
      );
      expect(timeline.events.some((event) => event.eventType === 'EVIDENCE_VALIDATED')).toBe(true);
      expect(timeline.events.some((event) => event.eventType === 'HANDOFF_CREATED')).toBe(true);
      expect(timeline.events.some((event) => event.eventType === 'PHASE_COMPLETED')).toBe(true);
    } finally {
      await database.query('delete from "mcf_missions" where "id" = $1', [mission.id]);
    }
  });
});
