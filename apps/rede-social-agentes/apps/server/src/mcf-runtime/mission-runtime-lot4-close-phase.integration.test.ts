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

function semanticEvidence() {
  return {
    phase_pack: {
      artifacts: ['PLAN.md', 'REPORT.md', 'CHECKPOINT.yaml'],
      manifest_reference: 'ARTIFACT-MANIFEST.sha256',
      traceability_complete: true,
    },
    audit_verdict: {
      verdict: 'PASS',
      evidence_reference: 'audit:lot4e:head-exact',
      blocking_findings: [],
    },
    leo_decision: {
      decision: 'APROVAR',
      justification: 'All closeout acceptance criteria are evidenced.',
      next_state: 'ENTREGUE',
      next_action: 'nenhuma',
      responsible: 'Mestre',
    },
    checkpoint: {
      final_state: 'ENTREGUE',
      objective_met: true,
      unresolved_findings: [],
      blockers: [],
      next_action: 'nenhuma',
      checkpoint_recipient: 'Mestre',
      human_action_required: false,
    },
  };
}

describe('MissionRuntime Lot 4E close phase persistence', () => {
  let database: DatabaseService;
  let service: MissionRuntimeService;

  beforeAll(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-lot4e-close-0001';
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

  it('persists truthful closeout evidence, receipt, Mestre handoff and version progression', async () => {
    const mission = await service.createMission({
      contract: {
        title: 'Lot 4E close phase persistence proof',
        objective: 'Close the phase with truthful traceability.',
        expectedOutcome:
          'Closeout evidence survives persistence without human technical delegation.',
        scope: ['MCF-CLOSE-PHASE'],
        outOfScope: ['production', 'external write'],
        acceptanceCriteria: ['traceability_complete', 'objective_state_truthful'],
        riskClass: 'C',
        selectedAgents: ['Carmem', 'Mestre'],
        selectedSkills: ['MCF-CLOSE-PHASE'],
        sourceOfTruth: [
          'skills/registry.yaml',
          'docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md',
        ],
      },
    });

    try {
      const result = await service.executePhase(mission.id, {
        phaseId: randomUUID(),
        skillId: 'MCF-CLOSE-PHASE',
        agentId: 'Carmem',
        expectedMissionVersion: 1,
        inputs: {
          phase_execution: 'Lot 4E execution trace',
          acceptance_results: ['traceability_complete', 'objective_state_truthful'],
          execution_evidence: semanticEvidence(),
        },
        tool: {
          provider: 'internal',
          operation: 'close-phase',
          resource: 'mcf-agent-runtime',
        },
      });

      expect(result).toMatchObject({
        phaseState: 'COMPLETED',
        evidenceStatus: 'VALID',
        handoffTo: 'Mestre',
      });
      expect(result.mission.version).toBe(2);
      expect(result.mission.currentAgentId).toBe('Mestre');
      expect(result.receipt?.metadata.executionEvidence).toMatchObject({
        checkpoint: { final_state: 'ENTREGUE', checkpoint_recipient: 'Mestre' },
      });

      const timeline = await service.timeline(mission.id);
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

  it('persists RECOVERING and creates no success handoff for contradictory delivered evidence', async () => {
    const mission = await service.createMission({
      contract: {
        title: 'Lot 4E close phase recovery proof',
        objective: 'Reject false phase completion.',
        expectedOutcome: 'Mission remains recoverable without fabricated delivery.',
        scope: ['MCF-CLOSE-PHASE'],
        outOfScope: ['human technical handoff'],
        acceptanceCriteria: ['truthful closeout'],
        riskClass: 'C',
        selectedAgents: ['Carmem', 'Mestre'],
        selectedSkills: ['MCF-CLOSE-PHASE'],
        sourceOfTruth: ['skills/registry.yaml'],
      },
    });

    try {
      const result = await service.executePhase(mission.id, {
        phaseId: randomUUID(),
        skillId: 'MCF-CLOSE-PHASE',
        agentId: 'Carmem',
        expectedMissionVersion: 1,
        inputs: {
          phase_execution: 'Lot 4E execution trace',
          acceptance_results: ['truthful closeout'],
          execution_evidence: {
            ...semanticEvidence(),
            checkpoint: {
              ...semanticEvidence().checkpoint,
              next_action: 'fix pending failure',
            },
          },
        },
        tool: {
          provider: 'internal',
          operation: 'close-phase',
          resource: 'mcf-agent-runtime',
        },
      });

      expect(result).toMatchObject({
        phaseState: 'RECOVERING',
        evidenceStatus: 'INVALID',
        handoffTo: null,
      });
      expect(result.mission.state).toBe('RECOVERING');

      const timeline = await service.timeline(mission.id);
      expect(timeline.events.some((event) => event.eventType === 'HANDOFF_CREATED')).toBe(false);
      expect(timeline.events.some((event) => event.eventType === 'PHASE_COMPLETED')).toBe(false);
      expect(timeline.events.some((event) => event.eventType === 'RECOVERY_STARTED')).toBe(true);
    } finally {
      await database.query('delete from "mcf_missions" where "id" = $1', [mission.id]);
    }
  });
});
