import type { McfToolReceipt } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionMutationBoundary,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';
import type {
  ProductionAuthorizationGranted,
  ProductionAuthorizationService,
} from './production-authorization.service.js';

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;
type SleepLike = (milliseconds: number) => Promise<void>;

interface ProductionObservation {
  commitSha: string;
  ready: boolean;
  readyStatus: number;
}

interface ProductionPromotionOptions {
  productionRuntimeUrl?: string | undefined;
  deployHookUrl?: string | undefined;
  fetchImpl?: FetchLike | undefined;
  timeoutMs?: number | undefined;
  pollIntervalMs?: number | undefined;
  sleepImpl?: SleepLike | undefined;
}

const exactShaPattern = /^[a-f0-9]{40}$/u;
const defaultTimeoutMs = 8 * 60_000;
const defaultPollIntervalMs = 5_000;

function exactSha(value: unknown, label: string): string {
  if (typeof value !== 'string' || value !== value.trim()) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      `${label} must be an exact 40-character SHA`,
      false,
    );
  }
  const normalized = value.toLowerCase();
  if (!exactShaPattern.test(normalized)) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      `${label} must be an exact 40-character SHA`,
      false,
    );
  }
  return normalized;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function applicableAuthorization(
  value: ProductionAuthorizationGranted,
  releaseSha: string,
): boolean {
  return (
    value.humanAuthority === 'LEANDRO' &&
    value.operationalGate === 'LEO' &&
    value.gateDecision === 'APPROVE' &&
    value.provenance === 'MCF_RUNTIME_PERSISTED_AUTHORIZATION' &&
    value.targetSha === releaseSha &&
    value.authorizationId.trim().length > 0 &&
    value.evidenceRef.trim().length > 0 &&
    value.sourceDecision.trim().length > 0
  );
}

function runtimeBaseUrl(value: string): URL {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'production runtime URL must be public HTTPS without credentials, query or fragment',
      false,
    );
  }
  return url;
}

function deployHook(value: string, releaseSha: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'api.render.com') {
    throw new ExternalActionAdapterError(
      'UNSUPPORTED_TARGET',
      'production promotion requires the HTTPS api.render.com deploy hook',
      false,
    );
  }
  url.searchParams.set('ref', releaseSha);
  return url;
}

export class RenderProductionPromotionAdapter implements ExternalActionAdapter {
  readonly adapterId = 'render-production-promotion-v1';

