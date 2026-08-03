import { describe, expect, it } from 'vitest';

import type {
  AgentRecord,
  AgentRepository,
  CreateAgentWithResponsibilityInput,
  ResponsibilityLinkRecord,
  TransitionAgentStateInput,
} from './agent.repository.js';
import { AgentService } from './agent.service.js';

class MemoryAgentRepository implements AgentRepository {
  createdInput: CreateAgentWithResponsibilityInput | null = null;
  transitionInput: TransitionAgentStateInput | null = null;

  async createAgentWithResponsibility(input: CreateAgentWithResponsibilityInput) {
    this.createdInput = input;
    const agent: AgentRecord = {
      id: input.agentId,
      handle: input.handle,
      displayName: input.displayName,
      bio: input.bio,
      capabilities: input.capabilities,
      status: 'DRAFT',
      createdAt: new Date('2026-08-02T21:36:00-03:00'),
    };
    const responsibility: ResponsibilityLinkRecord = {
      id: input.responsibilityId,
      agentId: input.agentId,
      responsibleAccountId: input.responsibleAccountId,
      status: 'ACTIVE',
      startedAt: new Date('2026-08-02T21:36:00-03:00'),
      endedAt: null,
    };
    return { agent, responsibility };
  }

  async transitionAgentState(input: TransitionAgentStateInput): Promise<AgentRecord> {
    this.transitionInput = input;
    return {
      id: input.agentId,
      handle: 'agent_one',
      displayName: 'Agent One',
      bio: null,
      capabilities: ['analysis'],
      status: input.targetStatus,
      createdAt: new Date('2026-08-02T21:36:00-03:00'),
    };
  }
}

describe('AgentService', () => {
  it('normalizes the handle, profile text and capabilities', async () => {
    const repository = new MemoryAgentRepository();
    const service = new AgentService(repository);

    const created = await service.createAgent(
      {
        handle: '  agent_one  ',
        displayName: '  Agent One  ',
        bio: '  A supervised agent.  ',
        capabilities: [' analysis ', 'analysis', ' planning '],
      },
      'account-1',
      'correlation-create',
    );

    expect(repository.createdInput).toMatchObject({
      handle: 'agent_one',
      displayName: 'Agent One',
      bio: 'A supervised agent.',
      capabilities: ['analysis', 'planning'],
      responsibleAccountId: 'account-1',
    });
    expect(created.agent.status).toBe('DRAFT');
    expect(created.responsibility.status).toBe('ACTIVE');
  });

  it('passes the responsible account to state transitions', async () => {
    const repository = new MemoryAgentRepository();
    const service = new AgentService(repository);

    const agent = await service.changeState(
      'agent-1',
      'ACTIVE',
      'account-1',
      'correlation-state',
    );

    expect(repository.transitionInput).toEqual({
      agentId: 'agent-1',
      targetStatus: 'ACTIVE',
      responsibleAccountId: 'account-1',
      correlationId: 'correlation-state',
    });
    expect(agent.status).toBe('ACTIVE');
  });
});
