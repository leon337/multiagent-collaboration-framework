import { describe, expect, it } from 'vitest';

import { ChatMissionPlanner } from './chat-mission-planner.js';

describe('ChatMissionPlanner', () => {
  const planner = new ChatMissionPlanner();

  it('creates a planning-only mission for a neutral objective', () => {
    const plan = planner.plan({
      objective: 'Definir o escopo da próxima evolução controlada do framework.',
    });

    expect(plan.contract.riskClass).toBe('A');
    expect(plan.contract.selectedSkills).toEqual(['MCF-START-MISSION']);
    expect(plan.contract.selectedAgents).toEqual(['Mestre']);
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]?.state).toBe('COMPLETED');
  });

  it('selects implementation and validation for repository changes', () => {
    const plan = planner.plan({
      objective: 'Implementar uma ponte segura entre o chat e o runtime.',
      repository: 'leon337/multiagent-collaboration-framework',
    });

    expect(plan.contract.riskClass).toBe('B');
    expect(plan.contract.selectedSkills).toEqual([
      'MCF-START-MISSION',
      'MCF-IMPLEMENT-CHANGE',
      'MCF-RUN-TESTS',
    ]);
    expect(plan.contract.selectedAgents).toEqual(['Mestre', 'Rafael', 'Renato']);
    expect(plan.steps[1]).toMatchObject({
      agentId: 'Rafael',
      state: 'READY_EXTERNAL',
      toolProvider: 'github',
    });
  });

  it('selects validation without implementation for a test-only objective', () => {
    const plan = planner.plan({
      objective: 'Validar o runtime e executar um smoke test autenticado.',
    });

    expect(plan.contract.selectedSkills).toEqual(['MCF-START-MISSION', 'MCF-RUN-TESTS']);
    expect(plan.contract.selectedAgents).toEqual(['Mestre', 'Renato']);
  });

  it('classifies public or destructive work as risk class C', () => {
    const plan = planner.plan({
      objective: 'Publicar em produção e rotacionar o segredo do serviço.',
    });

    expect(plan.contract.riskClass).toBe('C');
  });

  it('never selects Leandro as an executing agent', () => {
    const plan = planner.plan({
      objective: 'Implementar, testar e validar uma alteração no repositório.',
      repository: 'leon337/multiagent-collaboration-framework',
      requestedSkills: ['MCF-IMPLEMENT-CHANGE', 'MCF-RUN-TESTS'],
    });

    expect(plan.contract.selectedAgents).not.toContain('Leandro');
    expect(plan.contract.outOfScope).toContain('human-as-technical-operator');
  });
});
