import type { McfToolReceipt } from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import type { AdapterRegistry } from './adapter-registry.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import type { ExternalActionLedger } from './external-action-ledger.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionRequest,
} from './external-action.contracts.js';

const request: ExternalActionRequest = {
  skill: {
    skillId: 'MCF-GIT-PR-RELEASE',
    name: 'Git PR Release',
    version: '1.0.0',
    purpose: 'controlled GitHub PR collaboration',
    ownerAgents: ['Gabriel'],
    requiredInputs: [],
    allowedTools: ['github'],
    forbiddenTools: ['force-push', 'merge-with-red-ci'],
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
    pull_request_number: 80,
    expected_head_sha: 'a'.repeat(40),
    idempotency_key: 'mcf-postwrite-ledger-0001',
  },
  tool: {
    provider: 'github',
    operation: 'comment-pr',
    resource: 'leon337/multiagent-collaboration-framework',
  },
  context: {
    missionId: 'mission-postwrite',
    phaseId: 'phase-postwrite',
    expectedMissionVersion: 1,
  },
};

function receipt(status: 'SUCCEEDED' | 'PARTIAL' = 'SUCCEEDED'): McfToolReceipt {
  return {
    receiptId: 'receipt-postwrite-0001',
    provider: 'github',
    operation: 'comment-pr',
    resource: 'leon337/multiagent-collaboration-framework',
    externalId: status === 'SUCCEEDED' ? '1234' : null,
    commitSha: 'a'.repeat(40),
    status,
    observedAt: new Date().toISOString(),
    payloadDigest: 'b'.repeat(64),
    metadata: {
      idempotencyKey: 'mcf-postwrite-ledger-0001',
      resultStatus: status === 'PARTIAL' ? 'UNKNOWN' : 'SUCCEEDED',
    },
    signature: 'c'.repeat(64),
  };
}

function harness(adapterReceipt: McfToolReceipt | Error) {
  const adapter: ExternalActionAdapter = {
    adapterId: 'github-pr-collaboration-write-v1',
    supports: () => true,
    execute: vi.fn(async () => {
      if (adapterReceipt instanceof Error) throw adapterReceipt;
      return adapterReceipt;
    }),
  };
  const registry = {
    resolve: vi.fn(() => adapter),
  } as unknown as AdapterRegistry;
  const ledger = {
    reserve: vi.fn(async () => 'attempt-postwrite-0001'),
    recordExecuting: vi.fn(async () => undefined),
    recordExecuted: vi.fn(async () => undefined),
    recordUnknown: vi.fn(async () => undefined),
    recordFailed: vi.fn(async () => undefined),
    recordEvidenceValidated: vi.fn(async () => undefined),
    recordEvidenceRejected: vi.fn(async () => undefined),
  } as unknown as ExternalActionLedger;
  return { adapter, ledger, dispatcher: new ExternalActionDispatcher(registry, ledger) };
}

describe('ExternalActionDispatcher post-write persistence semantics', () => {
  it('never records FAILED when recordExecuted fails after adapter success', async () => {
    const successfulReceipt = receipt();
    const { dispatcher, ledger } = harness(successfulReceipt);
    vi.mocked(ledger.recordExecuted).mockRejectedValueOnce(
      new ExternalActionAdapterError('LEDGER_FAILURE', 'database connection lost', true),
    );

    const result = await dispatcher.dispatch(request);

    expect(result.status).toBe('UNKNOWN');
    expect(ledger.recordExecuting).toHaveBeenCalledWith('attempt-postwrite-0001');
    expect(ledger.recordUnknown).toHaveBeenCalledWith(
      'attempt-postwrite-0001',
      successfulReceipt,
      expect.objectContaining({ code: 'LEDGER_FAILURE', retryable: false }),
    );
    expect(ledger.recordFailed).not.toHaveBeenCalled();
  });

  it('records a PARTIAL adapter receipt as UNKNOWN without taking the FAILED path', async () => {
    const partialReceipt = receipt('PARTIAL');
    const { dispatcher, ledger } = harness(partialReceipt);

    const result = await dispatcher.dispatch(request);

    expect(result.status).toBe('UNKNOWN');
    expect(ledger.recordUnknown).toHaveBeenCalledWith(
      'attempt-postwrite-0001',
      partialReceipt,
      expect.objectContaining({ code: 'EXTERNAL_EFFECT_UNKNOWN', retryable: false }),
    );
    expect(ledger.recordExecuted).not.toHaveBeenCalled();
    expect(ledger.recordFailed).not.toHaveBeenCalled();
  });

  it('keeps definitive adapter failure on the pre-write FAILED path', async () => {
    const { dispatcher, ledger } = harness(
      new ExternalActionAdapterError('TARGET_NOT_FOUND', 'target absent before mutation', false, 404),
    );

    const result = await dispatcher.dispatch(request);

    expect(result.status).toBe('FAILED');
    expect(ledger.recordFailed).toHaveBeenCalledWith(
      'attempt-postwrite-0001',
      expect.objectContaining({ code: 'TARGET_NOT_FOUND' }),
    );
    expect(ledger.recordUnknown).not.toHaveBeenCalled();
  });

  it('does not invoke the adapter when durable EXECUTING persistence cannot be established', async () => {
    const { adapter, dispatcher, ledger } = harness(receipt());
    vi.mocked(ledger.recordExecuting).mockRejectedValueOnce(
      new ExternalActionAdapterError('LEDGER_FAILURE', 'cannot persist executing state', true),
    );

    const result = await dispatcher.dispatch(request);

    expect(result.status).toBe('FAILED');
    expect(adapter.execute).not.toHaveBeenCalled();
    expect(ledger.recordFailed).toHaveBeenCalled();
  });
});
