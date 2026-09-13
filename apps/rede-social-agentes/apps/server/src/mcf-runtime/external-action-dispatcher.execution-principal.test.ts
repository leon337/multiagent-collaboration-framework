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
import type { GitHubExecutionIdentityRegistry } from './github-execution-identity.js';

function request(operation = 'create-branch-pr'): ExternalActionRequest {
  return {
    skill: {
      skillId: 'MCF-GIT-PR-RELEASE',
      name: 'Git PR Release',
      version: '1.0.0',
      purpose: 'test',
      ownerAgents: ['Gabriel'],
      requiredInputs: [],
      allowedTools: ['GitHub'],
      forbiddenTools: [],
      permissionProfile: 'SCOPED_WRITE',
      executionSteps: [],
      requiredEvidence: [],
      acceptanceCriteria: [],
      failureModes: [],
      fallback: 'test',
      handoffTo: 'Mestre',
    },
    agentId: 'Gabriel',
    inputs: { idempotency_key: 'identity-binding-0001' },
    tool: {
      provider: 'github',
      operation,
      resource: 'leon337/multiagent-collaboration-framework',
    },
    context: { missionId: 'm1', phaseId: 'p1', expectedMissionVersion: 1 },
  };
}

function receipt(): McfToolReceipt {
  return {
    receiptId: 'r1',
    provider: 'github',
    operation: 'create-branch-pr',
    resource: 'leon337/multiagent-collaboration-framework',
    externalId: '207',
    commitSha: 'a'.repeat(40),
    status: 'SUCCEEDED',
    observedAt: new Date().toISOString(),
    payloadDigest: 'b'.repeat(64),
    signature: 'c'.repeat(64),
    metadata: {},
  };
}

function harness(identityRegistry: GitHubExecutionIdentityRegistry) {
  const adapter: ExternalActionAdapter = {
    adapterId: 'github-branch-pr-write-v1',
    supports: () => true,
    execute: vi.fn(async () => receipt()),
  };
  const registry = { resolve: vi.fn(() => adapter) } as unknown as AdapterRegistry;
  const ledger = {
    reserve: vi.fn(async () => 'attempt-1'),
    recordExecuting: vi.fn(async () => undefined),
    recordExecuted: vi.fn(async () => undefined),
    recordUnknown: vi.fn(async () => undefined),
    recordFailed: vi.fn(async () => undefined),
    recordEvidenceValidated: vi.fn(async () => undefined),
    recordEvidenceRejected: vi.fn(async () => undefined),
  } as unknown as ExternalActionLedger;
  return {
    adapter,
    ledger,
    dispatcher: new ExternalActionDispatcher(registry, ledger, identityRegistry),
  };
}

describe('ExternalActionDispatcher GitHub execution principal binding', () => {
  it('binds a GitHub write principal before durable reservation and adapter execution', async () => {
    const original = request();
    const bound: ExternalActionRequest = {
      ...original,
      executionPrincipal: {
        provider: 'github',
        principalId: 'MESTRE',
        externalActor: 'mcfmestreagent-svg',
        attributionMode: 'BOOTSTRAP_DELEGATED',
      },
    };
    const identities = {
      bindWritePrincipal: vi.fn(async () => bound),
    } as unknown as GitHubExecutionIdentityRegistry;
    const { adapter, ledger, dispatcher } = harness(identities);

    const result = await dispatcher.dispatch(original);

    expect(result.status).toBe('EXECUTED');
    expect(identities.bindWritePrincipal).toHaveBeenCalledWith(original);
    expect(ledger.reserve).toHaveBeenCalledWith(bound, adapter.adapterId);
    expect(adapter.execute).toHaveBeenCalledWith(bound, undefined);
    expect(vi.mocked(identities.bindWritePrincipal).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(ledger.reserve).mock.invocationCallOrder[0]!,
    );
    expect(vi.mocked(ledger.reserve).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(adapter.execute).mock.invocationCallOrder[0]!,
    );
  });

  it('fails before reservation when GitHub write identity binding fails', async () => {
    const identities = {
      bindWritePrincipal: vi.fn(async () => {
        throw new ExternalActionAdapterError(
          'AUTHENTICATION_REQUIRED',
          'principal unavailable',
          false,
          403,
        );
      }),
    } as unknown as GitHubExecutionIdentityRegistry;
    const { adapter, ledger, dispatcher } = harness(identities);

    const result = await dispatcher.dispatch(request());

    expect(result).toMatchObject({
      status: 'FAILED',
      adapterId: adapter.adapterId,
      attemptId: null,
      failure: { code: 'AUTHENTICATION_REQUIRED' },
    });
    expect(ledger.reserve).not.toHaveBeenCalled();
    expect(adapter.execute).not.toHaveBeenCalled();
  });

  it('does not bind GitHub read-only operations', async () => {
    const identities = {
      bindWritePrincipal: vi.fn(),
    } as unknown as GitHubExecutionIdentityRegistry;
    const { ledger, dispatcher } = harness(identities);
    const readRequest = request('query-ci');

    await dispatcher.dispatch(readRequest);

    expect(identities.bindWritePrincipal).not.toHaveBeenCalled();
    expect(ledger.reserve).toHaveBeenCalledWith(readRequest, 'github-branch-pr-write-v1');
  });
});
