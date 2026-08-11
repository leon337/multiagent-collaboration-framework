import { describe, expect, it } from 'vitest';

import { ChatMissionPlanner } from './chat-mission-planner.js';

describe('ChatMissionPlanner Lot 4C MCF-SECURITY-REVIEW', () => {
  it('infers security review as READY_AGENT owned by Ricardo', () => {
    const plan = new ChatMissionPlanner().plan({
      objective: 'Executar revisão de segurança e threat model da mudança.',
    });

    const security = plan.steps.find((step) => step.skillId === 'MCF-SECURITY-REVIEW');
    expect(security).toMatchObject({
      agentId: 'Ricardo',
      handoffTo: 'Emily',
      toolProvider: 'internal',
      toolOperation: 'inspect-security-review',
      toolResource: 'mcf-agent-runtime',
      state: 'READY_AGENT',
      requiredEvidence: ['threats', 'controls', 'residual_risk'],
    });
    expect(plan.contract.selectedSkills).toContain('MCF-SECURITY-REVIEW');
  });

  it('keeps explicitly requested security review governed by READY_AGENT', () => {
    const plan = new ChatMissionPlanner().plan({
      objective: 'Run the requested security review.',
      requestedSkills: ['MCF-SECURITY-REVIEW'],
    });

    const security = plan.steps.find((step) => step.skillId === 'MCF-SECURITY-REVIEW');
    expect(security?.state).toBe('READY_AGENT');
    expect(security?.agentId).toBe('Ricardo');
  });
});
