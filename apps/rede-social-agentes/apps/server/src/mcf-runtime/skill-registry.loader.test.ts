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


  it('loads the provider-agnostic web research skill package with governed permissions', async () => {
    const registryPath = resolve(process.cwd(), '../../../../skills/registry.yaml');
    const policyPath = resolve(process.cwd(), '../../../../skills/web/provider-policy.yaml');
    const [content, policy] = await Promise.all([
      readFile(registryPath, 'utf8'),
      readFile(policyPath, 'utf8'),
    ]);
    const skills = parseMcfSkillRegistry(content);
    const webSkills = skills.filter((skill) => skill.skillId.startsWith('MCF-WEB-'));

    expect(webSkills.map((skill) => skill.skillId).sort()).toEqual([
      'MCF-WEB-COLLECT',
      'MCF-WEB-FETCH',
      'MCF-WEB-INTERACT',
      'MCF-WEB-MAP',
      'MCF-WEB-MONITOR',
      'MCF-WEB-RESEARCH',
      'MCF-WEB-SEARCH',
    ]);
    expect(new Set(webSkills.map((skill) => skill.skillId)).size).toBe(7);
    expect(webSkills.find((skill) => skill.skillId === 'MCF-WEB-SEARCH')).toMatchObject({
      permissionProfile: 'READ_ONLY',
      handoffTo: 'Miriam',
    });
    expect(webSkills.find((skill) => skill.skillId === 'MCF-WEB-INTERACT')).toMatchObject({
      permissionProfile: 'SCOPED_WRITE',
      handoffTo: 'Beatriz',
    });
    expect(webSkills.find((skill) => skill.skillId === 'MCF-WEB-MONITOR')).toMatchObject({
      permissionProfile: 'SCOPED_WRITE',
      handoffTo: 'Augusto',
    });
    expect(policy).toContain('Firecrawl_MUST_NOT_be_required_for_any_MCF_WEB_skill');
    expect(policy).toContain('optional_fallbacks: [Firecrawl]');
    expect(policy).toContain('no_silent_paid_fallback');
  });

  it('rejects duplicate skill identifiers', () => {
    expect(() =>
      parseMcfSkillRegistry(`${registry}\n${registry.split('skills:')[1] ?? ''}`),
    ).toThrow(/Duplicate MCF skill id/u);
  });
});
