import { describe, expect, it, vi } from 'vitest';
import type { McfMissionContract, McfRequiredAgentExecution } from '@rsa/contracts';
import {
  assertCollectiveCloseoutReady,
  type CollectiveCloseoutReader,
} from './collective-closeout-gate.js';

const sofia: McfRequiredAgentExecution = {
  agentId: 'Sofia',
  runId: 'run-sofia',
  providerId: 'native',
  providerExecutionId: 'task-sofia',
  surface: 'NATIVE_SUBAGENT',
  contractRef: 'contract:arch',
};
const emily: McfRequiredAgentExecution = {
  agentId: 'Emily',
  runId: 'run-emily',
  providerId: 'cockpit',
  providerExecutionId: 'chat-emily',
  surface: 'COCKPIT_SESSION',
  contractRef: 'contract:audit',
};
const contract: McfMissionContract = {
  title: 'collective closeout',
  objective: 'do not close early',
  expectedOutcome: 'verified',
  scope: [],
  outOfScope: [],
  acceptanceCriteria: [],
  riskClass: 'C',
  selectedAgents: ['Mestre', 'Sofia', 'Emily'],
  selectedSkills: ['MCF-TRACE-MISSION'],
  sourceOfTruth: [],
  collectiveCloseoutRequired: true,
  rosterRevision: 1,
  requiredAgentExecutions: [sofia, emily],
};
function makeHandle(p: McfRequiredAgentExecution) {
  return {
    missionId: 'mission-483',
    runId: p.runId,
    providerId: p.providerId,
    providerExecutionId: p.providerExecutionId,
  };
}
function receipt(p: McfRequiredAgentExecution) {
  return [
    {
      evidenceId: 'artifact-' + p.runId,
      providerId: p.providerId,
      providerExecutionId: p.providerExecutionId,
      kind: 'ARTIFACT',
      sourceRef: 'artifact:' + p.runId,
      observedAt: new Date().toISOString(),
      digest: 'abc123',
      metadata: {},
    },
    {
      evidenceId: 'receipt-' + p.runId,
      providerId: p.providerId,
      providerExecutionId: p.providerExecutionId,
      kind: 'RECEIPT',
      sourceRef: 'receipt:' + p.runId,
      observedAt: new Date().toISOString(),
      digest: 'def456',
      metadata: {
        missionId: 'mission-483',
        runId: p.runId,
        agentId: p.agentId,
        surface: p.surface,
        contractRef: p.contractRef,
        handoffReceived: true,
        handoffVerified: true,
        handoffId: 'handoff-' + p.runId,
        handoffToAgentId: 'Mestre',
      },
    },
    {
      evidenceId: 'ack-' + p.runId,
      providerId: 'cockpit-receiver',
      providerExecutionId: 'mestre-session',
      kind: 'RECEIPT',
      sourceRef: 'ack:' + p.runId,
      observedAt: new Date().toISOString(),
      digest: 'abcdef',
      metadata: {
        receiptType: 'HANDOFF_ACK',
        missionId: 'mission-483',
        handoffId: 'handoff-' + p.runId,
        handoffReceiptId: 'receipt-' + p.runId,
        ackForRunId: p.runId,
        ackByAgentId: 'Mestre',
        ackSessionId: 'mestre-session',
      },
    },
  ];
}
function reader(
  states: Record<string, string> = {},
  evidenceFor: (p: McfRequiredAgentExecution) => unknown[] = receipt,
): CollectiveCloseoutReader {
  const participant = (h: { runId: string }) => (h.runId === 'run-sofia' ? sofia : emily);
  return {
    status: vi.fn(async (h) => ({
      handle: makeHandle(participant(h)),
      lifecycle: states[h.runId] ?? 'COMPLETED',
      observedAt: new Date().toISOString(),
      providerState: null,
      effectState: 'EFFECT_OBSERVED',
    })),
    collectEvidence: vi.fn(async (h) => evidenceFor(participant(h))),
  } as unknown as CollectiveCloseoutReader;
}

