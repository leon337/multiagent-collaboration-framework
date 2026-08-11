import { describe, expect, it } from 'vitest';

import { ChatMissionPlanner } from './chat-mission-planner.js';

describe('ChatMissionPlanner Lot 4B MCF-EVALUATE-AGENTS', () => {
  it('infers agent evaluation as READY_AGENT owned by Beatriz', () => {
    const plan = new ChatMissionPlanner().plan({
      objective: 'Avaliar agentes com benchmark e scorecard reproduzível.',
    });

    const evaluation = plan.steps.find((step) => step.skillId === 'MCF-EVALUATE-AGENTS');
    expect(evaluation).toMatchObject({
      agentId: 'Beatriz',
      handoffTo: 'Emily',
      toolProvider: 'internal',
      toolOperation: 'evaluate-agents',
      toolResource: 'mcf-agent-runtime',
      state: 'READY_AGENT',
      requiredEvidence: ['test_cases', 'scores', 'regressions'],
    });
    expect(plan.contract.selectedSkills).toContain('MCF-EVALUATE-AGENTS');
  });

  it('keeps explicitly requested evaluation governed by the same READY_AGENT contract', () => {
    const plan = new ChatMissionPlanner().plan({
      objective: 'Run the requested evaluation.',
      requestedSkills: ['MCF-EVALUATE-AGENTS'],
    });

    const evaluation = plan.steps.find((step) => step.skillId === 'MCF-EVALUATE-AGENTS');
    expect(evaluation?.state).toBe('READY_AGENT');
    expect(evaluation?.agentId).toBe('Beatriz');
  });
});
