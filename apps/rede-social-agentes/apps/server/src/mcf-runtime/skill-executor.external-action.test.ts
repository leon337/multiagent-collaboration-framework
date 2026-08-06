import type { McfSkillDefinition } from '@rsa/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { AdapterRegistry } from './adapter-registry.js';
import { EvidenceValidator } from './evidence-validator.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import type { ExternalActionLedger } from './external-action-ledger.js';
import type { ExternalActionAdapter } from './external-action.contracts.js';
import { PermissionEngine } from './permission-engine.js';
import { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';

const reviewSkill: McfSkillDefinition = {
  skillId: 'MCF-REVIEW-CODE',
  name: 'Revisar código',
  version: '1.0.0',
  purpose: 'Revisar código sem mutação.',
  ownerAgents: ['Vinicius'],
  requiredInputs: ['diff_or_commit'],
  allowedTools: ['GitHub'],
  forbiddenTools: ['merge_without_gate'],
  permissionProfile: 'READ_AND_PROPOSE',
  executionSteps: ['inspecionar_diff'],
  requiredEvidence: ['file_and_line_references', 'severity', 'recommendation'],
  acceptanceCriteria: ['findings_actionable'],
  failureModes: ['missing_context'],
  fallback: 'Limitar o veredito.',
  handoffTo: 'Rafael',
};

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

function registry(): SkillRegistryLoader {
  return {
    load: async () => reviewSkill,
  } as unknown as SkillRegistryLoader;
}

function dispatcher(
  adapters: ExternalActionAdapter[],
  order: string[] = [],
): ExternalActionDispatcher {
  const ledger = {
    reserve: async () => {
      order.push('reserve');
      return 'attempt-1';
    },
    recordExecuted: async () => {
      order.push('record-executed');
    },
    recordFailed: async () => {
      order.push('record-failed');
    },
    recordEvidenceValidated: async () => {
      order.push('evidence-valid');
    },
    recordEvidenceRejected: async () => {
      order.push('evidence-rejected');
    },
  } as unknown as ExternalActionLedger;
  return new ExternalActionDispatcher(new AdapterRegistry(adapters), ledger);
}

describe('SkillExecutor external action dispatch', () => {
  it('executes the registered read-only adapter and validates its receipt', async () => {
    const evidence = new EvidenceValidator();
    const adapter: ExternalActionAdapter = {
      adapterId: 'test-review-adapter',
      supports: () => true,
      execute: async (request) =>
        evidence.createTrustedReceipt({
          provider: request.tool.provider,
          operation: request.tool.operation,
          resource: request.tool.resource,
          externalId: '70',
          commitSha: 'b'.repeat(40),
          status: 'SUCCEEDED',
          observedAt: new Date().toISOString(),
          metadata: {
            reviewedFiles: ['src/runtime.ts'],
            findingsCount: 0,
            findings: [],
            verdict: 'PASS',
            readOnly: true,
          },
        }),
    };
    const dispatcher = dispatcher([adapter]);
    const executor = new SkillExecutor(registry(), new PermissionEngine(), evidence, dispatcher);

    const result = await executor.execute({
      skillId: 'MCF-REVIEW-CODE',
      agentId: 'Vinicius',
      inputs: { diff_or_commit: 'PR #70' },
      tool: {
        provider: 'github',
        operation: 'inspect-code',
        resource: 'leon337/multiagent-collaboration-framework',
      },
    });

    expect(result).toMatchObject({
      evidenceStatus: 'VALID',
      phaseState: 'COMPLETED',
      missionState: 'EXECUTING',
      handoffTo: 'Rafael',
      externalAction: {
        status: 'EXECUTED',
        adapterId: 'test-review-adapter',
      },
    });
  });

  it('classifies adapter failure and enters recovery without fabricated evidence', async () => {
    const adapter: ExternalActionAdapter = {
      adapterId: 'failing-review-adapter',
      supports: () => true,
      execute: async () => {
        const error = new Error('network unavailable') as Error & {
          code?: string;
        };
        error.code = 'ECONNRESET';
        throw error;
      },
    };
    const executor = new SkillExecutor(
      registry(),
      new PermissionEngine(),
      new EvidenceValidator(),
      dispatcher([adapter]),
    );

    const result = await executor.execute({
      skillId: 'MCF-REVIEW-CODE',
      agentId: 'Vinicius',
      inputs: { diff_or_commit: 'PR #70' },
      tool: {
        provider: 'github',
        operation: 'inspect-code',
        resource: 'leon337/multiagent-collaboration-framework',
      },
    });

    expect(result).toMatchObject({
      receipt: null,
      evidenceStatus: 'INVALID',
      phaseState: 'RECOVERING',
      missionState: 'RECOVERING',
      handoffTo: null,
      externalAction: {
        status: 'FAILED',
        adapterId: 'failing-review-adapter',
        failureCode: 'ADAPTER_FAILURE',
        retryable: false,
      },
    });
    expect(result.rejectionReason).toMatch(/ADAPTER_FAILURE/u);
  });

  it('keeps waiting when no adapter supports the external action', async () => {
    const executor = new SkillExecutor(
      registry(),
      new PermissionEngine(),
      new EvidenceValidator(),
      dispatcher([]),
    );

    const result = await executor.execute({
      skillId: 'MCF-REVIEW-CODE',
      agentId: 'Vinicius',
      inputs: { diff_or_commit: 'PR #70' },
      tool: {
        provider: 'github',
        operation: 'inspect-code',
        resource: 'leon337/multiagent-collaboration-framework',
      },
    });

    expect(result).toMatchObject({
      receipt: null,
      evidenceStatus: 'PENDING',
      phaseState: 'WAITING_EVIDENCE',
      missionState: 'WAITING_EXTERNAL',
      externalAction: { status: 'NOT_HANDLED' },
    });
  });

  it('rejects write operations before an adapter can execute', async () => {
    let executed = false;
    const adapter: ExternalActionAdapter = {
      adapterId: 'must-not-run',
      supports: () => true,
      execute: async () => {
        executed = true;
        throw new Error('unexpected execution');
      },
    };
    const executor = new SkillExecutor(
      registry(),
      new PermissionEngine(),
      new EvidenceValidator(),
      dispatcher([adapter]),
    );

    await expect(
      executor.execute({
        skillId: 'MCF-REVIEW-CODE',
        agentId: 'Vinicius',
        inputs: { diff_or_commit: 'PR #70' },
        tool: {
          provider: 'github',
          operation: 'comment-review',
          resource: 'leon337/multiagent-collaboration-framework',
        },
      }),
    ).rejects.toThrow(/READ_ONLY permits only read operations/u);
    expect(executed).toBe(false);
  });

  it('reserves the durable attempt before the adapter executes', async () => {
    const order: string[] = [];
    const evidence = new EvidenceValidator();
    const adapter: ExternalActionAdapter = {
      adapterId: 'ordered-review-adapter',
      supports: () => true,
      execute: async (request) => {
        order.push('execute');
        return evidence.createTrustedReceipt({
          provider: request.tool.provider,
          operation: request.tool.operation,
          resource: request.tool.resource,
          externalId: '71',
          commitSha: 'c'.repeat(40),
          status: 'SUCCEEDED',
          observedAt: new Date().toISOString(),
          metadata: {
            reviewedFiles: ['src/runtime.ts'],
            findingsCount: 0,
            findings: [],
            verdict: 'PASS',
            readOnly: true,
          },
        });
      },
    };
    const executor = new SkillExecutor(
      registry(),
      new PermissionEngine(),
      evidence,
      dispatcher([adapter], order),
    );

    await executor.execute({
      skillId: 'MCF-REVIEW-CODE',
      agentId: 'Vinicius',
      inputs: { diff_or_commit: 'PR #71' },
      tool: {
        provider: 'github',
        operation: 'inspect-code',
        resource: 'leon337/multiagent-collaboration-framework',
      },
      executionContext: {
        missionId: 'mission-1',
        phaseId: 'phase-1',
        expectedMissionVersion: 1,
      },
    });

    expect(order.slice(0, 2)).toEqual(['reserve', 'execute']);
  });
});