  private readonly productionRuntimeUrl: string | undefined;
  private readonly deployHookUrl: string | undefined;
  private readonly fetcher: FetchLike;
  private readonly timeoutMs: number;
  private readonly pollIntervalMs: number;
  private readonly sleepImpl: SleepLike;

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly authorization: ProductionAuthorizationService,
    options: ProductionPromotionOptions = {},
  ) {
    this.productionRuntimeUrl =
      options.productionRuntimeUrl ?? process.env.MCF_PRODUCTION_RUNTIME_URL;
    this.deployHookUrl =
      options.deployHookUrl ?? process.env.RENDER_PRODUCTION_DEPLOY_HOOK_URL;
    this.fetcher = options.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
    this.pollIntervalMs = options.pollIntervalMs ?? defaultPollIntervalMs;
    this.sleepImpl = options.sleepImpl ?? sleep;
  }

  supports(request: ExternalActionRequest): boolean {
    return (
      request.skill.skillId === 'MCF-DEPLOY-VALIDATE' &&
      canonicalizeProvider(request.tool.provider) === 'render' &&
      canonicalizeToolValue(request.tool.operation) === 'deploy-production' &&
      canonicalizeToolValue(String(request.inputs.target_environment ?? '')) === 'production'
    );
  }

  private async observe(baseUrl: URL): Promise<ProductionObservation> {
    const versionResponse = await this.fetcher(new URL('/health/version', baseUrl), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!versionResponse.ok) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        `production health/version returned HTTP ${versionResponse.status}`,
        versionResponse.status >= 500,
        versionResponse.status,
      );
    }
    const version = (await versionResponse.json()) as Record<string, unknown>;
    const commitSha = exactSha(version.commitSha, 'production commitSha');
    const readyResponse = await this.fetcher(new URL('/health/ready', baseUrl), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return {
      commitSha,
      ready: readyResponse.ok,
      readyStatus: readyResponse.status,
    };
  }

  private receipt(
    request: ExternalActionRequest,
    authorization: ProductionAuthorizationGranted,
    releaseSha: string,
    previousSha: string,
    verifiedSha: string,
    deploymentId: string,
    outcome: 'DEPLOYED' | 'NOOP',
  ): McfToolReceipt {
    return this.evidence.createTrustedReceipt({
      provider: 'render',
      operation: request.tool.operation,
      resource: request.tool.resource,
      externalId: deploymentId,
      commitSha: releaseSha,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        adapterId: this.adapterId,
        targetEnvironment: 'production',
        deploymentOutcome: outcome,
        deploymentStatus: 'success',
        smokeStatus: 'pass',
        rollbackAvailable: true,
        deploymentId,
        previousSha,
        verifiedSha,
        authorizationId: authorization.authorizationId,
        authorizationEvidenceRef: authorization.evidenceRef,
        authorizationSourceDecision: authorization.sourceDecision,
        authorizationProvenance: authorization.provenance,
        humanAuthority: authorization.humanAuthority,
        operationalGate: authorization.operationalGate,
      },
    });
  }

  async execute(
    request: ExternalActionRequest,
    mutationBoundary?: ExternalActionMutationBoundary,
  ): Promise<McfToolReceipt> {
    if (!request.context) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'production promotion requires governed mission and phase context',
        false,
      );
    }
    const releaseSha = exactSha(request.inputs.artifact_or_commit, 'artifact_or_commit');
    const resolution = await this.authorization.resolveProductionAuthorization({
      missionId: request.context.missionId,
      phaseId: request.context.phaseId,
      releaseSha,
    });
    if (
      resolution.state !== 'AUTHORIZED' ||
      !applicableAuthorization(resolution, releaseSha)
    ) {
      throw new ExternalActionAdapterError(
        'PRODUCTION_AUTHORIZATION_REQUIRED',
        'production promotion requires persisted LEANDRO and LÉO authorization for the exact SHA',
        false,
      );
    }
    if (!this.productionRuntimeUrl || !this.deployHookUrl) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'runtime-side production promotion requires production provider configuration',
        false,
      );
    }

    const baseUrl = runtimeBaseUrl(this.productionRuntimeUrl);
    const before = await this.observe(baseUrl);
    if (!before.ready) {
      throw new ExternalActionAdapterError(
        'RESERVATION_CONFLICT',
        `production runtime is not healthy before promotion; HTTP ${before.readyStatus}`,
        false,
      );
    }
    if (before.commitSha === releaseSha) {
      return this.receipt(
        request,
        resolution,
        releaseSha,
        before.commitSha,
        before.commitSha,
        `production-current:${releaseSha}`,
        'NOOP',
      );
    }
    if (!mutationBoundary) {
      throw new ExternalActionAdapterError(
        'LEDGER_FAILURE',
        'production provider mutation requires a durable reconciliation boundary',
        false,
      );
    }

    const idempotencyKey = String(request.inputs.idempotency_key ?? '');
    await mutationBoundary.persistReconciliationMetadata({
      provider: 'render',
      targetEnvironment: 'production',
      releaseSha,
      previousSha: before.commitSha,
      authorizationId: resolution.authorizationId,
      authorizationEvidenceRef: resolution.evidenceRef,
      authorizationProvenance: resolution.provenance,
      idempotencyKey,
      reconciliationEligible: true,
    });

    const deploymentResponse = await this.fetcher(deployHook(this.deployHookUrl, releaseSha), {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    if (![200, 202].includes(deploymentResponse.status)) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        `Render deploy hook returned HTTP ${deploymentResponse.status}`,
        deploymentResponse.status >= 500,
        deploymentResponse.status,
      );
    }
    const deployment = (await deploymentResponse.json()) as Record<string, unknown>;
    const deploymentId =
      typeof deployment.id === 'string' && deployment.id.trim().length > 0
        ? deployment.id.trim()
        : `render-hook:${releaseSha}`;

    const deadline = Date.now() + this.timeoutMs;
    while (Date.now() < deadline) {
      const after = await this.observe(baseUrl);
      if (after.ready && after.commitSha === releaseSha) {
        return this.receipt(
          request,
          resolution,
          releaseSha,
          before.commitSha,
          after.commitSha,
          deploymentId,
          'DEPLOYED',
        );
      }
      await this.sleepImpl(this.pollIntervalMs);
    }

    throw new ExternalActionAdapterError(
      'ADAPTER_TIMEOUT',
      'production did not converge to the authorized exact SHA before the adapter deadline',
      true,
    );
  }
}
