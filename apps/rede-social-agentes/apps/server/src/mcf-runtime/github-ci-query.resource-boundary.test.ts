import type { McfSkillDefinition } from '@rsa/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdapterRegistry } from './adapter-registry.js';
import { EvidenceValidator } from './evidence-validator.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import type { ExternalActionLedger } from './external-action-ledger.js';
import type { ExternalActionAdapter } from './external-action.contracts.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

const skill: McfSkillDefinition = {
  skillId: 'MCF-RUN-TESTS',
  name: 'Executar validação e testes',
  version: '1.0.0',
  purpose: 'Consultar e validar CI sem fabricar sucesso.',
  ownerAgents: ['Renato'],
  requiredInputs: ['acceptance_criteria', 'test_target'],
  allowedTools: ['GitHub'],
  forbiddenTools: ['fabricated_pass'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: ['consultar_ci', 'coletar_evidencia'],
  requiredEvidence: ['commands_or_workflows', 'passed', 'failed', 'logs'],
  acceptanceCriteria: ['all_critical_tests_pass'],
  failureModes: ['environment_unavailable'],
  fallback: 'Registrar bloqueio verificável.',
  handoffTo: 'Emily',
};

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

function registry(): SkillRegistryLoader {
  return {
    load: async () => skill,
  } as unknown as SkillRegistryLoader;
}

describe('GitHub CI query resource permission boundary', () => {
  it.each(['github', 'github-actions'])(
    'rejects credential-bearing %s resources before the ledger reservation',
    async (provider) => {
      const reserve = vi.fn(async () => 'attempt-1');
      const execute = vi.fn();
      const adapter: ExternalActionAdapter = {
        adapterId: 'must-not-run',
        supports: () => true,
        execute,
      };
      const ledger = {
        reserve,
        recordExecuted: vi.fn(),
        recordFailed: vi.fn(),
        recordEvidenceValidated: vi.fn(),
        recordEvidenceRejected: vi.fn(),
      } as unknown as ExternalActionLedger;
      const dispatcher = new ExternalActionDispatcher(new AdapterRegistry([adapter]), ledger);
      const executor = new SkillExecutor(
        registry(),
        new PermissionEngine(),
        new EvidenceValidator(),
        dispatcher,
      );

      await expect(
        executor.execute({
          skillId: skill.skillId,
          agentId: 'Renato',
          inputs: {
            acceptance_criteria: ['all_critical_tests_pass'],
            test_target: 'a'.repeat(40),
          },
          tool: {
            provider,
            operation: 'query-ci',
            resource: 'https://TOKEN@github.com/owner/repo',
          },
        }),
      ).rejects.toThrow(/canonical owner\/repository resource/u);

      expect(reserve).not.toHaveBeenCalled();
      expect(execute).not.toHaveBeenCalled();
    },
  );

  it('permits a canonical owner/repository resource for the read-only CI query', () => {
    expect(() =>
      new PermissionEngine().assertAllowed(
        skill,
        'Renato',
        {
          provider: 'github-actions',
          operation: 'query-ci',
          resource: 'leon337/multiagent-collaboration-framework',
        },
        {
          acceptance_criteria: ['all_critical_tests_pass'],
          test_target: 'a'.repeat(40),
        },
      ),
    ).not.toThrow();
  });

  it.each([
    'https://github.com/owner/repo',
    'owner/repo:443',
    'owner/repo?workflow=ci',
    'owner/repo#main',
    'owner/repo/extra',
    ' owner/repo',
    'owner/repo\n',
  ])('rejects noncanonical resource syntax: %j', (resource) => {
    expect(() =>
      new PermissionEngine().assertAllowed(
        skill,
        'Renato',
        {
          provider: 'github-actions',
          operation: 'query-ci',
          resource,
        },
        {
          acceptance_criteria: ['all_critical_tests_pass'],
          test_target: 'a'.repeat(40),
        },
      ),
    ).toThrow(/canonical owner\/repository resource/u);
  });
});
