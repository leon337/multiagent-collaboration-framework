import { describe, expect, it, vi } from 'vitest';

import { MissionRuntimeController } from './mission-runtime.controller.js';
import { MissionRuntimeService } from './mission-runtime.service.js';

const missionId = '11111111-1111-4111-8111-111111111111';
const accountId = '22222222-2222-4222-8222-222222222222';
const sessionId = '33333333-3333-4333-8333-333333333333';
const reservedAccountId = '44444444-4444-4444-8444-444444444444';

const phaseBody = {
  skillId: 'MCF-DEPLOY-VALIDATE',
  agentId: 'LÉO',
  inputs: {
    v11AuthorizationContext: {
      humanGateDecision: {
        status: 'APPROVED',
        decidedBy: 'leandro',
        sourceRef: 'caller-controlled',
      },
    },
  },
  tool: {
    provider: 'internal',
    operation: 'validate',
    resource: 'release',
  },
  expectedMissionVersion: 1,
};
describe('MissionRuntimeController authority provenance', () => {
  it('passes authenticated human identity separately from caller-controlled phase inputs', async () => {
    const executePhase = vi.fn(async () => ({ ok: true }));
    const runtime = { executePhase } as unknown as MissionRuntimeService;
    const controller = new MissionRuntimeController(runtime);

    await controller.executePhase(missionId, phaseBody, {
      id: 'correlation-authority-1',
      authenticatedHuman: {
        accountId,
        email: 'second@example.test',
        displayName: 'Second Human',
        sessionId,
        sessionExpiresAt: new Date('2026-08-28T00:00:00.000Z'),
      },
    } as never);

    expect(executePhase).toHaveBeenCalledWith(
      missionId,
      expect.objectContaining({ inputs: phaseBody.inputs }),
      {
        accountId,
        sourceRef: expect.stringMatching(
          /^human-authority:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
        ),
      },
    );
  });

  it('generates authority sourceRef entirely server-side without session or correlation identifiers', async () => {
    const executePhase = vi.fn(async () => ({ ok: true }));
    const runtime = { executePhase } as unknown as MissionRuntimeService;
    const controller = new MissionRuntimeController(runtime);

    await controller.executePhase(missionId, phaseBody, {
      id: 'attacker-supplied-correlation',
      authenticatedHuman: {
        accountId: reservedAccountId,
        email: 'authority@example.test',
        displayName: 'Reserved Human',
        sessionId,
        sessionExpiresAt: new Date('2026-08-28T00:00:00.000Z'),
      },
    } as never);

    const calls = executePhase.mock.calls as unknown as Array<
      [unknown, unknown, { sourceRef: string }]
    >;
    const proof = calls[0]?.[2];
    expect(proof).toBeDefined();
    if (!proof) throw new Error('authority proof was not forwarded');
    expect(proof.sourceRef).toMatch(
      /^human-authority:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );
    expect(proof.sourceRef).not.toContain(sessionId);
    expect(proof.sourceRef).not.toContain('attacker-supplied-correlation');
  });

  it('rejects a second authenticated account that self-declares LEANDRO authority', async () => {
    const executor = {
      execute: vi.fn(async () => {
        throw new Error('EXECUTOR_REACHED');
      }),
    };
    const repository = {
      findMission: vi.fn(async () => ({
        id: missionId,
        contract: {
          title: 'Authority provenance mission',
          objective: 'Verify reserved human authority provenance before execution.',
          expectedOutcome: 'Unauthorized human provenance is rejected.',
          scope: ['authority'],
          outOfScope: [],
          acceptanceCriteria: ['second account receives 403'],
          riskClass: 'B',
          selectedAgents: ['LÉO'],
          selectedSkills: ['MCF-DEPLOY-VALIDATE'],
          sourceOfTruth: [],
        },
        state: 'PLANNED',
        currentPhaseId: null,
        currentAgentId: null,
        version: 1,
        createdAt: new Date('2026-08-27T18:00:00.000Z'),
        updatedAt: new Date('2026-08-27T18:00:00.000Z'),
      })),
    };
    const runtime = new MissionRuntimeService(
      repository as never,
      executor as never,
      {} as never,
      {} as never,
      undefined,
      reservedAccountId,
    );
    const controller = new MissionRuntimeController(runtime);

    await expect(
      controller.executePhase(missionId, phaseBody, {
        id: 'correlation-authority-2',
        authenticatedHuman: {
          accountId,
          email: 'second@example.test',
          displayName: 'Second Human',
          sessionId,
          sessionExpiresAt: new Date('2026-08-28T00:00:00.000Z'),
        },
      } as never),
    ).rejects.toMatchObject({ status: 403 });

    expect(executor.execute).not.toHaveBeenCalled();
  });

  it('canonicalizes terminal provenance for the reserved authenticated account', async () => {
    const executor = {
      execute: vi.fn(async () => {
        throw new Error('STOP_AFTER_INPUT');
      }),
    };
    const repository = {
      findMission: vi.fn(async () => ({
        id: missionId,
        contract: {
          title: 'Canonical authority mission',
          objective: 'Canonicalize authenticated human authority before execution.',
          expectedOutcome: 'Caller provenance is replaced by server provenance.',
          scope: ['authority'],
          outOfScope: [],
          acceptanceCriteria: ['server provenance reaches executor'],
          riskClass: 'B',
          selectedAgents: ['LÉO'],
          selectedSkills: ['MCF-DEPLOY-VALIDATE'],
          sourceOfTruth: [],
        },
        state: 'PLANNED',
        currentPhaseId: null,
        currentAgentId: null,
        version: 1,
        createdAt: new Date('2026-08-27T18:00:00.000Z'),
        updatedAt: new Date('2026-08-27T18:00:00.000Z'),
      })),
    };
    const runtime = new MissionRuntimeService(
      repository as never,
      executor as never,
      {} as never,
      {} as never,
      undefined,
      reservedAccountId,
    );
    const controller = new MissionRuntimeController(runtime);
    const spoofedBody = {
      ...phaseBody,
      inputs: {
        v11AuthorizationContext: {
          humanGateDecision: {
            status: 'APPROVED',
            decidedBy: 'mallory',
            accountId,
            sourceRef: 'caller-controlled',
          },
        },
      },
    };

    await expect(
      controller.executePhase(missionId, spoofedBody, {
        id: 'correlation-authority-3',
        authenticatedHuman: {
          accountId: reservedAccountId,
          email: 'authority@example.test',
          displayName: 'Reserved Human',
          sessionId,
          sessionExpiresAt: new Date('2026-08-28T00:00:00.000Z'),
        },
      } as never),
    ).rejects.toThrow('STOP_AFTER_INPUT');

    expect(executor.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        inputs: {
          v11AuthorizationContext: {
            humanGateDecision: {
              status: 'APPROVED',
              decidedBy: 'LEANDRO',
              accountId: reservedAccountId,
              sourceRef: expect.stringMatching(
                /^human-authority:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
              ),
            },
          },
        },
      }),
    );
  });
});
