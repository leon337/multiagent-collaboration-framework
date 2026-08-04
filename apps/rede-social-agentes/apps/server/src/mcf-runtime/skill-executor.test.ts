import { beforeEach, describe, expect, it } from 'vitest';
import type { McfSkillDefinition } from '@rsa/contracts';

import { EvidenceValidator } from './evidence-validator.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

const skills = new Map<string, McfSkillDefinition>([
  [
    'MCF-START-MISSION',
    {
      skillId: 'MCF-START-MISSION',
      name: 'Iniciar missão',
      version: '1.0.0',
      purpose: 'Definir contrato.',
      ownerAgents: ['Mestre'],
      requiredInputs: ['objective'],
      allowedTools: ['GitHub'],
      forbiddenTools: ['public_deployment'],
      permissionProfile: 'READ_AND_PROPOSE',
      executionSteps: ['definir_contrato'],
      requiredEvidence: ['mission_id'],
      acceptanceCriteria: ['objective_verifiable'],
      failureModes: ['objective_ambiguous'],
      fallback: 'Executar descoberta.',
      handoffTo: 'Miriam',
    },
  ],
  [
    'MCF-IMPLEMENT-CHANGE',
    {
      skillId: 'MCF-IMPLEMENT-CHANGE',
      name: 'Implementar mudança',
      version: '1.0.0',
      purpose: 'Aplicar mudança autorizada.',
      ownerAgents: ['Rafael'],
      requiredInputs: ['approved_scope', 'acceptance_criteria', 'repository'],
      allowedTools: ['GitHub'],
      forbiddenTools: ['direct_main_write'],
      permissionProfile: 'SCOPED_WRITE',
      executionSteps: ['criar_branch', 'implementar'],
      requiredEvidence: ['commit_sha'],
      acceptanceCriteria: ['scope_respected'],
      failureModes: ['scope_creep'],
      fallback: 'Produzir patch.',
      handoffTo: 'Vinicius',
    },
  ],
  [
    'MCF-RUN-TESTS',
    {
      skillId: 'MCF-RUN-TESTS',
      name: 'Executar testes',
      version: '1.0.0',
      purpose: 'Validar critérios e regressões.',
      ownerAgents: ['Renato'],
      requiredInputs: ['acceptance_criteria', 'test_target'],
      allowedTools: ['GitHub'],
      forbiddenTools: ['fabricated_pass'],
      permissionProfile: 'SCOPED_WRITE',
      executionSteps: ['executar', 'coletar_evidencia'],
      requiredEvidence: ['workflow_run_id', 'commit_sha'],
      acceptanceCriteria: ['all_critical_tests_pass'],
      failureModes: ['flaky_test'],
      fallback: 'Registrar bloqueio verificável.',
      handoffTo: 'Emily',
    },
  ],
]);

function executor(): SkillExecutor {
  const registry = {
    load: async (skillId: string) => {
      const skill = skills.get(skillId);
      if (!skill) {
        throw new Error(`missing ${skillId}`);
      }
      return skill;
    },
  } as SkillRegistryLoader;
  return new SkillExecutor(registry, new PermissionEngine(), new EvidenceValidator());
}

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

describe('SkillExecutor', () => {
  it('executes MCF-START-MISSION with a signed internal receipt', async () => {
    const result = await executor().execute({
      skillId: 'MCF-START-MISSION',
      agentId: 'Mestre',
      inputs: { objective: 'Criar runtime verificável' },
      tool: {
        provider: 'internal',
        operation: 'create-contract',
        resource: 'mission/new',
      },
    });

    expect(result).toMatchObject({
      evidenceStatus: 'VALID',
      phaseState: 'COMPLETED',
      handoffTo: 'Miriam',
    });
    expect(result.receipt?.signature).toMatch(/^[a-f0-9]{64}$/u);
  });

  it('waits for trusted external evidence instead of claiming success', async () => {
    const result = await executor().execute({
      skillId: 'MCF-IMPLEMENT-CHANGE',
      agentId: 'Rafael',
      inputs: {
        approved_scope: ['src/runtime.ts'],
        acceptance_criteria: ['tests pass'],
        repository: 'leon337/multiagent-collaboration-framework',
        authorizedScope: true,
      },
      tool: {
        provider: 'github',
        operation: 'create-branch',
        resource: 'leon337/multiagent-collaboration-framework/feature',
      },
    });

    expect(result).toMatchObject({
      receipt: null,
      evidenceStatus: 'PENDING',
      phaseState: 'WAITING_EVIDENCE',
      missionState: 'WAITING_EXTERNAL',
    });
  });

  it('accepts GitHub Actions through the GitHub capability declared by the skill', async () => {
    const result = await executor().execute({
      skillId: 'MCF-RUN-TESTS',
      agentId: 'Renato',
      inputs: {
        acceptance_criteria: ['pnpm verify passes'],
        test_target: 'pull request',
        authorizedScope: true,
      },
      tool: {
        provider: 'github-actions',
        operation: 'workflow-result',
        resource: 'leon337/multiagent-collaboration-framework',
      },
    });

    expect(result).toMatchObject({
      evidenceStatus: 'PENDING',
      phaseState: 'WAITING_EVIDENCE',
      missionState: 'WAITING_EXTERNAL',
    });
  });

  it('rejects direct writes to main', async () => {
    await expect(
      executor().execute({
        skillId: 'MCF-IMPLEMENT-CHANGE',
        agentId: 'Rafael',
        inputs: {
          approved_scope: ['src/runtime.ts'],
          acceptance_criteria: ['tests pass'],
          repository: 'leon337/multiagent-collaboration-framework',
          authorizedScope: true,
        },
        tool: {
          provider: 'github',
          operation: 'push',
          resource: 'leon337/multiagent-collaboration-framework/main',
        },
      }),
    ).rejects.toThrow(/direct writes to main are forbidden/u);
  });
});
