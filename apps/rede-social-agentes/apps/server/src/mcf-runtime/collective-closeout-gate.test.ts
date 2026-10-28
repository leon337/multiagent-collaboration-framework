import { describe, expect, it, vi } from 'vitest';
import type { McfMissionContract, McfRequiredAgentExecution } from '@rsa/contracts';
import { assertCollectiveCloseoutReady, type CollectiveCloseoutReader } from './collective-closeout-gate.js';

const sofia: McfRequiredAgentExecution = {
  agentId: 'Sofia', runId: 'run-sofia', providerId: 'native',
  providerExecutionId: 'task-sofia', surface: 'NATIVE_SUBAGENT', contractRef: 'contract:arch',
};
const emily: McfRequiredAgentExecution = {
  agentId: 'Emily', runId: 'run-emily', providerId: 'cockpit',
  providerExecutionId: 'chat-emily', surface: 'COCKPIT_SESSION', contractRef: 'contract:audit',
};
const contract: McfMissionContract = {
  title: 'collective closeout', objective: 'do not close early', expectedOutcome: 'verified',
  scope: [], outOfScope: [], acceptanceCriteria: [], riskClass: 'C',
  selectedAgents: ['Mestre', 'Sofia', 'Emily'], selectedSkills: ['MCF-TRACE-MISSION'],
  sourceOfTruth: [], collectiveCloseoutRequired: true, requiredAgentExecutions: [sofia, emily],
};
function makeHandle(p: McfRequiredAgentExecution) {
  return {
    missionId: 'mission-483', runId: p.runId,
    providerId: p.providerId, providerExecutionId: p.providerExecutionId,
  };
}
function receipt(p: McfRequiredAgentExecution) {
  return [
    {
      evidenceId: 'artifact-' + p.runId, providerId: p.providerId,
      providerExecutionId: p.providerExecutionId, kind: 'ARTIFACT',
      sourceRef: 'artifact:' + p.runId, observedAt: '2026-10-27T21:00:00Z',
      digest: 'abc123', metadata: {},
    },
    {
      evidenceId: 'receipt-' + p.runId, providerId: p.providerId,
      providerExecutionId: p.providerExecutionId, kind: 'RECEIPT',
      sourceRef: 'receipt:' + p.runId, observedAt: '2026-10-27T21:00:00Z',
      digest: 'def456',
      metadata: {
        missionId: 'mission-483', runId: p.runId, agentId: p.agentId,
        surface: p.surface, contractRef: p.contractRef,
        handoffReceived: true, handoffVerified: true,
      },
    },
  ];
}
function reader(
  states: Record<string, string> = {},
  evidenceFor: (p: McfRequiredAgentExecution) => unknown[] = receipt,
): CollectiveCloseoutReader {
  const participant = (h: { runId: string }) => h.runId === 'run-sofia' ? sofia : emily;
  return {
    status: vi.fn(async (h) => ({
      handle: makeHandle(participant(h)),
      lifecycle: states[h.runId] ?? 'COMPLETED',
      observedAt: '2026-10-27T21:00:00Z',
      providerState: null, effectState: 'EFFECT_OBSERVED',
    })),
    collectEvidence: vi.fn(async (h) => evidenceFor(participant(h))),
  } as unknown as CollectiveCloseoutReader;
}

describe('collective completion gate (#483)', () => {
  it('allows only both terminal executions with corroborated artifacts + received/verified handoffs', async () => {
    await expect(assertCollectiveCloseoutReady('mission-483', contract, reader())).resolves.toBeUndefined();
  });
  it.each(['QUEUED', 'RUNNING', 'PAUSED', 'INTERRUPT_REQUESTED', 'CANCEL_REQUESTED', 'FAILED', 'EFFECT_UNKNOWN'])(
    'refuses while SOFIA is %s even if EMILY is done', async (state) => {
      await expect(assertCollectiveCloseoutReady('mission-483', contract, reader({ 'run-sofia': state })))
        .rejects.toThrow(/AGUARDANDO_AGENTE: Sofia/);
    },
  );
  it('refuses a completed agent without an artifact', async () => {
    await expect(assertCollectiveCloseoutReady('mission-483', contract, reader({}, (p) =>
      receipt(p).filter((e) => e.kind !== 'ARTIFACT')))).rejects.toThrow('missing verified artifact/handoff');
  });
  it('refuses a completed agent without received and verified handoff', async () => {
    await expect(assertCollectiveCloseoutReady('mission-483', contract, reader({}, (p) =>
      receipt(p).map((e) => e.kind === 'RECEIPT'
        ? { ...e, metadata: { ...e.metadata, handoffVerified: false } } : e))))
      .rejects.toThrow('missing verified artifact/handoff');
  });
  it('refuses evidence from another conversation', async () => {
    await expect(assertCollectiveCloseoutReady('mission-483', contract, reader({}, (p) =>
      receipt(p).map((e) => ({ ...e, providerExecutionId: 'other-session' })))))
      .rejects.toThrow('missing verified artifact/handoff');
  });
  it('refuses another session in terminal status even when IDs are spoofed', async () => {
    const r = reader();
    r.status = vi.fn(async () => ({
      handle: makeHandle(emily), lifecycle: 'COMPLETED',
      observedAt: '2026-10-27T21:00:00Z', providerState: null,
      effectState: 'EFFECT_OBSERVED',
    }));
    await expect(assertCollectiveCloseoutReady('mission-483', contract, r))
      .rejects.toThrow(/AGUARDANDO_AGENTE: Sofia/);
  });
  it('refuses unavailable status provider and does not equate exceptions with success', async () => {
    const r = reader();
    r.status = vi.fn(async () => { throw new Error('unavailable'); });
    await expect(assertCollectiveCloseoutReady('mission-483', contract, r))
      .rejects.toThrow('provider unavailable/timeout');
  });
  it('refuses absent roster for explicitly delegated mission', async () => {
    await expect(assertCollectiveCloseoutReady('mission-483', {
      ...contract, requiredAgentExecutions: [],
    }, reader())).rejects.toThrow('roster missing');
  });
  it('refuses duplicate provider execution IDs', async () => {
    await expect(assertCollectiveCloseoutReady('mission-483', {
      ...contract, requiredAgentExecutions: [
        sofia, { ...emily, providerId: sofia.providerId, providerExecutionId: sofia.providerExecutionId },
      ],
    }, reader())).rejects.toThrow('duplicate execution');
  });
  it('rechecks after await and refuses an execution that becomes non-terminal', async () => {
    const r = reader(); let calls = 0;
    r.status = vi.fn(async (h) => ({
      handle: makeHandle(h.runId === 'run-sofia' ? sofia : emily),
      lifecycle: ++calls === 2 ? 'RUNNING' : 'COMPLETED',
      observedAt: '2026-10-27T21:00:00Z',
      providerState: null, effectState: 'EFFECT_OBSERVED',
    }));
    await expect(assertCollectiveCloseoutReady('mission-483', contract, r))
      .rejects.toThrow('changed/unknown');
  });
  it('does not change legacy nondelegated mission behavior', async () => {
    await expect(assertCollectiveCloseoutReady('mission-483', {
      ...contract, collectiveCloseoutRequired: undefined, requiredAgentExecutions: undefined,
    })).resolves.toBeUndefined();
  });
});
