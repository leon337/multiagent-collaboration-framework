import { describe, expect, it } from 'vitest';

import { ChatMissionPlanner } from './chat-mission-planner.js';

describe('ChatMissionPlanner MCF-OPERATE-DUAL-BROWSER', () => {
  it('infers the Dual Browser skill as READY_AGENT with a Class B risk floor', () => {
    const plan = new ChatMissionPlanner().plan({
      objective: 'Operar o Workspace do MESTRE no dual browser e capturar o workspace.',
    });

    const step = plan.steps.find((item) => item.skillId === 'MCF-OPERATE-DUAL-BROWSER');
    expect(step).toMatchObject({
      agentId: 'Mestre',
      handoffTo: 'Beatriz',
      toolProvider: 'internal',
      toolOperation: 'operate-dual-browser',
      toolResource: 'mcf-dual-browser-cockpit',
      state: 'READY_AGENT',
    });
    expect(step?.requiredEvidence).toEqual([
      'target_instance',
      'interaction_policy',
      'actions_performed',
      'capture_evidence',
      'privacy_disposition',
      'human_gate_state',
    ]);
    expect(plan.contract.selectedSkills).toContain('MCF-OPERATE-DUAL-BROWSER');
    expect(plan.contract.riskClass).toBe('B');
  });

  it('keeps an explicitly requested Dual Browser operation at Class B or higher', () => {
    const plan = new ChatMissionPlanner().plan({
      objective: 'Use the authorized cockpit surface.',
      requestedRiskClass: 'A',
      requestedSkills: ['MCF-OPERATE-DUAL-BROWSER'],
    });

    const step = plan.steps.find((item) => item.skillId === 'MCF-OPERATE-DUAL-BROWSER');
    expect(step?.state).toBe('READY_AGENT');
    expect(step?.agentId).toBe('Mestre');
    expect(plan.contract.riskClass).toBe('B');
  });
});
