import { randomUUID } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import type { McfToolReceipt } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';

export const GOOGLE_CLOUD_PROVISION_PROVIDER = 'mcf-google-bridge';
export const GOOGLE_CLOUD_PROVISION_RESOURCE = 'google-cloud';
export const GOOGLE_CLOUD_PROVISION_SKILL = 'MCF-GOOGLE-CLOUD-PROVISION';
export const GOOGLE_CLOUD_PROVISION_OPERATIONS = {
  'create-project': 'google.cloud.projects.create',
  'enable-maps-apis': 'google.cloud.services.enableMaps',
  'create-maps-key': 'google.cloud.apiKeys.createMaps',
  'inspect-maps-key': 'google.cloud.apiKeys.inspectMaps',
} as const;

const ENDPOINT = 'http://127.0.0.1:8755/v1/execute';
const MAX_RESPONSE_BYTES = 65_536;
const TIMEOUT_MS = 45_000;
const MAPS_SERVICES = [
  'geocoding-backend.googleapis.com',
  'routes.googleapis.com',
  'apikeys.googleapis.com',
] as const;
const MAPS_KEY_SERVICES = [
  'geocoding-backend.googleapis.com',
  'routes.googleapis.com',
] as const;

type ProvisionOperation = keyof typeof GOOGLE_CLOUD_PROVISION_OPERATIONS;
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function invalidResponse(): never {
  throw new ExternalActionAdapterError(
    'INVALID_RESPONSE',
    'Google Cloud provisioning returned invalid metadata',
    false,
  );
}
function validProjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/u.test(value);
}
function validMissionId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z][a-z0-9-]{2,39}$/u.test(value);
}
async function localBearer(): Promise<string> {
  const file = join(homedir(), '.config', 'mcf-google-bridge', 'http-token');
  try {
    const metadata = await lstat(file);
    if (
      !metadata.isFile() ||
      metadata.isSymbolicLink() ||
      (metadata.mode & 0o077) !== 0 ||
      (typeof process.getuid === 'function' && metadata.uid !== process.getuid())
    ) {
      throw new Error('insecure token file');
    }
    const token = (await readFile(file, 'utf8')).trim();
    if (!/^[A-Za-z0-9._~-]{24,256}$/u.test(token)) throw new Error('invalid token');
    return token;
  } catch {
    throw new ExternalActionAdapterError(
      'AUTHENTICATION_REQUIRED',
      'Local Google Bridge authentication is unavailable',
      false,
      401,
    );
  }
}
async function readLimitedResponse(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) return invalidResponse();
  const parts: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        void reader.cancel().catch(() => undefined);
        return invalidResponse();
      }
      parts.push(value);
    }
    return JSON.parse(
      Buffer.concat(parts.map((part) => Buffer.from(part)), total).toString('utf8'),
    ) as unknown;
  } catch (error) {
    if (error instanceof ExternalActionAdapterError) throw error;
    return invalidResponse();
  } finally {
    reader.releaseLock();
  }
}

