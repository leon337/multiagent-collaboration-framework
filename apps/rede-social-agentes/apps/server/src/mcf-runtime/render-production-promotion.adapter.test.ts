import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionMutationBoundary, ExternalActionRequest } from './external-action.contracts.js';
import type { ProductionAuthorizationService } from './production-authorization.service.js';
import { RenderProductionPromotionAdapter } from './render-production-promotion.adapter.js';

const RELEASE_SHA = 'b'.repeat(40);
const PREVIOUS_SHA = 'a'.repeat(40);

const request: ExternalActionRequest = {
  skill: {
    skillId: 'MCF-DEPLOY-VALIDATE',
    name: 'Deploy Validate',
    version: '1.0.0',
    purpose: 'governed production deployment',
    ownerAgents: ['Gabriel'],
    requiredInputs: ['artifact_or_commit', 'target_environment'],
    allowedTools: ['Render'],
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
    artifact_or_commit: RELEASE_SHA,
    target_environment: 'production',
    idempotency_key: 'mcf-production-promotion-0001',
    authorizedScope: true,
  },
  tool: {
    provider: 'render',
    operation: 'deploy-production',
    resource: 'rsa-production',
  },
  context: {
    missionId: '11111111-1111-4111-8111-111111111111',
    phaseId: '22222222-2222-4222-8222-222222222222',
    expectedMissionVersion: 7,
  },
};

function authorizationService(
  resolution: Awaited<ReturnType<ProductionAuthorizationService['resolveProductionAuthorization']>>,
): ProductionAuthorizationService {
  return {
    resolveProductionAuthorization: vi.fn(async () => resolution),
  } as unknown as ProductionAuthorizationService;
}

function authorized(targetSha = RELEASE_SHA) {
  return {
    state: 'AUTHORIZED' as const,
    humanAuthority: 'LEANDRO' as const,
    operationalGate: 'LEO' as const,
    gateDecision: 'APPROVE' as const,
    provenance: 'MCF_RUNTIME_PERSISTED_AUTHORIZATION' as const,
    targetSha,
    sourceDecision: 'issue:140#human-gate',
    authorizationId: 'issue:140#human-gate',
    evidenceRef: 'mcf:event:production-gate',
  };
}

function jsonResponse(status: number, value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
});

