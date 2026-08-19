import type { McfMissionContract } from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import type {
  McfEventInput,
  McfEventRecord,
  McfMissionRecord,
  McfPhaseRecord,
  McfRuntimeRepository,
} from './mcf-runtime.repository.js';
import {
  ProductionAuthorizationService,
  type ProductionGateEventStore,
} from './production-authorization.service.js';

const missionId = '11111111-1111-4111-8111-111111111111';
const phaseId = '22222222-2222-4222-8222-222222222222';
const releaseSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const otherSha = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const humanAuthorizationRef = 'human:leandro:production:decision-001';

function contract(): McfMissionContract {
  return {
    contractSchemaVersion: '1.1',
    projectId: 'mcf-runtime',
    title: 'Governed production promotion',
    objective: 'Promote only an explicitly authorized exact production SHA.',
    expectedOutcome: 'Production remains fail-closed without both authorities.',
    scope: ['production-promotion'],
    outOfScope: ['blind-autodeploy'],
    acceptanceCriteria: ['exact SHA is authorized by LEANDRO and gated by LÉO'],
    riskClass: 'B',
    selectedAgents: ['Leo', 'Gabriel'],
    selectedSkills: ['MCF-DEPLOY-VALIDATE'],
    sourceOfTruth: ['mcf_events'],
  };
}

function authorizationContext(sourceRef = humanAuthorizationRef): Record<string, unknown> {
  return {
    projectId: 'mcf-runtime',
    missionId,
    actionClass: 'release-public',
    environment: 'production',
    reversible: true,
    observedAt: '2026-08-19T17:00:00.000Z',
    boundary: `release-sha:${releaseSha}`,
    evidenceRefs: ['team-first:production-promotion'],
    reservedHumanAuthority: true,
    standingAuthorizations: [],
    teamFirst: {
      attempted: true,
      evidenceRefs: ['team-first:production-promotion'],
      fallbackExhausted: true,
    },
    humanGateDecision: {
      status: 'APPROVED',
      decidedBy: 'LEANDRO',
      sourceRef,
    },
  };
}

function mission(): McfMissionRecord {
  return {
    id: missionId,
    contract: contract(),
    state: 'EXECUTING',
    currentPhaseId: phaseId,
    currentAgentId: 'Leo',
    version: 4,
    createdAt: new Date('2026-08-19T16:50:00.000Z'),
    updatedAt: new Date('2026-08-19T17:00:00.000Z'),
  };
}

function phase(overrides: Partial<McfPhaseRecord> = {}): McfPhaseRecord {
  return {
    id: phaseId,
    missionId,
    skillId: 'MCF-DEPLOY-VALIDATE',
    agentId: 'Leo',
    state: 'COMPLETED',
    cycle: 1,
    inputs: { v11AuthorizationContext: authorizationContext() },
    expectedEvidence: ['deployment_id', 'target', 'smoke_result', 'rollback_state'],
    startedAt: new Date('2026-08-19T17:00:00.000Z'),
    completedAt: new Date('2026-08-19T17:02:00.000Z'),
    createdAt: new Date('2026-08-19T17:00:00.000Z'),
    updatedAt: new Date('2026-08-19T17:02:00.000Z'),
    ...overrides,
  };
}

function gateEvent(options?: {
  decision?: 'APPROVE' | 'REJECT';
  targetSha?: string;
  humanRef?: string;
  occurredAt?: string;
}): McfEventRecord {
  const decision = options?.decision ?? 'APPROVE';
  return {
    id: decision === 'APPROVE' ? '33333333-3333-4333-8333-333333333333' : '44444444-4444-4444-8444-444444444444',
    missionId,
    phaseId,
    agentId: 'Leo',
    eventType: decision === 'APPROVE' ? 'GATE_APPROVED' : 'GATE_REJECTED',
    payload: {
      gate: 'PRODUCTION_PROMOTION',
      operationalAuthority: 'LEO',
      decision,
      targetSha: options?.targetSha ?? releaseSha,
      sourceRef: `leo:production-gate:${decision.toLowerCase()}`,
      evidenceRef: `evidence:leo:${decision.toLowerCase()}`,
      humanAuthorizationRef: options?.humanRef ?? humanAuthorizationRef,
    },
    idempotencyKey: `production-gate:${missionId}:${phaseId}:${options?.targetSha ?? releaseSha}:${decision}`,
    occurredAt: new Date(options?.occurredAt ?? '2026-08-19T17:03:00.000Z'),
  };
}

function harness(options?: {
  phase?: McfPhaseRecord;
  events?: McfEventRecord[];
  inserted?: boolean;
}) {
  const ledger = [...(options?.events ?? [])];
  const runtime: McfRuntimeRepository = {
    createMission: vi.fn(),
    findMission: vi.fn(async () => mission()),
    findPhase: vi.fn(async () => options?.phase ?? phase()),
    persistExecution: vi.fn(),
    completePendingPhase: vi.fn(),
    listEvents: vi.fn(async () => ledger),
  } as unknown as McfRuntimeRepository;

  const store: ProductionGateEventStore = {
    appendGateEvent: vi.fn(async (event: McfEventInput) => {
      if (options?.inserted === false) return false;
      ledger.push({ ...event });
      return true;
    }),
  };

  return {
    service: new ProductionAuthorizationService(runtime, store),
    runtime,
    store,
    ledger,
  };
}

