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
    reproduction: {
      symptom: 'The mission stays in RECOVERING after the callback is persisted.',
      method: 'Replay the persisted callback against the same mission and phase version.',
      evidence_reference: 'trace:debug-incident:callback-17',
    },
    root_cause: {
      cause:
        'The handler reused a stale expected mission version after persisting the callback event.',
      supporting_evidence: 'ledger:mission-version-transition:7-to-8',
    },
    recovery_result: {
      action_or_mitigation:
        'Isolated stale-version handling and reloaded the expected version from persistence.',
      verification:
        'Deterministic replay completes once and produces the expected phase completion event.',
      blind_retry: false,
      retry_evidence:
        'attempt-ledger:debug-incident records one governed diagnostic attempt and no ungoverned retry.',
      regression_test_added: {
        reference: 'mission-runtime-lot4-debug-incident.integration.test.ts#valid-debug-incident',
      },
    },
  };
}

describe('MissionRuntime Lot 4D debug incident persistence', () => {
  let database: DatabaseService;
  let service: MissionRuntimeService;

  beforeAll(() => {
    process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-lot4d-debug-0001';
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

  it('persists semantic evidence, receipt, Renato handoff and version progression', async () => {
    const mission = await service.createMission({
      contract: {
        title: 'Lot 4D debug incident persistence proof',
        objective: 'Diagnose the runtime incident and validate recovery.',
        expectedOutcome: 'Root cause and verified recovery survive persistence.',
        scope: ['MCF-DEBUG-INCIDENT'],
        outOfScope: ['external write', 'environment mutation', 'production'],
        acceptanceCriteria: ['cause_supported', 'regression_test_added'],
        riskClass: 'C',
        selectedAgents: ['Patricia', 'Renato'],
        selectedSkills: ['MCF-DEBUG-INCIDENT'],
        sourceOfTruth: ['skills/registry.yaml', 'docs/agentes/PATRICIA.md'],
      },
    });

    try {
      const result = await service.executePhase(mission.id, {
        phaseId: randomUUID(),
        skillId: 'MCF-DEBUG-INCIDENT',
        agentId: 'Patricia',
        expectedMissionVersion: 1,
        inputs: {
          symptom_or_evidence: 'Mission stuck after callback.',
          execution_evidence: semanticEvidence(),
        },
        tool: {
          provider: 'internal',
          operation: 'inspect-debug-incident',
          resource: 'mcf-agent-runtime',
        },
      });

      expect(result).toMatchObject({
        phaseState: 'COMPLETED',
        evidenceStatus: 'VALID',
        handoffTo: 'Renato',
      });
      expect(result.mission.version).toBe(2);
      expect(result.mission.currentAgentId).toBe('Renato');
      expect(result.receipt?.metadata.executionEvidence).toMatchObject({
        recovery_result: {
          blind_retry: false,
          retry_evidence:
            'attempt-ledger:debug-incident records one governed diagnostic attempt and no ungoverned retry.',
        },
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

  it('persists RECOVERING and creates no success handoff when evidence is insufficient', async () => {
    const mission = await service.createMission({
      contract: {
        title: 'Lot 4D debug incident recovery proof',
        objective: 'Reject fabricated recovery evidence.',
        expectedOutcome: 'Mission remains recoverable without fabricated success.',
        scope: ['MCF-DEBUG-INCIDENT'],
        outOfScope: ['blind retry', 'external write'],
        acceptanceCriteria: ['semantic evidence required'],
        riskClass: 'C',
        selectedAgents: ['Patricia', 'Renato'],
        selectedSkills: ['MCF-DEBUG-INCIDENT'],
        sourceOfTruth: ['skills/registry.yaml'],
      },
    });

    try {
      const result = await service.executePhase(mission.id, {
        phaseId: randomUUID(),
        skillId: 'MCF-DEBUG-INCIDENT',
        agentId: 'Patricia',
        expectedMissionVersion: 1,
        inputs: {
          symptom_or_evidence: 'Mission stuck after callback.',
          execution_evidence: {
            ...semanticEvidence(),
            recovery_result: {
              action_or_mitigation: 'retry',
              verification: 'ok',
              blind_retry: true,
              retry_evidence: 'attempt-ledger:uncontrolled-second-attempt',
              regression_test_added: true,
            },
          },
        },
        tool: {
          provider: 'internal',
          operation: 'inspect-debug-incident',
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
