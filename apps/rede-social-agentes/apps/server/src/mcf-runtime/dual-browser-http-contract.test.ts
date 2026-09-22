import { describe, expect, it, vi } from 'vitest';

import type { FastifyRequest } from 'fastify';

import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { ChatRuntimeBridgeController } from './chat-runtime-bridge.controller.js';
import type { ChatRuntimeBridgeService } from './chat-runtime-bridge.service.js';
import { MissionControlController } from './mission-control.controller.js';
import type { MissionControlService } from './mission-control.service.js';

describe('Dual Browser HTTP skill contract', () => {
  it('accepts MCF-OPERATE-DUAL-BROWSER through the authenticated chat bridge', async () => {
    const dispatch = vi.fn(async () => ({
      missionCreated: false,
      humanActionRequired: true,
      gate: 'HUMAN_CONTROL' as const,
      executionPaused: true as const,
      nextAction: 'HUMAN_GATE' as const,
      resumeRequiresExplicitHumanInstruction: true as const,
      lastCompletedAction: null,
      actionInFlight: null,
      preservedState: {},
      evidence: [],
      surface: 'test',
      automationChannel: null,
    }));
    const controller = new ChatRuntimeBridgeController({
      dispatch,
    } as unknown as ChatRuntimeBridgeService);

    await controller.dispatch(
      {
        objective: 'Operar o Workspace do MESTRE no dual browser.',
        requestedSkills: ['MCF-OPERATE-DUAL-BROWSER'],
      },
      {
        id: 'corr-chat',
        authenticatedHuman: {
          accountId: '11111111-1111-4111-8111-111111111111',
        },
      } as unknown as AuthenticatedHumanRequest,
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedSkills: ['MCF-OPERATE-DUAL-BROWSER'],
      }),
      {
        authenticatedAccountId: '11111111-1111-4111-8111-111111111111',
      },
    );
  });

  it('accepts MCF-OPERATE-DUAL-BROWSER through Mission Control dispatch', async () => {
    const dispatch = vi.fn(async (input: unknown) => input);
    const controller = new MissionControlController({
      dispatch,
    } as unknown as MissionControlService);

    await controller.dispatch(
      {
        objective: 'Operar o Workspace do MESTRE no dual browser.',
        repository: 'leon337/multiagent-collaboration-framework',
        requestedSkills: ['MCF-OPERATE-DUAL-BROWSER'],
      },
      { id: 'corr-control' } as FastifyRequest,
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedSkills: ['MCF-OPERATE-DUAL-BROWSER'],
      }),
    );
  });
});
