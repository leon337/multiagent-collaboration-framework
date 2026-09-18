import { describe, expect, it } from 'vitest';

import { ChatMissionPlanner } from './chat-mission-planner.js';

describe('ChatMissionPlanner local agent team', () => {
  it('does not infer local execution while the capability is disabled', () => {
    const plan = new ChatMissionPlanner(false, false).plan({
      objective: 'Use um time multiagente para revisar GitHub e segurança.',
    });
    expect(plan.steps.map((step) => step.skillId)).not.toContain('MCF-EXECUTE-LOCAL-TEAM');
  });

  it('routes multiagent work to the governed local team when enabled', () => {
    const plan = new ChatMissionPlanner(false, true).plan({
      objective: 'Use um time multiagente para revisar GitHub, segurança e testes.',
    });

    expect(plan.steps.map((step) => step.skillId)).toContain('MCF-EXECUTE-LOCAL-TEAM');
    expect(plan.contract.selectedAgents).toEqual(
      expect.arrayContaining(['Mestre', 'Gabriel', 'Ricardo', 'Renato', 'Beatriz']),
    );

    const step = plan.steps.find((candidate) => candidate.skillId === 'MCF-EXECUTE-LOCAL-TEAM');
    expect(step).toMatchObject({
      agentId: 'Mestre',
      toolProvider: 'local-agent-runtime',
      toolOperation: 'execute-agent-team',
      toolResource: 'mcf-agent-runtime',
      state: 'READY_EXTERNAL',
    });
  });
});
