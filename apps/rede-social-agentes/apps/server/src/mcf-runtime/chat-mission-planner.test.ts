import { describe, expect, it } from 'vitest';

import { ChatMissionPlanner } from './chat-mission-planner.js';

describe('ChatMissionPlanner', () => {
  const planner = new ChatMissionPlanner();

  it('creates an internal startup and selection block for a neutral objective', () => {
    const plan = planner.plan({
      objective: 'Definir o escopo da próxima evolução controlada do framework.',
    });

    expect(plan.contract.riskClass).toBe('A');
    expect(plan.contract.selectedSkills).toEqual([
      'MCF-START-MISSION',
      'MCF-SELECT-AGENTS',
    ]);
    expect(plan.contract.selectedAgents).toEqual(['Mestre', 'Miriam']);
    expect(plan.steps).toHaveLength(2);
    expect(plan.steps.every((step) => step.state === 'PLANNED_INTERNAL')).toBe(true);
    expect(plan.steps[1]).toMatchObject({
      skillId: 'MCF-SELECT-AGENTS',
      handoffTo: 'Mestre',
    });
  });

  it('selects implementation, review, validation, PR control and trace for repository changes', () => {
    const plan = planner.plan({
      objective: 'Implementar uma ponte segura entre o chat e o runtime.',
      repository: 'leon337/multiagent-collaboration-framework',
    });

    expect(plan.contract.riskClass).toBe('B');
    expect(plan.contract.selectedSkills).toEqual([
      'MCF-START-MISSION',
      'MCF-SELECT-AGENTS',
      'MCF-IMPLEMENT-CHANGE',
      'MCF-REVIEW-CODE',
      'MCF-RUN-TESTS',
      'MCF-GIT-PR-RELEASE',
      'MCF-TRACE-MISSION',
    ]);
    expect(plan.contract.selectedAgents).toEqual([
      'Mestre',
      'Miriam',
      'Rafael',
      'Vinicius',
      'Renato',
      'Emily',
      'Gabriel',
      'Augusto',
      'Beatriz',
    ]);
    expect(plan.steps[1]).toMatchObject({
      agentId: 'Mestre',
      handoffTo: 'Rafael',
      state: 'PLANNED_INTERNAL',
      toolProvider: 'internal',
    });
    expect(plan.steps[2]).toMatchObject({
      agentId: 'Rafael',
      handoffTo: 'Vinicius',
      state: 'READY_EXTERNAL',
      toolProvider: 'github',
    });
    expect(plan.steps.at(-1)).toMatchObject({
      skillId: 'MCF-TRACE-MISSION',
      state: 'PLANNED_INTERNAL',
    });
  });

  it('selects validation and a deferred trace without implementation', () => {
    const plan = planner.plan({
      objective: 'Validar o runtime e executar um smoke test autenticado.',
    });

    expect(plan.contract.selectedSkills).toEqual([
      'MCF-START-MISSION',
      'MCF-SELECT-AGENTS',
      'MCF-RUN-TESTS',
      'MCF-TRACE-MISSION',
    ]);
    expect(plan.contract.selectedAgents).toEqual([
      'Mestre',
      'Miriam',
      'Renato',
      'Emily',
      'Augusto',
      'Beatriz',
    ]);
  });

  it('selects deployment validation only when the objective requires an environment action', () => {
    const plan = planner.plan({
      objective: 'Executar deploy no ambiente de staging e validar rollback.',
      repository: 'leon337/multiagent-collaboration-framework',
    });

    expect(plan.contract.selectedSkills).toEqual([
      'MCF-START-MISSION',
      'MCF-SELECT-AGENTS',
      'MCF-DEPLOY-VALIDATE',
      'MCF-TRACE-MISSION',
    ]);
    expect(plan.steps[2]).toMatchObject({
      skillId: 'MCF-DEPLOY-VALIDATE',
      agentId: 'Bruno',
      handoffTo: 'Augusto',
      toolProvider: 'render',
      state: 'READY_EXTERNAL',
    });
  });

  it('classifies public or destructive work as risk class C', () => {
    const plan = planner.plan({
      objective: 'Publicar em produção e rotacionar o segredo do serviço.',
    });

    expect(plan.contract.riskClass).toBe('C');
  });

  it('does not allow a requested class to reduce inferred risk', () => {
    const destructive = planner.plan({
      objective: 'Excluir dados de produção e rotacionar um segredo.',
      requestedRiskClass: 'A',
    });
    const implementation = planner.plan({
      objective: 'Implementar uma alteração controlada no repositório.',
      requestedRiskClass: 'A',
    });
    const elevated = planner.plan({
      objective: 'Documentar a próxima fase do framework.',
      requestedRiskClass: 'C',
    });

    expect(destructive.contract.riskClass).toBe('C');
    expect(implementation.contract.riskClass).toBe('B');
    expect(elevated.contract.riskClass).toBe('C');
  });

  it('accepts explicit executable skills while preserving mandatory startup and selection', () => {
    const plan = planner.plan({
      objective: 'Revisar uma alteração e preparar o pull request.',
      repository: 'leon337/multiagent-collaboration-framework',
      requestedSkills: ['MCF-REVIEW-CODE', 'MCF-GIT-PR-RELEASE'],
    });

    expect(plan.contract.selectedSkills).toEqual([
      'MCF-START-MISSION',
      'MCF-SELECT-AGENTS',
      'MCF-REVIEW-CODE',
      'MCF-GIT-PR-RELEASE',
    ]);
    expect(plan.steps[1]?.handoffTo).toBe('Vinicius');
  });

  it('never selects Leandro as an executing or handoff agent', () => {
    const plan = planner.plan({
      objective: 'Implementar, testar e validar uma alteração no repositório.',
      repository: 'leon337/multiagent-collaboration-framework',
    });

    expect(plan.contract.selectedAgents).not.toContain('Leandro');
    expect(plan.contract.outOfScope).toContain('human-as-technical-operator');
  });
});
