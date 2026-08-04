import { describe, expect, it } from 'vitest';

import { parseMcfSkillRegistry } from './skill-registry.loader.js';

const registry = `
registry:
  name: MCF Skill Registry
skills:
  - skill_id: MCF-START-MISSION
    name: Iniciar missão
    version: 1.0.0
    purpose: Definir contrato e equipe.
    owner_agents: [Mestre]
    required_inputs: [objective]
    allowed_tools: [GitHub, Linear]
    forbidden_tools: [public_deployment]
    permission_profile: READ_AND_PROPOSE
    execution_steps: [classificar_missao, definir_contrato]
    required_evidence: [mission_id, acceptance_criteria]
    acceptance_criteria: [objective_verifiable]
    failure_modes: [objective_ambiguous]
    fallback: Executar somente descoberta.
    handoff_to: Miriam

  - skill_id: MCF-RUN-TESTS
    name: Executar testes
    version: 1.0.0
    purpose: Validar critérios.
    owner_agents: [Renato]
    required_inputs: [acceptance_criteria, test_target]
    allowed_tools: [GitHub]
    forbidden_tools: [fabricated_pass]
    permission_profile: SCOPED_WRITE
    execution_steps: [executar, coletar_evidencia]
    required_evidence: [logs]
    acceptance_criteria: [all_critical_tests_pass]
    failure_modes: [flaky_test]
    fallback: Registrar bloqueio.
    handoff_to: Emily
`;

describe('parseMcfSkillRegistry', () => {
  it('converts the repository YAML subset into executable skill contracts', () => {
    const skills = parseMcfSkillRegistry(registry);

    expect(skills).toHaveLength(2);
    expect(skills[0]).toMatchObject({
      skillId: 'MCF-START-MISSION',
      ownerAgents: ['Mestre'],
      permissionProfile: 'READ_AND_PROPOSE',
      handoffTo: 'Miriam',
    });
    expect(skills[1]?.requiredInputs).toEqual(['acceptance_criteria', 'test_target']);
  });

  it('rejects duplicate skill identifiers', () => {
    expect(() => parseMcfSkillRegistry(`${registry}\n${registry.split('skills:')[1] ?? ''}`)).toThrow(
      /Duplicate MCF skill id/u,
    );
  });
});