const gateRequest = {
  missionId,
  phaseId,
  releaseSha,
  decision: 'APPROVE' as const,
  sourceRef: 'leo:production-gate:approve',
  evidenceRef: 'evidence:leo:approve',
};

const resolveRequest = { missionId, phaseId, releaseSha };

describe('ProductionAuthorizationService', () => {
  it('derives LÉO authority from the persisted phase instead of caller input', async () => {
    const { service, store } = harness();

    await service.recordLeoOperationalGate(gateRequest);

    expect(store.appendGateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        missionId,
        phaseId,
        agentId: 'Leo',
        eventType: 'GATE_APPROVED',
        payload: expect.objectContaining({
          operationalAuthority: 'LEO',
          targetSha: releaseSha,
          humanAuthorizationRef,
        }),
      }),
    );
  });

  it('rejects a gate record when the persisted phase is not owned by LÉO', async () => {
    const { service, store } = harness({ phase: phase({ agentId: 'Gabriel' }) });

    await expect(service.recordLeoOperationalGate(gateRequest)).rejects.toThrow(/L[EÉ]O/iu);
    expect(store.appendGateEvent).not.toHaveBeenCalled();
  });

  it('fails closed when LEANDRO authorization is absent', async () => {
    const invalidPhase = phase({
      inputs: {
        v11AuthorizationContext: {
          ...authorizationContext(),
          humanGateDecision: { status: 'PENDING' },
        },
      },
    });
    const { service } = harness({ phase: invalidPhase, events: [gateEvent()] });

    await expect(service.resolveProductionAuthorization(resolveRequest)).resolves.toMatchObject({
      state: 'BLOCKED',
      reason: 'PRODUCTION_AUTHORIZATION_REQUIRED',
      targetSha: releaseSha,
    });
  });

  it('fails closed when no persisted LÉO gate exists', async () => {
    const { service } = harness();

    await expect(service.resolveProductionAuthorization(resolveRequest)).resolves.toMatchObject({
      state: 'BLOCKED',
      reason: 'OPERATIONAL_GATE_REQUIRED',
      targetSha: releaseSha,
    });
  });

  it('authorizes only the exact SHA when LEANDRO and LÉO evidence match', async () => {
    const { service } = harness({ events: [gateEvent()] });

    await expect(service.resolveProductionAuthorization(resolveRequest)).resolves.toMatchObject({
      state: 'AUTHORIZED',
      humanAuthority: 'LEANDRO',
      operationalGate: 'LEO',
      gateDecision: 'APPROVE',
      provenance: 'MCF_RUNTIME_PERSISTED_AUTHORIZATION',
      targetSha: releaseSha,
      sourceDecision: humanAuthorizationRef,
      authorizationId: humanAuthorizationRef,
      evidenceRef: 'evidence:leo:approve',
    });
  });

  it('ignores a LÉO approval bound to a different SHA', async () => {
    const { service } = harness({ events: [gateEvent({ targetSha: otherSha })] });

    await expect(service.resolveProductionAuthorization(resolveRequest)).resolves.toMatchObject({
      state: 'BLOCKED',
      reason: 'OPERATIONAL_GATE_REQUIRED',
    });
  });

  it('lets a later LÉO rejection supersede an earlier approval', async () => {
    const { service } = harness({
      events: [
        gateEvent({ occurredAt: '2026-08-19T17:03:00.000Z' }),
        gateEvent({ decision: 'REJECT', occurredAt: '2026-08-19T17:04:00.000Z' }),
      ],
    });

    await expect(service.resolveProductionAuthorization(resolveRequest)).resolves.toMatchObject({
      state: 'BLOCKED',
      reason: 'OPERATIONAL_GATE_REJECTED',
    });
  });

  it('rejects a stale LÉO gate tied to a different LEANDRO authorization', async () => {
    const { service } = harness({ events: [gateEvent({ humanRef: 'human:old-decision' })] });

    await expect(service.resolveProductionAuthorization(resolveRequest)).resolves.toMatchObject({
      state: 'BLOCKED',
      reason: 'OPERATIONAL_GATE_STALE',
    });
  });

  it('reports duplicate persistence without creating a second canonical gate', async () => {
    const { service, store } = harness({ inserted: false });

    await expect(service.recordLeoOperationalGate(gateRequest)).resolves.toMatchObject({
      accepted: true,
      duplicate: true,
      operationalGate: 'LEO',
      targetSha: releaseSha,
    });
    expect(store.appendGateEvent).toHaveBeenCalledTimes(1);
  });
});