describe('RenderProductionPromotionAdapter', () => {
  it('supports only the governed production deploy operation', () => {
    const adapter = new RenderProductionPromotionAdapter(
      new EvidenceValidator(),
      authorizationService(authorized()),
      {
        productionRuntimeUrl: 'https://prod.example.test',
        deployHookUrl: 'https://api.render.test/deploy/srv-production?key=secret',
      },
    );

    expect(adapter.supports(request)).toBe(true);
    expect(
      adapter.supports({
        ...request,
        inputs: { ...request.inputs, target_environment: 'staging' },
      }),
    ).toBe(false);
    expect(
      adapter.supports({
        ...request,
        tool: { ...request.tool, provider: 'github' },
      }),
    ).toBe(false);
  });

  it('blocks before any provider call when canonical production authorization is absent', async () => {
    const fetchImpl = vi.fn();
    const adapter = new RenderProductionPromotionAdapter(
      new EvidenceValidator(),
      authorizationService({
        state: 'BLOCKED',
        reason: 'OPERATIONAL_GATE_REQUIRED',
        targetSha: RELEASE_SHA,
      }),
      {
        productionRuntimeUrl: 'https://prod.example.test',
        deployHookUrl: 'https://api.render.test/deploy/srv-production?key=secret',
        fetchImpl,
      },
    );

    await expect(adapter.execute(request)).rejects.toMatchObject({
      code: 'PRODUCTION_AUTHORIZATION_REQUIRED',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('blocks an authorized resolution bound to a different SHA before any provider call', async () => {
    const fetchImpl = vi.fn();
    const adapter = new RenderProductionPromotionAdapter(
      new EvidenceValidator(),
      authorizationService(authorized('c'.repeat(40))),
      {
        productionRuntimeUrl: 'https://prod.example.test',
        deployHookUrl: 'https://api.render.test/deploy/srv-production?key=secret',
        fetchImpl,
      },
    );

    await expect(adapter.execute(request)).rejects.toMatchObject({
      code: 'PRODUCTION_AUTHORIZATION_REQUIRED',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns NOOP without touching the deploy hook when production already runs the exact SHA', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { commitSha: RELEASE_SHA }))
      .mockResolvedValueOnce(jsonResponse(200, { ready: true }));
    const boundary: ExternalActionMutationBoundary = {
      persistReconciliationMetadata: vi.fn(async () => {}),
    };
    const adapter = new RenderProductionPromotionAdapter(
      new EvidenceValidator(),
      authorizationService(authorized()),
      {
        productionRuntimeUrl: 'https://prod.example.test',
        deployHookUrl: 'https://api.render.test/deploy/srv-production?key=secret',
        fetchImpl,
      },
    );

    const receipt = await adapter.execute(request, boundary);

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.commitSha).toBe(RELEASE_SHA);
    expect(receipt.metadata).toMatchObject({
      targetEnvironment: 'production',
      deploymentOutcome: 'NOOP',
      authorizationProvenance: 'MCF_RUNTIME_PERSISTED_AUTHORIZATION',
    });
    expect(boundary.persistReconciliationMetadata).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });

  it('persists reconciliation metadata before the exact-SHA Render mutation', async () => {
    const order: string[] = [];
    const fetchImpl = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.method === 'POST') {
        order.push('provider-post');
        expect(url).toContain(`ref=${RELEASE_SHA}`);
        return jsonResponse(202, { id: 'dep-123' });
      }
      if (url.endsWith('/health/version')) {
        const commitSha = order.includes('provider-post') ? RELEASE_SHA : PREVIOUS_SHA;
        return jsonResponse(200, { commitSha });
      }
      if (url.endsWith('/health/ready')) return jsonResponse(200, { ready: true });
      throw new Error(`unexpected URL ${url}`);
    });
    const boundary: ExternalActionMutationBoundary = {
      persistReconciliationMetadata: vi.fn(async (metadata) => {
        order.push('durable-boundary');
        expect(metadata).toMatchObject({
          releaseSha: RELEASE_SHA,
          previousSha: PREVIOUS_SHA,
          authorizationId: 'issue:140#human-gate',
          reconciliationEligible: true,
        });
      }),
    };
    const adapter = new RenderProductionPromotionAdapter(
      new EvidenceValidator(),
      authorizationService(authorized()),
      {
        productionRuntimeUrl: 'https://prod.example.test',
        deployHookUrl: 'https://api.render.test/deploy/srv-production?key=secret',
        fetchImpl,
        timeoutMs: 1_000,
        pollIntervalMs: 1,
        sleepImpl: async () => {},
      },
    );

    const receipt = await adapter.execute(request, boundary);

    expect(order.slice(0, 2)).toEqual(['durable-boundary', 'provider-post']);
    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.commitSha).toBe(RELEASE_SHA);
    expect(receipt.metadata).toMatchObject({
      targetEnvironment: 'production',
      deploymentOutcome: 'DEPLOYED',
      deploymentId: 'dep-123',
      previousSha: PREVIOUS_SHA,
      verifiedSha: RELEASE_SHA,
    });
  });

  it('returns PARTIAL instead of claiming failure when the provider POST becomes ambiguous', async () => {
    const fetchImpl = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.method === 'POST') throw new TypeError('connection reset after write');
      if (url.endsWith('/health/version')) return jsonResponse(200, { commitSha: PREVIOUS_SHA });
      if (url.endsWith('/health/ready')) return jsonResponse(200, { ready: true });
      throw new Error(`unexpected URL ${url}`);
    });
    const boundary: ExternalActionMutationBoundary = {
      persistReconciliationMetadata: vi.fn(async () => {}),
    };
    const adapter = new RenderProductionPromotionAdapter(
      new EvidenceValidator(),
      authorizationService(authorized()),
      {
        productionRuntimeUrl: 'https://prod.example.test',
        deployHookUrl: 'https://api.render.test/deploy/srv-production?key=secret',
        fetchImpl,
      },
    );

    const receipt = await adapter.execute(request, boundary);

    expect(receipt.status).toBe('PARTIAL');
    expect(receipt.metadata).toMatchObject({
      targetEnvironment: 'production',
      deploymentOutcome: 'UNKNOWN',
      reconciliationEligible: true,
    });
  });
});
