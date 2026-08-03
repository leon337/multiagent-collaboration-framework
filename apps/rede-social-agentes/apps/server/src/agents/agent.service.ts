import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  AgentProfileResponse,
  AgentStatus,
  CreateAgentRequest,
  CreateAgentResponse,
} from '@rsa/contracts';

import {
  AGENT_REPOSITORY,
  type AgentRecord,
  type AgentRepository,
  type ResponsibilityLinkRecord,
} from './agent.repository.js';

function normalizeCapabilities(capabilities: string[]): string[] {
  return [...new Set(capabilities.map((capability) => capability.trim()).filter(Boolean))];
}

function toAgentResponse(agent: AgentRecord): AgentProfileResponse {
  return {
    id: agent.id,
    handle: agent.handle,
    displayName: agent.displayName,
    bio: agent.bio,
    capabilities: agent.capabilities,
    status: agent.status,
    createdAt: agent.createdAt.toISOString(),
  };
}

function toResponsibilityResponse(responsibility: ResponsibilityLinkRecord) {
  return {
    id: responsibility.id,
    agentId: responsibility.agentId,
    responsibleAccountId: responsibility.responsibleAccountId,
    status: responsibility.status,
    startedAt: responsibility.startedAt.toISOString(),
    endedAt: responsibility.endedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class AgentService {
  constructor(@Inject(AGENT_REPOSITORY) private readonly repository: AgentRepository) {}

  async createAgent(
    request: CreateAgentRequest,
    responsibleAccountId: string,
    correlationId: string,
  ): Promise<CreateAgentResponse> {
    const created = await this.repository.createAgentWithResponsibility({
      agentId: randomUUID(),
      responsibilityId: randomUUID(),
      responsibleAccountId,
      handle: request.handle.trim().toLowerCase(),
      displayName: request.displayName.trim(),
      bio: request.bio?.trim() || null,
      capabilities: normalizeCapabilities(request.capabilities),
      correlationId,
    });

    return {
      agent: toAgentResponse(created.agent),
      responsibility: toResponsibilityResponse(created.responsibility),
    };
  }

  async changeState(
    agentId: string,
    targetStatus: AgentStatus,
    responsibleAccountId: string,
    correlationId: string,
  ): Promise<AgentProfileResponse> {
    const agent = await this.repository.transitionAgentState({
      agentId,
      targetStatus,
      responsibleAccountId,
      correlationId,
    });

    return toAgentResponse(agent);
  }
}
