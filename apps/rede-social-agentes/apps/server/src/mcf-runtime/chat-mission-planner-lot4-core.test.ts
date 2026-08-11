import { describe, expect, it } from 'vitest';

import { ChatMissionPlanner } from './chat-mission-planner.js';

describe('ChatMissionPlanner Lot 4 core skills', () => {
  const planner = new ChatMissionPlanner();

  it('plans requested internal domain skills as agent work instead of automatic bootstrap', () => {
    const plan = planner.plan({
      objective: 'Recuperar o checkpoint, definir produto, desenhar experiência e arquitetura.',
      requestedRiskClass: 'C',
      requestedSkills: [
        'MCF-RECOVER-CONTEXT',
        'MCF-DEFINE-PRODUCT',
        'MCF-DESIGN-EXPERIENCE',
        'MCF-DESIGN-ARCHITECTURE',
      ],
    });

    expect(plan.contract.selectedSkills).toEqual([
      'MCF-START-MISSION',
      'MCF-SELECT-AGENTS',
      'MCF-RECOVER-CONTEXT',
      'MCF-DEFINE-PRODUCT',
      'MCF-DESIGN-EXPERIENCE',
      'MCF-DESIGN-ARCHITECTURE',
      'MCF-TRACE-MISSION',
    ]);
    expect(plan.steps.slice(2, 6).every((step) => step.state === 'READY_AGENT')).toBe(true);
    expect(plan.steps.slice(2, 6).every((step) => step.toolProvider === 'internal')).toBe(true);
    expect(plan.steps[1]).toMatchObject({
      skillId: 'MCF-SELECT-AGENTS',
      handoffTo: 'Miriam',
      state: 'PLANNED_INTERNAL',
    });
    expect(plan.steps[2]).toMatchObject({
      skillId: 'MCF-RECOVER-CONTEXT',
      agentId: 'Miriam',
      handoffTo: 'Mestre',
      toolOperation: 'inspect-context',
      toolResource: 'mcf-agent-runtime',
    });
    expect(plan.steps[3]).toMatchObject({
      skillId: 'MCF-DEFINE-PRODUCT',
      agentId: 'Leonardo',
      handoffTo: 'Sofia',
      toolOperation: 'plan-product',
    });
    expect(plan.steps[4]).toMatchObject({
      skillId: 'MCF-DESIGN-EXPERIENCE',
      agentId: 'Evelyn',
      handoffTo: 'Sofia',
      toolOperation: 'design-experience',
    });
    expect(plan.steps[5]).toMatchObject({
      skillId: 'MCF-DESIGN-ARCHITECTURE',
      agentId: 'Sofia',
      handoffTo: 'Rafael',
      toolOperation: 'design-architecture',
    });
    expect(plan.contract.selectedAgents).not.toContain('Leandro');
  });
});
