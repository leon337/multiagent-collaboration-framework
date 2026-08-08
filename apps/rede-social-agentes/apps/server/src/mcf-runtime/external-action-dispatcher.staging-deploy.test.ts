import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdapterRegistry } from './adapter-registry.js';
import { EvidenceValidator } from './evidence-validator.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import type { ExternalActionLedger } from './external-action-ledger.js';
import type { ExternalActionAdapter, ExternalActionRequest } from './external-action.contracts.js';

const request: ExternalActionRequest = {
  skill: {
    skillId: 'MCF-DEPLOY-VALIDATE',
    name: 'Deploy Validate',
    version: '1.0.0',
    purpose: 'verified staging deployment',
    ownerAgents: ['Gabriel'],
    requiredInputs: ['artifact_or_commit', 'target_environment'],
    allowedTools: ['GitHub', 'Render'],
    forbiddenTools: ['public_production_without_gate'],
    permissionProfile: 'SCOPED_WRITE',
    executionSteps: [],
    requiredEvidence: [],
    acceptanceCriteria: [],
    failureModes: [],
    fallback: 'Mestre',
    handoffTo: 'Mestre',
  },
  agentId: 'Gabriel',
  inputs: {
    repository: 'leon337/multiagent-collaboration-framework',
    artifact_or_commit: 'b'.repeat(40),
    target_environment: 'staging',
    idempotency_key: 'mcf-gate-d-idempotency-0001',
    authorizedScope: true,
  },
  tool: {
    provider: 'github',
    operation: 'deploy-staging',
    resource: 'leon337/multiagent-collaboration-framework',
  },
  context: {
    missionId: 'mission-gate-d',
    phaseId: 'phase-gate-d',
    expectedMissionVersion: 7,
  },
};

beforeEach(() => {
  process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
});

function receipt(status: 'SUCCEEDED' | 'PARTIAL' = 'SUCCEEDED') {
  return new EvidenceValidator().createTrustedReceipt({
    provider: 'github-actions',
    operation: 'deploy-staging',
    resource: request.tool.resource,
    externalId: status === 'SUCCEEDED' ? '42' : null,
    commitSha: 'b'.repeat(40),
    status,
    observedAt: new Date().toISOString(),
    metadata: { deploymentOutcome: status === 'SUCCEEDED' ? 'DEPLOYED' : 'UNKNOWN' },
  });
}

function ledger(order: string[], executingFailure?: Error): ExternalActionLedger {
  return {
    reserve: vi.fn(async () => {
      order.push('reserve');
      return 'attempt-gate-d';
    }),
    recordExecuting: vi.fn(async () => {
      order.push('executing');
      if (executingFailure) throw executingFailure;
    }),
    recordExecuted: vi.fn(async () => {
      order.push('executed');
    }),
    recordFailed: vi.fn(async () => {
      order.push('failed');
    }),
    recordUnknown: vi.fn(async () => {
      order.push('unknown');
    }),
    recordEvidenceValidated: vi.fn(async () => {}),
    recordEvidenceRejected: vi.fn(async () => {}),
  } as unknown as ExternalActionLedger;
}

function stagingAdapter(order: string[], result = receipt()): ExternalActionAdapter {
  return {
    adapterId: 'github-actions-staging-deploy-v1',
    supports: () => true,
    execute: vi.fn(async () => {
      order.push('execute');
      return result;
    }),
  };
}

describe('ExternalActionDispatcher Gate D durable boundary', () => {
  it('persists EXECUTING before allowing a staging workflow dispatch', async () => {
    const order: string[] = [];
    const dispatcher = new ExternalActionDispatcher(
      new AdapterRegistry([stagingAdapter(order)]),
      ledger(order),
    );

    const result = await dispatcher.dispatch(request);

    expect(result.status).toBe('EXECUTED');
    expect(order.slice(0, 4)).toEqual(['reserve', 'executing', 'execute', 'executed']);
  });

  it('does not call the adapter when the durable pre-write boundary cannot be recorded', async () => {
    const order: string[] = [];
    const adapter = stagingAdapter(order);
    const dispatcher = new ExternalActionDispatcher(
      new AdapterRegistry([adapter]),
      ledger(order, new Error('ledger unavailable')),
    );

    const result = await dispatcher.dispatch(request);

    expect(result.status).toBe('FAILED');
    expect(order).toEqual(['reserve', 'executing', 'failed']);
    expect(adapter.execute).not.toHaveBeenCalled();
  });

  it('durably records UNKNOWN when the adapter reports an ambiguous provider effect', async () => {
    const order: string[] = [];
    const dispatcher = new ExternalActionDispatcher(
      new AdapterRegistry([stagingAdapter(order, receipt('PARTIAL'))]),
      ledger(order),
    );

    const result = await dispatcher.dispatch(request);

    expect(result.status).toBe('UNKNOWN');
    expect(order.slice(0, 4)).toEqual(['reserve', 'executing', 'execute', 'unknown']);
    if (result.status === 'UNKNOWN') {
      expect(result.failure.code).toBe('EXTERNAL_EFFECT_UNKNOWN');
      expect(result.failure.retryable).toBe(false);
    }
  });
});
