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

describe('MissionRuntime Lot 4 core persistence integration', () => {
  let database: DatabaseService;
  let service: MissionRuntimeService;

  beforeAll(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-lot4-runtime-0001';
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

  it('persists a validated governed internal skill, receipt events, handoff and mission version', async () => {
    const mission = await service.createMission({
      contract: {
        title: 'Lot 4A persistence proof',
        objective: 'Persist a governed product-definition execution through MissionRuntime.',
        expectedOutcome: 'Validated evidence and handoff survive the runtime persistence boundary.',
        scope: ['MCF-DEFINE-PRODUCT'],
        outOfScope: ['production', 'external write'],
        acceptanceCriteria: ['mission version advances after validated execution'],
        riskClass: 'C',
        selectedAgents: ['Leonardo', 'Sofia'],
        selectedSkills: ['MCF-DEFINE-PRODUCT'],
        sourceOfTruth: ['skills/registry.yaml'],
      },
    });

    try {
      const result = await service.executePhase(mission.id, {
        phaseId: randomUUID(),
        skillId: 'MCF-DEFINE-PRODUCT',
        agentId: 'Leonardo',
        expectedMissionVersion: 1,
        inputs: {
          idea_or_problem: 'The mission needs a bounded executable product definition.',
          execution_evidence: {
            problem_statement: 'The requested product boundary is not yet explicit or testable.',
            requirements: ['Define target users', 'Bound MVP scope'],
            acceptance_criteria: ['Problem is explicit', 'MVP is bounded'],
          },
        },
        tool: {
          provider: 'internal',
          operation: 'plan-product',
          resource: 'mcf-agent-runtime',
        },
      });

      expect(result).toMatchObject({
        phaseState: 'COMPLETED',
        evidenceStatus: 'VALID',
        handoffTo: 'Sofia',
      });
      expect(result.mission.version).toBe(2);
      expect(result.mission.state).toBe('EXECUTING');
      expect(result.mission.currentAgentId).toBe('Sofia');
      expect(result.receipt?.metadata.executionEvidence).toMatchObject({
        problem_statement: 'The requested product boundary is not yet explicit or testable.',
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
