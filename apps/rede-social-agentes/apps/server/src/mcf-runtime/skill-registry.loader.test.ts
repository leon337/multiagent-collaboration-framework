import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

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

  it('excludes explicitly experimental contracts from executable skills', async () => {
    const experimental = `
  - skill_id: MCF-EXPERIMENTAL-PILOT
    status: EXPERIMENTAL
    name: Experimental pilot
    version: 0.1.0
    purpose: Qualification only.
    owner_agents: [Mestre]
    required_inputs: []
    allowed_tools: [GitHub]
    forbidden_tools: [production]
    permission_profile: READ_AND_PROPOSE
    execution_steps: [qualify]
    required_evidence: [qualification]
    acceptance_criteria: [qualification_passed]
    failure_modes: [qualification_failed]
    fallback: Keep experimental.
    handoff_to: Mestre
`;
    const skills = parseMcfSkillRegistry(`${registry}${experimental}`);

    expect(skills.some((skill) => skill.skillId === 'MCF-EXPERIMENTAL-PILOT')).toBe(false);
  });

  it('does not expose the full-stack orchestration contract as an executable skill', async () => {
    const registryPath = resolve(process.cwd(), '../../../../skills/registry.yaml');
    const content = await readFile(registryPath, 'utf8');
    const skills = parseMcfSkillRegistry(content);

    expect(content).toContain('skill_id: MCF-FULLSTACK-VISUAL-DEVELOPMENT');
    expect(content).toContain('status: EXPERIMENTAL');
    expect(skills.some((skill) => skill.skillId === 'MCF-FULLSTACK-VISUAL-DEVELOPMENT')).toBe(
      false,
    );
  });

  it('loads the reusable visual desktop audit skill from the canonical registry', async () => {
    const registryPath = resolve(process.cwd(), '../../../../skills/registry.yaml');
    const content = await readFile(registryPath, 'utf8');
    const skills = parseMcfSkillRegistry(content);

    expect(skills.find((skill) => skill.skillId === 'MCF-AUDIT-VISUAL-DESKTOP')).toMatchObject({
      ownerAgents: ['Augusto', 'Beatriz'],
      permissionProfile: 'SCOPED_WRITE',
      requiredInputs: ['audit_request', 'requested_unit', 'output_directory', 'authorizedScope'],
      handoffTo: 'Beatriz',
    });
  });

  it('loads the canonical implementation skill as patch evidence with a test handoff', async () => {
    const registryPath = resolve(process.cwd(), '../../../../skills/registry.yaml');
    const content = await readFile(registryPath, 'utf8');
    const skills = parseMcfSkillRegistry(content);
    const implementation = skills.find((skill) => skill.skillId === 'MCF-IMPLEMENT-CHANGE');

    expect(implementation).toMatchObject({
      requiredInputs: ['approved_scope', 'acceptance_criteria', 'repository', 'allowed_paths'],
      requiredEvidence: [
        'changed_files',
        'base_commit_sha',
        'diff_digest',
        'test_results_or_handoff',
      ],
      acceptanceCriteria: ['scope_respected', 'tests_or_handoff_proven'],
      handoffTo: 'Vinicius',
    });
  });

  it('keeps experimental web orchestration contracts out of the executable registry', async () => {
    const registryPath = resolve(process.cwd(), '../../../../skills/registry.yaml');
    const content = await readFile(registryPath, 'utf8');
    const skills = parseMcfSkillRegistry(content);
    const webBlocks = content.split(/(?=^  - skill_id: MCF-WEB-)/mu).filter((block) =>
      /^  - skill_id: MCF-WEB-/u.test(block),
    );

    expect(webBlocks).toHaveLength(9);
    expect(webBlocks.every((block) => /^    status: EXPERIMENTAL$/mu.test(block))).toBe(true);
    expect(skills.some((skill) => skill.skillId.startsWith('MCF-WEB-'))).toBe(false);
  });

  it('rejects duplicate skill identifiers', () => {
    expect(() =>
      parseMcfSkillRegistry(`${registry}\n${registry.split('skills:')[1] ?? ''}`),
    ).toThrow(/Duplicate MCF skill id/u);
  });
});
