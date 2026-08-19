import type { McfToolReceipt } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionMutationBoundary,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import { EXTERNAL_ACTION_LEASE_MS } from './external-action-reservation.js';
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

interface ProductionTarget {
  releaseSha: string;
  idempotencyKey: string;
  missionId: string;
  phaseId: string;
}

export interface RenderProductionPromotionAdapterOptions {
  productionRuntimeUrl?: string | undefined;
  deployHookUrl?: string | undefined;
  fetchImpl?: FetchLike | undefined;
  timeoutMs?: number | undefined;
  pollIntervalMs?: number | undefined;
  sleepImpl?: SleepLike | undefined;
}

export const RENDER_PRODUCTION_PROMOTION_TIMEOUT_MS = 8 * 60_000;
export const RENDER_PRODUCTION_PROMOTION_POLL_INTERVAL_MS = 5_000;
const SHA_40 = /^[a-f0-9]{40}$/u;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/u;

if (RENDER_PRODUCTION_PROMOTION_TIMEOUT_MS >= EXTERNAL_ACTION_LEASE_MS) {
  throw new Error('Render production promotion timeout must remain shorter than external action lease');
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function exactSha(value: unknown, label: string): string {
  if (typeof value !== 'string' || value !== value.trim()) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      `${label} must be an exact 40-character SHA`,
      false,
    );
  }
  const normalized = value.toLowerCase();
  if (!SHA_40.test(normalized)) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      `${label} must be an exact 40-character SHA`,
      false,
    );
  }
  return normalized;
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      `${label} must be a non-empty trimmed string`,
      false,
    );
  }
  return value;
}

function publicRuntimeUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'MCF_PRODUCTION_RUNTIME_URL must be a valid HTTPS URL',
      false,
    );
  }
  if (
    url.protocol !== 'https:' ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.port.length > 0 ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'MCF_PRODUCTION_RUNTIME_URL must be public HTTPS without credentials, port, query or fragment',
      false,
    );
  }
  url.pathname = url.pathname.replace(/\/+$/u, '');
  return url;
}

function renderDeployHook(value: string, releaseSha: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'RENDER_PRODUCTION_DEPLOY_HOOK_URL must be a valid URL',
      false,
    );
  }
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

function resolveTarget(request: ExternalActionRequest): ProductionTarget {
  if (!request.context) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'production promotion requires governed mission and phase context',
      false,
    );
  }
  const releaseSha = exactSha(request.inputs.artifact_or_commit, 'artifact_or_commit');
  const idempotencyKey = requiredString(request.inputs.idempotency_key, 'idempotency_key');
  if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'idempotency_key must be 16-128 safe characters',
      false,
    );
  }
  return {
    releaseSha,
    idempotencyKey,
    missionId: request.context.missionId,
    phaseId: request.context.phaseId,
  };
}