describe('collective completion gate (#483)', () => {
  it('allows only both terminal executions with corroborated artifacts + received/verified handoffs', async () => {
    await expect(
      assertCollectiveCloseoutReady('mission-483', contract, reader()),
    ).resolves.toBeUndefined();
  });
  it.each([
    'QUEUED',
    'RUNNING',
    'PAUSED',
    'INTERRUPT_REQUESTED',
    'CANCEL_REQUESTED',
    'FAILED',
    'EFFECT_UNKNOWN',
  ])('refuses while SOFIA is %s even if EMILY is done', async (state) => {
    await expect(
      assertCollectiveCloseoutReady('mission-483', contract, reader({ 'run-sofia': state })),
    ).rejects.toThrow(/AGUARDANDO_AGENTE: Sofia/);
  });
  it('refuses a completed agent without an artifact', async () => {
    await expect(
      assertCollectiveCloseoutReady(
        'mission-483',
        contract,
        reader({}, (p) => receipt(p).filter((e) => e.kind !== 'ARTIFACT')),
      ),
    ).rejects.toThrow('missing verified artifact/handoff');
  });
  it('refuses a completed agent without received and verified handoff', async () => {
    await expect(
      assertCollectiveCloseoutReady(
        'mission-483',
        contract,
        reader({}, (p) =>
          receipt(p).map((e) =>
            e.kind === 'RECEIPT'
              ? { ...e, metadata: { ...e.metadata, handoffVerified: false } }
              : e,
          ),
        ),
      ),
    ).rejects.toThrow('missing verified artifact/handoff');
  });
  it('refuses evidence from another conversation', async () => {
    await expect(
      assertCollectiveCloseoutReady(
        'mission-483',
        contract,
        reader({}, (p) => receipt(p).map((e) => ({ ...e, providerExecutionId: 'other-session' }))),
      ),
    ).rejects.toThrow('missing verified artifact/handoff');
  });
  it('refuses another session in terminal status even when IDs are spoofed', async () => {
    const r = reader();
    r.status = vi.fn(async () => ({
      handle: makeHandle(emily),
      lifecycle: 'COMPLETED',
      observedAt: new Date().toISOString(),
      providerState: null,
      effectState: 'EFFECT_OBSERVED',
    })) as unknown as CollectiveCloseoutReader['status'];
    await expect(assertCollectiveCloseoutReady('mission-483', contract, r)).rejects.toThrow(
      /AGUARDANDO_AGENTE: Sofia/,
    );
  });
  it('refuses unavailable status provider and does not equate exceptions with success', async () => {
    const r = reader();
    r.status = vi.fn(async () => {
      throw new Error('unavailable');
    }) as unknown as CollectiveCloseoutReader['status'];
    await expect(assertCollectiveCloseoutReady('mission-483', contract, r)).rejects.toThrow(
      'provider unavailable/timeout',
    );
  });
  it('refuses absent roster for explicitly delegated mission', async () => {
    await expect(
      assertCollectiveCloseoutReady(
        'mission-483',
        {
          ...contract,
          requiredAgentExecutions: [],
        },
        reader(),
      ),
    ).rejects.toThrow('version-1 roster');
  });
  it('refuses duplicate provider execution IDs', async () => {
    await expect(
      assertCollectiveCloseoutReady(
        'mission-483',
        {
          ...contract,
          requiredAgentExecutions: [
            sofia,
            {
              ...emily,
              providerId: sofia.providerId,
              providerExecutionId: sofia.providerExecutionId,
            },
          ],
        },
        reader(),
      ),
    ).rejects.toThrow('duplicate provider execution');
  });
  it('rechecks after await and refuses an execution that becomes non-terminal', async () => {
    const r = reader();
    let calls = 0;
    r.status = vi.fn(async (h) => ({
      handle: makeHandle(h.runId === 'run-sofia' ? sofia : emily),
      lifecycle: ++calls === 2 ? 'RUNNING' : 'COMPLETED',
      observedAt: new Date().toISOString(),
      providerState: null,
      effectState: 'EFFECT_OBSERVED',
    })) as unknown as CollectiveCloseoutReader['status'];
    await expect(assertCollectiveCloseoutReady('mission-483', contract, r)).rejects.toThrow(
      'changed/unknown',
    );
  });
  it('refuses missing receiver ACK even with self-declared handoff verified', async () => {
    await expect(
      assertCollectiveCloseoutReady(
        'mission-483',
        contract,
        reader({}, (p) => receipt(p).filter((e) => e.metadata.receiptType !== 'HANDOFF_ACK')),
      ),
    ).rejects.toThrow('missing verified artifact/handoff');
  });

  it('refuses receiver ACK attached to the wrong handoff identity', async () => {
    await expect(
      assertCollectiveCloseoutReady(
        'mission-483',
        contract,
        reader({}, (p) =>
          receipt(p).map((e) =>
            e.metadata.receiptType === 'HANDOFF_ACK'
              ? { ...e, metadata: { ...e.metadata, handoffReceiptId: 'other-run' } }
              : e,
          ),
        ),
      ),
    ).rejects.toThrow('missing verified artifact/handoff');
  });

  it('rejects stale terminal provider observation (restart/replay)', async () => {
    const r = reader();
    r.status = vi.fn(async (h) => ({
      handle: makeHandle(h.runId === 'run-sofia' ? sofia : emily),
      lifecycle: 'COMPLETED' as const,
      observedAt: new Date(Date.now() - 180_000).toISOString(),
      providerState: null,
      effectState: 'EFFECT_OBSERVED' as const,
    }));
    await expect(assertCollectiveCloseoutReady('mission-483', contract, r)).rejects.toThrow(
      /Sofia/,
    );
  });

  it('rejects an incomplete roster (SOFIA omitted but EMILY completed)', async () => {
    await expect(
      assertCollectiveCloseoutReady(
        'mission-483',
        {
          ...contract,
          requiredAgentExecutions: [emily],
        },
        reader(),
      ),
    ).rejects.toThrow(/Sofia/);
  });

  it('rejects an unpinned roster revision change', async () => {
    await expect(
      assertCollectiveCloseoutReady(
        'mission-483',
        {
          ...contract,
          rosterRevision: 2,
        },
        reader(),
      ),
    ).rejects.toThrow('version-1 roster');
  });

  it('rejects a single selected agent with external/delegating skill without roster', async () => {
    await expect(
      assertCollectiveCloseoutReady('mission-483', {
        ...contract,
        selectedAgents: ['Mestre'],
        selectedSkills: ['MCF-EXECUTE-LOCAL-TEAM'],
        collectiveCloseoutRequired: false,
        rosterRevision: undefined,
        requiredAgentExecutions: undefined,
      }),
    ).rejects.toThrow('version-1 roster');
  });

  it('does not change legacy nondelegated mission behavior', async () => {
    await expect(
      assertCollectiveCloseoutReady('mission-483', {
        ...contract,
        collectiveCloseoutRequired: undefined,
        rosterRevision: undefined,
        requiredAgentExecutions: undefined,
        selectedAgents: ['Carmem'],
      }),
    ).resolves.toBeUndefined();
  });
});
