import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type {
  ExternalActionMutationBoundary,
  ExternalActionRequest,
} from './external-action.contracts.js';
import type {
  ProductionAuthorizationResolution,
  ProductionAuthorizationService,
} from './production-authorization.service.js';
import { RenderProductionPromotionAdapter } from './render-production-promotion.adapter.js';

const releaseSha = 'b'.repeat(40);
const previousSha = 'a'.repeat(40);

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
    artifact_or_commit: releaseSha,
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

function service(resolution: ProductionAuthorizationResolution): ProductionAuthorizationService {
  return {
    resolveProductionAuthorization: vi.fn(async () => resolution),
  } as unknown as ProductionAuthorizationService;
}

function authorized(targetSha = releaseSha): ProductionAuthorizationResolution {
  return {
    state: 'AUTHORIZED',
    humanAuthority: 'LEANDRO',
    operationalGate: 'LEO',
    gateDecision: 'APPROVE',
    provenance: 'MCF_RUNTIME_PERSISTED_AUTHORIZATION',
    targetSha,
    sourceDecision: 'issue:140#human-gate',
    authorizationId: 'issue:140#human-gate',
    evidenceRef: 'mcf:event:production-gate',
  };
}

function response(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
});

describe('RenderProductionPromotionAdapter', () => {
  it('supports only the governed Render production operation', () => {
    const adapter = new RenderProductionPromotionAdapter(
      new EvidenceValidator(),
      service(authorized()),
      {
        productionRuntimeUrl: 'https://prod.example.test',
        deployHookUrl: 'https://api.render.com/deploy/srv-production?key=secret',
      },
    );

    expect(adapter.supports(request)).toBe(true);
    expect(
      adapter.supports({
        ...request,
        inputs: { ...request.inputs, target_environment: 'staging' },
      }),
    ).toBe(false);
  });

  it('blocks before provider access when canonical authorization is absent', async () => {
    const fetchImpl = vi.fn();
    const adapter = new RenderProductionPromotionAdapter(
      new EvidenceValidator(),
      service({
        state: 'BLOCKED',
        reason: 'OPERATIONAL_GATE_REQUIRED',
        targetSha: releaseSha,
      }),
      {
        productionRuntimeUrl: 'https://prod.example.test',
        deployHookUrl: 'https://api.render.com/deploy/srv-production?key=secret',
        fetchImpl,
      },
    );

    await expect(adapter.execute(request)).rejects.toMatchObject({
      code: 'PRODUCTION_AUTHORIZATION_REQUIRED',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('persists recovery metadata before promoting the authorized exact SHA', async () => {
    const order: string[] = [];
    const fetchImpl = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.method === 'POST') {
        order.push('provider-post');
        expect(url).toContain(`ref=${releaseSha}`);
        return response(202, { id: 'dep-123' });
      }
      if (url.endsWith('/health/version')) {
        const commitSha = order.includes('provider-post') ? releaseSha : previousSha;
        return response(200, { commitSha });
      }
      if (url.endsWith('/health/ready')) return response(200, { ready: true });
      throw new Error(`unexpected URL ${url}`);
    });
    const boundary: ExternalActionMutationBoundary = {
      persistReconciliationMetadata: vi.fn(async (metadata) => {
        order.push('durable-boundary');
        expect(metadata).toMatchObject({
          releaseSha,
          previousSha,
          authorizationId: 'issue:140#human-gate',
          reconciliationEligible: true,
        });
      }),
    };
    const adapter = new RenderProductionPromotionAdapter(
      new EvidenceValidator(),
      service(authorized()),
      {
        productionRuntimeUrl: 'https://prod.example.test',
        deployHookUrl: 'https://api.render.com/deploy/srv-production?key=secret',
        fetchImpl,
        timeoutMs: 1_000,
        pollIntervalMs: 1,
        sleepImpl: async () => {},
      },
    );

    const receipt = await adapter.execute(request, boundary);

    expect(order.slice(0, 2)).toEqual(['durable-boundary', 'provider-post']);
    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.commitSha).toBe(releaseSha);
    expect(receipt.metadata).toMatchObject({
      deploymentOutcome: 'DEPLOYED',
      targetEnvironment: 'production',
      previousSha,
      verifiedSha: releaseSha,
      authorizationProvenance: 'MCF_RUNTIME_PERSISTED_AUTHORIZATION',
    });
  });
});
