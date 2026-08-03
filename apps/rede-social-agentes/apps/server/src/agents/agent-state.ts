import type { AgentStatus } from '@rsa/contracts';

const allowedTransitions: Readonly<Record<AgentStatus, readonly AgentStatus[]>> = {
  DRAFT: ['ACTIVE', 'REVOKED'],
  ACTIVE: ['PAUSED', 'REVOKED'],
  PAUSED: ['ACTIVE', 'REVOKED'],
  SUSPENDED: [],
  REVOKED: [],
};

export function canResponsibleTransition(current: AgentStatus, target: AgentStatus): boolean {
  return allowedTransitions[current].includes(target);
}
