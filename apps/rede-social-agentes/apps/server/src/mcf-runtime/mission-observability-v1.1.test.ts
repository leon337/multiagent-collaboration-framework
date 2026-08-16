import type { McfMissionContract } from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import type {
  McfEventRecord,
  McfMissionRecord,
  McfRuntimeRepository,
} from './mcf-runtime.repository.js';
import type { MissionObservabilityRepository } from './mission-observability.repository.js';
import { MissionObservabilityService } from './mission-observability.service.js';

const contract: McfMissionContract = {
  title: 'MCF v1.1 implementation',
  objective: 'Expose authoritative references safely.',
  expectedOutcome: 'Derived audit projection.',
  scope: ['observability'],
  outOfScope: ['secret material'],
  acceptanceCriteria: ['refs visible', 'derived view only'],
  riskClass: 'B',
  selectedAgents: ['Mestre'],
  selectedSkills: ['MCF-TRACE-MISSION'],
  sourceOfTruth: ['mcf_events'],
  contractSchemaVersion: '1.1',
  projectId: 'project-1',
  projectEntryMode: 'ADOPT_EXISTING_PROJECT',
  methodologyPin: {
    version: '1.1.0',
    immutableRef: 'git:methodology@abc123',
  },
  alignedPipRef: {
    artifactType: 'PROJECT_INTENT_PACKAGE',
    schemaVersion: '1.0',
    projectId: 'project-1',
    revisionId: 'pip-7',
    path: '.mcf/intent/pip-pip-7.json',
    contentDigest: `sha256:${'a'.repeat(64)}`,
    repository: 'leon337/multiagent-collaboration-framework',
    commitSha: '1'.repeat(40),
  },
  projectRealityReportRef: {
    artifactType: 'PROJECT_REALITY_REPORT',
    schemaVersion: '1.0',
    projectId: 'project-1',
    revisionId: 'prr-3',
    path: '.mcf/reality/prr-prr-3.json',
    contentDigest: `sha256:${'b'.repeat(64)}`,
    repository: 'leon337/multiagent-collaboration-framework',
    commitSha: '2'.repeat(40),
  },
  standingAuthorizations: [
    {
      authorizationId: 'AUTH-001',
      projectId: 'project-1',
      grantedBy: 'LEANDRO',
      grantedAt: '2026-08-16T00:00:00.000Z',
      actionClasses: ['repository-write'],
      environments: ['staging'],
      maximumCost: { currency: 'USD', amount: 25 },
      reversibleOnly: true,
      exclusions: [],
      evidenceRequirements: ['ticket-approved'],
      sourceDecisionRef: 'human:leandro:decision-001',
      status: 'ACTIVE',
    },
    {
      authorizationId: 'AUTH-REVOKED',
      projectId: 'project-1',
      grantedBy: 'LEANDRO',
      grantedAt: '2026-08-16T00:00:00.000Z',
      actionClasses: ['release'],
      environments: ['production'],
      maximumCost: null,
      reversibleOnly: false,
      exclusions: [],
      evidenceRequirements: [],
      sourceDecisionRef: 'human:leandro:decision-old',
      status: 'REVOKED',
    },
  ],
  continuityCheckpointRef: {
    artifactType: 'MCF_CHECKPOINT',
    schemaVersion: '1.1',
    projectId: 'project-1',
    revisionId: 'checkpoint-4',
    path: '.mcf/continuity/checkpoint-checkpoint-4.json',
    contentDigest: `sha256:${'c'.repeat(64)}`,
    repository: 'leon337/multiagent-collaboration-framework',
    commitSha: '3'.repeat(40),
  },
};

function mission(): McfMissionRecord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    contract,
    state: 'RECOVERING',
    currentPhaseId: '22222222-2222-4222-8222-222222222222',
    currentAgentId: 'Mestre',
    version: 9,
    createdAt: new Date('2026-08-16T03:00:00.000Z'),
    updatedAt: new Date('2026-08-16T04:00:00.000Z'),
  };
}

