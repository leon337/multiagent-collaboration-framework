import { describe, expect, it } from 'vitest';

import { ChatMissionPlanner } from './chat-mission-planner.js';

describe('ChatMissionPlanner Lot 4E MCF-CLOSE-PHASE', () => {
  it('infers close phase as Class C READY_AGENT owned by Carmem with Mestre handoff', () => {
    const plan = new ChatMissionPlanner().plan({
      objective: 'Fechar fase com rastreabilidade e emitir checkpoint verdadeiro.',
      requestedRiskClass: 'A',
    });

    const close = plan.steps.find((step) => step.skillId === 'MCF-CLOSE-PHASE');
    expect(close).toMatchObject({
      agentId: 'Carmem',
      handoffTo: 'Mestre',
      toolProvider: 'internal',
      toolOperation: 'close-phase',
      toolResource: 'mcf-agent-runtime',
      state: 'READY_AGENT',
      requiredEvidence: ['phase_pack', 'audit_verdict', 'leo_decision', 'checkpoint'],
    });
    expect(plan.contract.riskClass).toBe('C');
    expect(plan.contract.selectedAgents).not.toContain('Leandro');
  });

  it('keeps explicit close-phase routing governed by READY_AGENT', () => {
    const plan = new ChatMissionPlanner().plan({
      objective: 'Consolidar o fechamento desta fase.',
      requestedSkills: ['MCF-CLOSE-PHASE'],
    });

    const close = plan.steps.find((step) => step.skillId === 'MCF-CLOSE-PHASE');
    expect(close?.state).toBe('READY_AGENT');
    expect(close?.agentId).toBe('Carmem');
    expect(close?.handoffTo).toBe('Mestre');
    expect(plan.contract.riskClass).toBe('C');
  });

  it('does not auto-complete the closeout in the bridge', () => {
    const plan = new ChatMissionPlanner().plan({ objective: 'Encerrar fase com checkpoint.' });
    const close = plan.steps.find((step) => step.skillId === 'MCF-CLOSE-PHASE');
    const autoExecuted = plan.steps.filter((step) => step.state === 'PLANNED_INTERNAL');

    expect(close?.state).toBe('READY_AGENT');
    expect(autoExecuted.map((step) => step.skillId)).not.toContain('MCF-CLOSE-PHASE');
  });

  it('does not steal explicit debug incident routing', () => {
    const plan = new ChatMissionPlanner().plan({
      objective: 'Diagnosticar incidente e localizar a causa raiz.',
    });

    expect(plan.contract.selectedSkills).toContain('MCF-DEBUG-INCIDENT');
    expect(plan.contract.selectedSkills).not.toContain('MCF-CLOSE-PHASE');
  });
});
