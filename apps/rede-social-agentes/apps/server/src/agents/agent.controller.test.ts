import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import {
  ActiveResponsibilityRequiredError,
  AgentNotFoundError,
} from './agent.errors.js';
import { AgentController } from './agent.controller.js';
import type { AgentService } from './agent.service.js';

function requestWithHuman(correlationId: string): AuthenticatedHumanRequest {
  return {
    id: correlationId,
    authenticatedHuman: {
      accountId: 'account-1',
      email: 'human@example.test',
      displayName: 'Human',
      sessionId: 'session-1',
      sessionExpiresAt: new Date(Date.now() + 60_000),
    },
  } as unknown as AuthenticatedHumanRequest;
}

async function captureRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    return new Error('Expected the promise to reject.');
  } catch (error) {
    return error;
  }
}

describe('AgentController', () => {
  it.each([
    ['missing agent', new AgentNotFoundError()],
    ['agent without active responsibility', new ActiveResponsibilityRequiredError()],
  ])('returns the same public response for %s', async (_scenario, domainError) => {
    const agents = {
      changeState: vi.fn().mockRejectedValue(domainError),
    } as unknown as AgentService;
    const controller = new AgentController(agents);
    const request = requestWithHuman('correlation-agent-lookup');

    const error = await captureRejection(
      controller.changeState('agent-1', { status: 'ACTIVE' }, request),
    );

    expect(error).toBeInstanceOf(NotFoundException);
    if (!(error instanceof NotFoundException)) {
      throw error;
    }
    expect(error.getResponse()).toEqual({
      code: 'AGENT_NOT_FOUND',
      message: 'The agent profile was not found.',
      correlationId: 'correlation-agent-lookup',
    });
  });
});