function events(options?: { gateResolved?: boolean }): McfEventRecord[] {
  const result: McfEventRecord[] = [
    {
      id: 'event-gate-required',
      missionId: mission().id,
      phaseId: null,
      agentId: 'Mestre',
      eventType: 'GATE_REQUIRED',
      payload: {
        reason: 'MATERIAL_BOUNDARY',
        secret: 'must-never-leak',
        token: 'private-token',
      },
      idempotencyKey: 'gate-required:1',
      occurredAt: new Date('2026-08-16T03:30:00.000Z'),
    },
    {
      id: 'event-recovery',
      missionId: mission().id,
      phaseId: null,
      agentId: 'Mestre',
      eventType: 'RECOVERY_COMPLETED',
      payload: {
        resumeRoute: 'RECONCILE',
        outcome: 'LIVE_STATE_RECONCILED',
        accessToken: 'should-not-leak',
      },
      idempotencyKey: 'recovery-completed:1',
      occurredAt: new Date('2026-08-16T03:50:00.000Z'),
    },
  ];
  if (options?.gateResolved) {
    result.push({
      id: 'event-gate-approved',
      missionId: mission().id,
      phaseId: null,
      agentId: 'Mestre',
      eventType: 'GATE_APPROVED',
      payload: { decidedBy: 'LEANDRO' },
      idempotencyKey: 'gate-approved:1',
      occurredAt: new Date('2026-08-16T03:55:00.000Z'),
    });
  }
  return result;
}

function runtimeRepository(eventList = events()): McfRuntimeRepository {
  return {
    findMission: vi.fn(async () => mission()),
    listEvents: vi.fn(async () => eventList),
  } as unknown as McfRuntimeRepository;
}

function observabilityRepository(): MissionObservabilityRepository {
  return {} as MissionObservabilityRepository;
}

describe('MissionObservabilityService v1.1 audit projection', () => {
  it('exposes authoritative v1.1 refs while labeling the projection and volatile state', async () => {
    const service = new MissionObservabilityService(
      runtimeRepository(),
      observabilityRepository(),
    );

    const view = await service.getMissionV11AuditProjection(mission().id);

    expect(view.classification).toBe('DERIVED_REBUILDABLE_VIEW');
    expect(view.sourceAuthority).toBe('MCF_PERSISTENCE_AND_EVENT_LEDGER');
    expect(view.projectEntryMode).toBe('ADOPT_EXISTING_PROJECT');
    expect(view.methodologyPin).toEqual(contract.methodologyPin);
    expect(view.alignedPipRef).toEqual(contract.alignedPipRef);
    expect(view.projectRealityReportRef).toEqual(contract.projectRealityReportRef);
    expect(view.continuity.checkpointRef).toEqual(contract.continuityCheckpointRef);
    expect(view.continuity.resumeRoute).toBe('RECONCILE');
    expect(view.continuity.reconciliationOutcome).toBe('LIVE_STATE_RECONCILED');
    expect(view.volatileState).toMatchObject({
      live: true,
      missionState: 'RECOVERING',
      currentAgentId: 'Mestre',
    });
  });

  it('exposes only active standing authorization references and pending human gate metadata', async () => {
    const service = new MissionObservabilityService(
      runtimeRepository(),
      observabilityRepository(),
    );

    const view = await service.getMissionV11AuditProjection(mission().id);

    expect(view.activeStandingAuthorizationRefs).toEqual([
      {
        authorizationId: 'AUTH-001',
        sourceDecisionRef: 'human:leandro:decision-001',
      },
    ]);
    expect(view.pendingHumanGate).toEqual({
      eventId: 'event-gate-required',
      occurredAt: '2026-08-16T03:30:00.000Z',
    });
  });

  it('does not report a gate as pending after an explicit terminal gate event', async () => {
    const service = new MissionObservabilityService(
      runtimeRepository(events({ gateResolved: true })),
      observabilityRepository(),
    );

    const view = await service.getMissionV11AuditProjection(mission().id);

    expect(view.pendingHumanGate).toBeNull();
  });

  it('never exposes arbitrary event payload or secret-like material in the audit projection', async () => {
    const service = new MissionObservabilityService(
      runtimeRepository(),
      observabilityRepository(),
    );

    const view = await service.getMissionV11AuditProjection(mission().id);
    const serialized = JSON.stringify(view);

    expect(serialized).not.toContain('must-never-leak');
    expect(serialized).not.toContain('private-token');
    expect(serialized).not.toContain('should-not-leak');
    expect(serialized).not.toContain('accessToken');
    expect(serialized).not.toContain('secret');
  });
});