export class GoogleCloudProvisionAdapter implements ExternalActionAdapter {
  readonly adapterId = 'mcf-google-cloud-provision-local-v1';

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly enabled: boolean,
    private readonly transport: FetchLike = fetch,
    private readonly readBearer: () => Promise<string> = localBearer,
  ) {}

  supports(request: ExternalActionRequest): boolean {
    return (
      request.skill.skillId === GOOGLE_CLOUD_PROVISION_SKILL &&
      canonicalizeProvider(request.tool.provider) === GOOGLE_CLOUD_PROVISION_PROVIDER &&
      canonicalizeToolValue(request.tool.resource) === GOOGLE_CLOUD_PROVISION_RESOURCE &&
      Object.hasOwn(
        GOOGLE_CLOUD_PROVISION_OPERATIONS,
        canonicalizeToolValue(request.tool.operation),
      )
    );
  }

  private receipt(
    request: ExternalActionRequest,
    status: 'SUCCEEDED' | 'PARTIAL',
    externalId: string,
    metadata: Record<string, unknown>,
  ): McfToolReceipt {
    return this.evidence.createTrustedReceipt({
      provider: GOOGLE_CLOUD_PROVISION_PROVIDER,
      operation: canonicalizeToolValue(request.tool.operation),
      resource: request.tool.resource,
      externalId,
      commitSha: null,
      status,
      observedAt: new Date().toISOString(),
      metadata: {
        ...metadata,
        adapterId: this.adapterId,
        bridgeTraceId: externalId,
        readOnly: false,
        binding: 'loopback',
        billingMutationAllowed: false,
      },
    });
  }

  private unknownReceipt(
    request: ExternalActionRequest,
    traceId: string,
    reason: string,
    operationName?: string,
  ): McfToolReceipt {
    return this.receipt(request, 'PARTIAL', traceId, {
      outcome: 'UNKNOWN',
      reconciliationRequired: true,
      reason,
      ...(operationName ? { operationName } : {}),
      projectId: request.inputs.projectId,
    });
  }

  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    if (!this.supports(request)) {
      throw new ExternalActionAdapterError(
        'UNSUPPORTED_TARGET',
        'Google Cloud provisioning target is not allowlisted',
        false,
      );
    }
    if (!this.enabled) {
      throw new ExternalActionAdapterError(
        'UNSUPPORTED_TARGET',
        'Google Cloud provisioning runtime adapter is disabled',
        false,
      );
    }

    const operation = canonicalizeToolValue(request.tool.operation) as ProvisionOperation;
    const bridgeOperation = GOOGLE_CLOUD_PROVISION_OPERATIONS[operation];
    const projectId = request.inputs.projectId;
    const missionId = request.inputs.missionId;
    if (
      !validProjectId(projectId) ||
      !validMissionId(missionId) ||
      request.inputs.approvedProjectId !== projectId ||
      request.inputs.humanGateApproved !== true ||
      request.inputs.authorizedScope !== true ||
      request.inputs.sensitiveAuthorization !== true ||
      request.inputs.cloudAccountVerified !== true ||
      request.inputs.cloudTermsAccepted !== true
    ) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'Google Cloud provisioning requires an approved project, verified account, accepted terms and explicit scoped authorization',
        false,
        403,
      );
    }

    const args: Record<string, string> = { projectId, missionId };
    if (operation === 'create-project') {
      const displayName = request.inputs.displayName;
      if (typeof displayName !== 'string' || displayName.length < 4 || displayName.length > 30) {
        throw new ExternalActionAdapterError('INVALID_CONTEXT', 'Invalid Google Cloud display name', false);
      }
      args.displayName = displayName;
    }

    let token: string;
    try {
      token = await this.readBearer();
    } catch (error) {
      throw error;
    }

    let response: Response;
    try {
      response = await this.transport(ENDPOINT, {
        method: 'POST',
        headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
        body: JSON.stringify({ operation: bridgeOperation, args }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'error',
      });
    } catch {
      return this.unknownReceipt(request, randomUUID(), 'TRANSPORT_OUTCOME_UNKNOWN');
    }

    if (!response.ok) {
      if (response.status === 429 || response.status >= 500) {
        return this.unknownReceipt(request, '00000000-0000-4000-8000-000000000000', 'PROVIDER_OUTCOME_UNKNOWN');
      }
      const code =
        response.status === 401
          ? 'AUTHENTICATION_REQUIRED'
          : response.status === 403
            ? 'UNSUPPORTED_TARGET'
            : response.status === 404
              ? 'TARGET_NOT_FOUND'
              : 'ADAPTER_FAILURE';
      throw new ExternalActionAdapterError(code, 'Google Cloud provisioning request failed', false, response.status);
    }

    let payload: unknown;
    try {
      payload = await readLimitedResponse(response);
    } catch {
      return this.unknownReceipt(request, '00000000-0000-4000-8000-000000000000', 'RESPONSE_UNVERIFIABLE');
    }
    if (
      !isRecord(payload) ||
      typeof payload.trace_id !== 'string' ||
      !/^[0-9a-f-]{36}$/iu.test(payload.trace_id) ||
      payload.operation !== bridgeOperation ||
      !isRecord(payload.result)
    ) {
      return this.unknownReceipt(request, '00000000-0000-4000-8000-000000000000', 'RESPONSE_UNVERIFIABLE');
    }

    const result = payload.result;
    if (result.status !== 'SUCCEEDED') {
      return this.unknownReceipt(
        request,
        payload.trace_id,
        typeof result.reason === 'string' ? result.reason : 'PROVISIONING_PENDING',
        typeof result.operationName === 'string' ? result.operationName : undefined,
      );
    }

    const metadata: Record<string, unknown> = { projectId, missionId, billingEnabled: false, billingLinked: false };
    if (operation === 'create-project') {
      if (
        result.projectId !== projectId ||
        result.billingLinked !== false ||
        result.billingEnabled !== false ||
        typeof result.projectNumber !== 'string' ||
        typeof result.displayName !== 'string' ||
        typeof result.state !== 'string' ||
        result.billingLinked !== false ||
        result.billingEnabled !== false
      ) return invalidResponse();
      Object.assign(metadata, {
        projectNumber: result.projectNumber,
        displayName: result.displayName,
        projectState: result.state,
        reused: result.reused === true,
        billingLinked: false,
      });
    } else if (operation === 'enable-maps-apis') {
      if (
        result.projectId !== projectId ||
        result.billingLinked !== false ||
        result.billingEnabled !== false ||
        !Array.isArray(result.services) ||
        result.services.length !== MAPS_SERVICES.length
      ) return invalidResponse();
      const services = result.services.map((item) => {
        if (!isRecord(item) || typeof item.service !== 'string' || item.state !== 'ENABLED') {
          return invalidResponse();
        }
        return item.service;
      }).sort();
      if (services.join('|') !== [...MAPS_SERVICES].sort().join('|')) return invalidResponse();
      Object.assign(metadata, { enabledServices: services });
    } else if (operation === 'create-maps-key') {
      if (
        result.projectId !== projectId ||
        result.billingLinked !== false ||
        result.billingEnabled !== false ||
        typeof result.projectNumber !== 'string' ||
        !/^\d{6,20}$/u.test(result.projectNumber) ||
        result.keyResourceName !== `projects/${result.projectNumber}/locations/global/keys/mcf-obras-maps-v1` ||
        result.keyId !== 'mcf-obras-maps-v1' ||
        !Array.isArray(result.apiRestrictions) ||
        result.apiRestrictions.length !== MAPS_KEY_SERVICES.length ||
        result.apiRestrictions.some((service) => typeof service !== 'string') ||
        typeof result.secretAlias !== 'string' ||
        result.secretAlias !== 'agente-logistica-obras/google_maps_api_key' ||
        typeof result.secretFingerprint !== 'string' ||
        !/^[a-f0-9]{64}$/u.test(result.secretFingerprint) ||
        result.status !== 'SUCCEEDED'
      ) return invalidResponse();
      const restrictions = result.apiRestrictions.filter((item): item is string => typeof item === 'string').sort();
      if (restrictions.join('|') !== [...MAPS_KEY_SERVICES].sort().join('|')) return invalidResponse();
      Object.assign(metadata, {
        projectNumber: result.projectNumber,
        keyResourceName: result.keyResourceName,
        keyId: result.keyId,
        apiRestrictions: restrictions,
        secretAlias: result.secretAlias,
        secretFingerprint: result.secretFingerprint,
        secretStored: true,
      });
    } else if (operation === 'inspect-maps-key') {
      if (
        result.projectId !== projectId ||
        typeof result.projectNumber !== 'string' ||
        !/^\d{6,20}$/u.test(result.projectNumber) ||
        result.keyResourceName !== `projects/${result.projectNumber}/locations/global/keys/mcf-obras-maps-v1` ||
        result.restrictionsValid !== true ||
        result.secretStored !== true ||
        result.keyId !== 'mcf-obras-maps-v1'
      ) return invalidResponse();
      Object.assign(metadata, {
        projectNumber: result.projectNumber,
        keyResourceName: result.keyResourceName,
        keyId: result.keyId,
        apiRestrictions: result.apiRestrictions,
        secretStored: true,
      });
    }
    return this.receipt(request, 'SUCCEEDED', payload.trace_id, metadata);
  }
}
