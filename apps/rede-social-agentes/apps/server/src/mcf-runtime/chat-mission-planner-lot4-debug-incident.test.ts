import { describe, expect, it } from 'vitest';

import { ChatMissionPlanner } from './chat-mission-planner.js';

describe('ChatMissionPlanner Lot 4D MCF-DEBUG-INCIDENT', () => {
  it('infers debug incident as READY_AGENT owned by Patricia with Renato handoff', () => {
    const plan = new ChatMissionPlanner().plan({
      objective: 'Diagnosticar incidente, localizar a causa raiz e validar a recuperação.',
    });

    const debug = plan.steps.find((step) => step.skillId === 'MCF-DEBUG-INCIDENT');
    expect(debug).toMatchObject({
      agentId: 'Patricia',
      handoffTo: 'Renato',
      toolProvider: 'internal',
      toolOperation: 'inspect-debug-incident',
      toolResource: 'mcf-agent-runtime',
      state: 'READY_AGENT',
      requiredEvidence: ['reproduction', 'root_cause', 'recovery_result'],
    });
    expect(plan.contract.selectedSkills).toContain('MCF-DEBUG-INCIDENT');
  });

  it('keeps explicitly requested debug incident governed by READY_AGENT', () => {
    const plan = new ChatMissionPlanner().plan({
      objective: 'Investigar a falha observada.',
      requestedSkills: ['MCF-DEBUG-INCIDENT'],
    });

    const debug = plan.steps.find((step) => step.skillId === 'MCF-DEBUG-INCIDENT');
    expect(debug?.state).toBe('READY_AGENT');
    expect(debug?.agentId).toBe('Patricia');
    expect(debug?.handoffTo).toBe('Renato');
  });

  it('does not mark debug incident as bridge-internal auto execution', () => {
    const plan = new ChatMissionPlanner().plan({
      objective: 'Debug do incidente de timeout.',
    });

    const debug = plan.steps.find((step) => step.skillId === 'MCF-DEBUG-INCIDENT');
    const autoExecuted = plan.steps.filter((step) => step.state === 'PLANNED_INTERNAL');

    expect(debug?.state).toBe('READY_AGENT');
    expect(autoExecuted.map((step) => step.skillId)).not.toContain('MCF-DEBUG-INCIDENT');
  });
});
