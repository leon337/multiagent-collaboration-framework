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

export const GOOGLE_BRIDGE_PROVIDER = 'mcf-google-bridge';
export const GOOGLE_BRIDGE_RESOURCE = 'google-cloud';
export const GOOGLE_BRIDGE_SKILL = 'MCF-GOOGLE-CLOUD-READ';
export const GOOGLE_BRIDGE_OPERATIONS = {
  status: 'google.status',
  'list-projects': 'google.cloud.projects',
} as const;

const ENDPOINT = 'http://127.0.0.1:8755/v1/execute';
const MAX_RESPONSE_BYTES = 65_536;
const TIMEOUT_MS = 25_000;

type BridgeOperation = keyof typeof GOOGLE_BRIDGE_OPERATIONS;
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function invalidResponse(): never {
  throw new ExternalActionAdapterError('INVALID_RESPONSE', 'Google Bridge returned invalid read-only data', false);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function localBearer(): Promise<string> {
  const file = join(homedir(), '.config', 'mcf-google-bridge', 'http-token');
  try {
    const metadata = await lstat(file);
    if (!metadata.isFile() || (metadata.mode & 0o077) !== 0 ||
        (typeof process.getuid === 'function' && metadata.uid !== process.getuid())) {
      throw new Error('insecure token file');
    }
    const token = (await readFile(file, 'utf8')).trim();
    if (!/^[A-Za-z0-9._~-]{24,256}$/u.test(token)) throw new Error('invalid token');
    return token;
  } catch {
    throw new ExternalActionAdapterError(
      'AUTHENTICATION_REQUIRED', 'Local Google Bridge authentication is unavailable', false, 401,
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
    return JSON.parse(Buffer.concat(parts.map((part) => Buffer.from(part)), total).toString('utf8')) as unknown;
  } catch (error) {
    if (error instanceof ExternalActionAdapterError) throw error;
    return invalidResponse();
  } finally {
    reader.releaseLock();
  }
}

export class GoogleBridgeReadAdapter implements ExternalActionAdapter {
  readonly adapterId = 'mcf-google-bridge-readonly-local-v1';

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly enabled: boolean,
    private readonly transport: FetchLike = fetch,
    private readonly readBearer: () => Promise<string> = localBearer,
  ) {}

  supports(request: ExternalActionRequest): boolean {
    return request.skill.skillId === GOOGLE_BRIDGE_SKILL &&
      canonicalizeProvider(request.tool.provider) === GOOGLE_BRIDGE_PROVIDER &&
      canonicalizeToolValue(request.tool.resource) === GOOGLE_BRIDGE_RESOURCE &&
      Object.hasOwn(GOOGLE_BRIDGE_OPERATIONS, canonicalizeToolValue(request.tool.operation));
  }

  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    if (!this.supports(request)) {
      throw new ExternalActionAdapterError('UNSUPPORTED_TARGET', 'Google Bridge tool is not allowlisted', false);
    }
    if (!this.enabled) {
      throw new ExternalActionAdapterError('UNSUPPORTED_TARGET', 'Google Bridge runtime adapter is disabled', false);
    }

    const operation = canonicalizeToolValue(request.tool.operation) as BridgeOperation;
    const bridgeOperation = GOOGLE_BRIDGE_OPERATIONS[operation];
    const token = await this.readBearer();
    let response: Response;
    try {
      response = await this.transport(ENDPOINT, {
        method: 'POST',
        headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
        body: JSON.stringify({ operation: bridgeOperation, args: {} }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'error',
      });
    } catch (error) {
      const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
      throw new ExternalActionAdapterError(
        timedOut ? 'ADAPTER_TIMEOUT' : 'NETWORK_FAILURE',
        timedOut ? 'Google Bridge request timed out' : 'Local Google Bridge transport failed',
        true,
      );
    }

    if (!response.ok) {
      const code = response.status === 401 ? 'AUTHENTICATION_REQUIRED'
        : response.status === 429 ? 'RATE_LIMITED'
        : response.status === 403 ? 'UNSUPPORTED_TARGET'
        : response.status >= 500 ? 'NETWORK_FAILURE' : 'ADAPTER_FAILURE';
      throw new ExternalActionAdapterError(code, 'Google Bridge request failed', response.status === 429 || response.status >= 500, response.status);
    }

    const payload = await readLimitedResponse(response);
    if (!isRecord(payload) || typeof payload.trace_id !== 'string' ||
        !/^[0-9a-f-]{36}$/iu.test(payload.trace_id) || payload.operation !== bridgeOperation ||
        !isRecord(payload.result)) return invalidResponse();

    let metadata: Record<string, unknown>;
    if (operation === 'list-projects') {
      const projects = payload.result.projects;
      if (!Array.isArray(projects) || projects.length > 20) return invalidResponse();
      const safeProjects = projects.map((project) => {
        if (!isRecord(project) || typeof project.projectId !== 'string' ||
            !/^[a-z][a-z0-9-]{4,62}$/u.test(project.projectId) ||
            typeof project.displayName !== 'string' || project.displayName.length > 150 ||
            typeof project.state !== 'string' || project.state.length > 40) return invalidResponse();
        return { projectId: project.projectId, displayName: project.displayName, state: project.state };
      });
      metadata = { projects: safeProjects, projectCount: safeProjects.length };
    } else {
      const result = payload.result;
      if (typeof result.service !== 'string' || result.service !== 'mcf-google-bridge' ||
          typeof result.version !== 'string' || result.version.length > 32 ||
          typeof result.oauthConnected !== 'boolean' ||
          typeof result.adcConfigured !== 'boolean') return invalidResponse();
      metadata = {
        service: result.service, bridgeVersion: result.version,
        oauthConnected: result.oauthConnected, adcConfigured: result.adcConfigured,
      };
    }
    return this.evidence.createTrustedReceipt({
      provider: GOOGLE_BRIDGE_PROVIDER,
      operation,
      resource: request.tool.resource,
      externalId: payload.trace_id,
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: { ...metadata, bridgeTraceId: payload.trace_id, adapterId: this.adapterId, readOnly: true, binding: 'loopback' },
    });
  }
}