function isApplicableAuthorization(
  authorization: ProductionAuthorizationGranted,
  releaseSha: string,
): boolean {
  return (
    authorization.state === 'AUTHORIZED' &&
    authorization.humanAuthority === 'LEANDRO' &&
    authorization.operationalGate === 'LEO' &&
    authorization.gateDecision === 'APPROVE' &&
    authorization.provenance === 'MCF_RUNTIME_PERSISTED_AUTHORIZATION' &&
    authorization.targetSha === releaseSha &&
    authorization.sourceDecision.trim().length > 0 &&
    authorization.authorizationId.trim().length > 0 &&
    authorization.evidenceRef.trim().length > 0
  );
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
    private readonly productionAuthorization: ProductionAuthorizationService,
    options: RenderProductionPromotionAdapterOptions = {},
  ) {
    this.productionRuntimeUrl =
      options.productionRuntimeUrl ?? process.env.MCF_PRODUCTION_RUNTIME_URL;
    this.deployHookUrl =
      options.deployHookUrl ?? process.env.RENDER_PRODUCTION_DEPLOY_HOOK_URL;
    this.fetcher = options.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? RENDER_PRODUCTION_PROMOTION_TIMEOUT_MS;
    this.pollIntervalMs =
      options.pollIntervalMs ?? RENDER_PRODUCTION_PROMOTION_POLL_INTERVAL_MS;
    this.sleepImpl = options.sleepImpl ?? sleep;

    if (
      !Number.isInteger(this.timeoutMs) ||
      this.timeoutMs < 1 ||
      this.timeoutMs >= EXTERNAL_ACTION_LEASE_MS
    ) {
      throw new Error(
        'production promotion adapter timeout must be positive and shorter than external action lease',
      );
    }
    if (!Number.isInteger(this.pollIntervalMs) || this.pollIntervalMs < 1) {
      throw new Error('production promotion adapter poll interval must be positive');
    }
  }

  supports(request: ExternalActionRequest): boolean {
    return (
      request.skill.skillId === 'MCF-DEPLOY-VALIDATE' &&
      canonicalizeProvider(request.tool.provider) === 'render' &&
      canonicalizeToolValue(request.tool.operation) === 'deploy-production' &&
      canonicalizeToolValue(String(request.inputs.target_environment ?? '')) === 'production'
    );
  }

  private async observeProduction(baseUrl: URL): Promise<ProductionObservation> {
    const versionUrl = new URL('/health/version', baseUrl);
    let versionResponse: Response;
    try {
      versionResponse = await this.fetcher(versionUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      throw new ExternalActionAdapterError(
        'NETWORK_FAILURE',
        error instanceof Error ? error.message : 'production health/version request failed',
        true,
      );
    }
    if (!versionResponse.ok) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        `production health/version returned HTTP ${versionResponse.status}`,
        versionResponse.status >= 500,
        versionResponse.status,
      );
    }

    let version: unknown;
    try {
      version = await versionResponse.json();
    } catch {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'production health/version returned invalid JSON',
        false,
      );
    }
    if (typeof version !== 'object' || version === null || Array.isArray(version)) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'production health/version response is invalid',
        false,
      );
    }
    const commitSha = exactSha(
      (version as Record<string, unknown>).commitSha,
      'production commitSha',
    );

    let readyResponse: Response;
    try {
      readyResponse = await this.fetcher(new URL('/health/ready', baseUrl), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      throw new ExternalActionAdapterError(
        'NETWORK_FAILURE',
        error instanceof Error ? error.message : 'production health/ready request failed',
        true,
      );
    }

    return {
      commitSha,
      ready: readyResponse.ok,
      readyStatus: readyResponse.status,
    };
  }

  private receipt(
    request: ExternalActionRequest,
    target: ProductionTarget,
    authorization: ProductionAuthorizationGranted,
    before: ProductionObservation,
    after: ProductionObservation,
    deploymentId: string,
    outcome: 'DEPLOYED' | 'NOOP',
  ): McfToolReceipt {
    const context = request.context!;
    return this.evidence.createTrustedReceipt({
      provider: 'render',
      operation: request.tool.operation,
      resource: request.tool.resource,
      externalId: deploymentId,
      commitSha: target.releaseSha,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        adapterId: this.adapterId,
        adapterVersion: '1.0.0',
        targetEnvironment: 'production',
        deploymentOutcome: outcome,
        deploymentStatus: 'success',
        smokeStatus: 'pass',
        rollbackAvailable: true,
        deploymentId,
        previousSha: before.commitSha,
        verifiedSha: after.commitSha,
        productionReady: after.ready,
        productionReadyStatus: after.readyStatus,
        authorizationId: authorization.authorizationId,
        authorizationEvidenceRef: authorization.evidenceRef,
        authorizationSourceDecision: authorization.sourceDecision,
        authorizationProvenance: authorization.provenance,
        humanAuthority: authorization.humanAuthority,
        operationalGate: authorization.operationalGate,
        requestId: target.idempotencyKey,
        missionId: context.missionId,
        phaseId: context.phaseId,
        expectedMissionVersion: context.expectedMissionVersion,
        skillId: request.skill.skillId,
        skillVersion: request.skill.version,
        agentId: request.agentId,
      },
    });
  }

  private unknownReceipt(
    request: ExternalActionRequest,
    target: ProductionTarget,
    authorization: ProductionAuthorizationGranted,
    before: ProductionObservation,
    deploymentId: string | null,
    reason: string,
  ): McfToolReceipt {
    const context = request.context!;
    return this.evidence.createTrustedReceipt({
      provider: 'render',
      operation: request.tool.operation,
      resource: request.tool.resource,
      externalId: deploymentId,
      commitSha: target.releaseSha,
      status: 'PARTIAL',
      observedAt: new Date().toISOString(),
      metadata: {
        adapterId: this.adapterId,
        adapterVersion: '1.0.0',
        targetEnvironment: 'production',
        deploymentOutcome: 'UNKNOWN',
        deploymentStatus: 'unknown',
        smokeStatus: 'unknown',
        rollbackAvailable: true,
        deploymentId,
        previousSha: before.commitSha,
        verifiedSha: null,
        authorizationId: authorization.authorizationId,
        authorizationEvidenceRef: authorization.evidenceRef,
        authorizationSourceDecision: authorization.sourceDecision,
        authorizationProvenance: authorization.provenance,
        humanAuthority: authorization.humanAuthority,
        operationalGate: authorization.operationalGate,
        requestId: target.idempotencyKey,
        reconciliationEligible: true,
        unknownReason: reason,
        missionId: context.missionId,
        phaseId: context.phaseId,
        expectedMissionVersion: context.expectedMissionVersion,
        skillId: request.skill.skillId,
        skillVersion: request.skill.version,
        agentId: request.agentId,
      },
    });
  }

  async execute(
    request: ExternalActionRequest,
    mutationBoundary?: ExternalActionMutationBoundary,
  ): Promise<McfToolReceipt> {
    const target = resolveTarget(request);

    const resolution = await this.productionAuthorization.resolveProductionAuthorization({
      missionId: target.missionId,
      phaseId: target.phaseId,
      releaseSha: target.releaseSha,
    });
    if (resolution.state !== 'AUTHORIZED' || !isApplicableAuthorization(resolution, target.releaseSha)) {
      throw new ExternalActionAdapterError(
        'PRODUCTION_AUTHORIZATION_REQUIRED',
        'production promotion requires applicable persisted LEANDRO authorization and LÉO operational gate for the exact SHA',
        false,
      );
    }

    if (!this.productionRuntimeUrl || !this.deployHookUrl) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'runtime-side production promotion requires production runtime URL and Render deploy hook configuration',
        false,
      );
    }
    const baseUrl = publicRuntimeUrl(this.productionRuntimeUrl);
    const hookUrl = renderDeployHook(this.deployHookUrl, target.releaseSha);
    const before = await this.observeProduction(baseUrl);
    if (!before.ready) {
      throw new ExternalActionAdapterError(
        'RESERVATION_CONFLICT',
        `production runtime is not healthy before promotion; HTTP ${before.readyStatus}`,
        false,
      );
    }

    if (before.commitSha === target.releaseSha) {
      return this.receipt(
        request,
        target,
        resolution,
        before,
        before,
        `production-current:${target.releaseSha}`,
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
    await mutationBoundary.persistReconciliationMetadata({
      provider: 'render',
      targetEnvironment: 'production',
      releaseSha: target.releaseSha,
      previousSha: before.commitSha,
      authorizationId: resolution.authorizationId,
      authorizationEvidenceRef: resolution.evidenceRef,
      authorizationProvenance: resolution.provenance,
      idempotencyKey: target.idempotencyKey,
      reconciliationEligible: true,
    });

    let deploymentResponse: Response;
    try {
      deploymentResponse = await this.fetcher(hookUrl, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      return this.unknownReceipt(
        request,
        target,
        resolution,
        before,
        null,
        error instanceof Error ? error.message : 'Render production deploy hook outcome is unknown',
      );
    }
    if (![200, 202].includes(deploymentResponse.status)) {
      return this.unknownReceipt(
        request,
        target,
        resolution,
        before,
        null,
        `Render production deploy hook returned HTTP ${deploymentResponse.status}`,
      );
    }

    let deploymentId: string | null = null;
    try {
      const body = (await deploymentResponse.json()) as unknown;
      if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
        const id = (body as Record<string, unknown>).id;
        if (typeof id === 'string' && id.trim().length > 0) deploymentId = id.trim();
      }
    } catch {
      deploymentId = null;
    }
    const correlationId = deploymentId ?? `render-hook:${target.releaseSha}`;

    const deadlineAt = Date.now() + this.timeoutMs;
    while (Date.now() < deadlineAt) {
      try {
        const after = await this.observeProduction(baseUrl);
        if (after.ready && after.commitSha === target.releaseSha) {
          return this.receipt(
            request,
            target,
            resolution,
            before,
            after,
            correlationId,
            'DEPLOYED',
          );
        }
      } catch {
        // The provider mutation may already be committed. Keep observing until
        // the bounded deadline instead of converting a post-write ambiguity to FAILED.
      }
      await this.sleepImpl(this.pollIntervalMs);
    }

    return this.unknownReceipt(
      request,
      target,
      resolution,
      before,
      correlationId,
      'production did not converge to the authorized exact SHA before the adapter deadline',
    );
  }
}
