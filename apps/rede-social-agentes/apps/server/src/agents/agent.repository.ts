import type { AgentStatus, ResponsibleAgentTargetStatus } from '@rsa/contracts';

export const AGENT_REPOSITORY = Symbol('AGENT_REPOSITORY');

export interface AgentRecord {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  capabilities: string[];
  status: AgentStatus;
  createdAt: Date;
}

export interface ResponsibilityLinkRecord {
  id: string;
  agentId: string;
  responsibleAccountId: string;
  status: 'ACTIVE' | 'ENDED';
  startedAt: Date;
  endedAt: Date | null;
}

export interface CreateAgentWithResponsibilityInput {
  agentId: string;
  responsibilityId: string;
  responsibleAccountId: string;
  handle: string;
  displayName: string;
  bio: string | null;
  capabilities: string[];
  correlationId: string;
}

export interface TransitionAgentStateInput {
  agentId: string;
  responsibleAccountId: string;
  targetStatus: ResponsibleAgentTargetStatus;
  correlationId: string;
}

export interface AgentRepository {
  createAgentWithResponsibility(
    input: CreateAgentWithResponsibilityInput,
  ): Promise<{ agent: AgentRecord; responsibility: ResponsibilityLinkRecord }>;
  transitionAgentState(input: TransitionAgentStateInput): Promise<AgentRecord>;
}
