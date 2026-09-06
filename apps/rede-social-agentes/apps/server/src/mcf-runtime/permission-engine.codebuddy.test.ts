import type { McfSkillDefinition } from '@rsa/contracts';
import { describe, expect, it } from 'vitest';

import { PermissionEngine } from './permission-engine.js';

const implementationSkill: McfSkillDefinition = {
  skillId: 'MCF-IMPLEMENT-CHANGE',
  name: 'Implementar mudança autorizada',
  version: '1.0.0',
  purpose: 'Produzir alteração de código dentro do escopo aprovado.',
  ownerAgents: ['Rafael'],
  requiredInputs: ['approved_scope', 'acceptance_criteria', 'repository'],
  allowedTools: ['CodeBuddy'],
  forbiddenTools: ['direct_main_write', 'public_release_without_gate'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: ['criar_branch', 'implementar', 'testar_localmente'],
  requiredEvidence: ['changed_files', 'commit_sha', 'test_results'],
  acceptanceCriteria: ['scope_respected', 'tests_pass'],
  failureModes: ['scope_creep', 'unsafe_write', 'missing_tests'],
  fallback: 'Produzir patch ou plano executável sem alegar aplicação.',
  handoffTo: 'Vinicius',
};

const wrongSkill: McfSkillDefinition = {
  ...implementationSkill,
  skillId: 'MCF-RUN-TESTS',
  name: 'Executar validação e testes',
  ownerAgents: ['Renato'],
};

const canonicalTool = {
  provider: 'codebuddy',
  operation: 'implement-change',
  resource: 'leon337/multiagent-collaboration-framework',
};

describe('PermissionEngine CodeBuddy boundary', () => {
  it('allows only the scoped canonical implementation route', () => {
    const engine = new PermissionEngine();

    expect(() =>
      engine.assertAllowed(implementationSkill, 'Rafael', canonicalTool, {
        authorizedScope: true,
      }),
    ).not.toThrow();
  });

  it('rejects CodeBuddy execution from another skill even when that skill declares the provider', () => {
    const engine = new PermissionEngine();

    expect(() =>
      engine.assertAllowed(wrongSkill, 'Renato', canonicalTool, {
        authorizedScope: true,
      }),
    ).toThrow(/CodeBuddy|MCF-IMPLEMENT-CHANGE/i);
  });

  it('rejects a non-canonical CodeBuddy operation', () => {
    const engine = new PermissionEngine();

    expect(() =>
      engine.assertAllowed(
        implementationSkill,
        'Rafael',
        { ...canonicalTool, operation: 'write-anything' },
        { authorizedScope: true },
      ),
    ).toThrow(/implement-change|CodeBuddy/i);
  });

  it('rejects a local path as the declared CodeBuddy resource', () => {
    const engine = new PermissionEngine();

    expect(() =>
      engine.assertAllowed(
        implementationSkill,
        'Rafael',
        { ...canonicalTool, resource: '/home/leo/repository' },
        { authorizedScope: true },
      ),
    ).toThrow(/repository|CodeBuddy/i);
  });

  it('preserves the SCOPED_WRITE authorizedScope requirement', () => {
    const engine = new PermissionEngine();

    expect(() =>
      engine.assertAllowed(implementationSkill, 'Rafael', canonicalTool, {}),
    ).toThrow(/authorizedScope=true/i);
  });
});