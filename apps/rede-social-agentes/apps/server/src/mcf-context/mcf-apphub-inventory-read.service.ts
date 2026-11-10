import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { isAbsolute } from 'node:path';

import { Injectable } from '@nestjs/common';

const execFile = promisify(execFileCallback);
const ENABLE_VALUE = 'LOCAL_READ_ONLY';
const GOOGLE_PROJECT = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/u;
const GOOGLE_ACCOUNT = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/u;
const MAX_PAGE_SIZE = 100;
const MAX_PAGES = 10;
const MAX_RECORDS = 1_000;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 512 * 1024;
type Collection = 'applications' | 'discoveredServices' | 'discoveredWorkloads';

export type McfAppHubInventoryConfiguration = {
  project: string;
  account: string;
  gcloudBin: string;
  location: 'global';
};

export type McfAppHubInventoryItem = {
  name: string;
  display_name: string | null;
  resource_uri: string | null;
  gcp_project: string | null;
  functional_type: string | null;
  registration_type: string | null;
};

export type McfAppHubInventoryReceipt = {
  schema_version: 1;
  protocol: 'MCF_APPHUB_CONTEXT_FABRIC_READ_V1';
  read_only: true;
  material_action: false;
  evidence_only: true;
  provider_payload_persisted_by_mcf: false;
  project_id: string;
  location: 'global';
  observed_at: string;
  provenance: {
    source_ref: string;
    source_mode: 'LIVE_PROVIDER_READ';
    freshness: 'LIVE_REQUIRED';
  };
  inventory: Record<Collection, McfAppHubInventoryItem[]>;
  counts: Record<Collection, number>;
};

export type McfAppHubErrorCode =
  | 'MCF_APPHUB_READ_DISABLED'
  | 'MCF_APPHUB_BUSY'
  | 'MCF_APPHUB_AUTH_FAILED'
  | 'MCF_APPHUB_UPSTREAM_FAILED'
  | 'MCF_APPHUB_TIMEOUT'
  | 'MCF_APPHUB_CONTRACT_INVALID';

export class McfAppHubInventoryUnavailableError extends Error {
  constructor(public readonly code: McfAppHubErrorCode) {
    super('The App Hub inventory read is unavailable.');
    this.name = 'McfAppHubInventoryUnavailableError';
  }
}

export function loadMcfAppHubInventoryConfiguration(
  env: NodeJS.ProcessEnv,
): McfAppHubInventoryConfiguration | null {
  // Never enable this local gcloud adapter in production, regardless of configuration.
  if (env.NODE_ENV === 'production' || env.MCF_APPHUB_INVENTORY_ENABLE !== ENABLE_VALUE) {
    return null;
  }
  const project = env.MCF_APPHUB_PROJECT_ID ?? '';
  const account = env.MCF_APPHUB_ACCOUNT ?? '';
  const gcloudBin = env.MCF_APPHUB_GCLOUD_BIN ?? '';
  if (
    !GOOGLE_PROJECT.test(project) ||
    !GOOGLE_ACCOUNT.test(account) ||
    !isAbsolute(gcloudBin) ||
    gcloudBin.length > 4096 ||
    /[\r\n\0]/u.test(gcloudBin)
  ) {
    return null;
  }
  return { project, account, gcloudBin, location: 'global' };
}

export type McfAppHubTokenProvider = (config: McfAppHubInventoryConfiguration) => Promise<string>;
export type McfAppHubFetch = (url: string, init: RequestInit) => Promise<Response>;

async function localGcloudToken(config: McfAppHubInventoryConfiguration): Promise<string> {
  try {
    // Fixed argument vector, no shell or caller-controlled flags; stdout never logged.
    const result = await execFile(
      config.gcloudBin,
      ['auth', 'print-access-token', '--account=' + config.account, '--quiet'],
      { timeout: 6_000, maxBuffer: 8_192, windowsHide: true },
    );
    const token = result.stdout.trim();
    if (!/^[A-Za-z0-9._~+/-]{20,4096}$/u.test(token)) throw new Error('invalid credential');
    return token;
  } catch {
    throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_AUTH_FAILED');
  }
}

function boundedText(value: unknown, maximum = 2048): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum ? value : null;
}

function selectKnownFields(
  value: unknown,
  project: string,
  location: string,
  collection: Collection,
): McfAppHubInventoryItem {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_CONTRACT_INVALID');
  }
  const item = value as Record<string, unknown>;
  const name = boundedText(item.name, 512);
  if (!name || !name.startsWith(`projects/${project}/locations/${location}/${collection}/`)) {
    throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_CONTRACT_INVALID');
  }
  const serviceReference = item.serviceReference as Record<string, unknown> | undefined;
  const serviceProperties = item.serviceProperties as Record<string, unknown> | undefined;
  const workloadReference = item.workloadReference as Record<string, unknown> | undefined;
  const workloadProperties = item.workloadProperties as Record<string, unknown> | undefined;
  const functionalType = (serviceProperties?.functionalType ??
    workloadProperties?.functionalType) as Record<string, unknown> | undefined;
  const registrationType = (serviceProperties?.registrationType ??
    workloadProperties?.registrationType) as Record<string, unknown> | undefined;

  return {
    name,
    display_name: boundedText(item.displayName, 256),
    resource_uri: boundedText(serviceReference?.uri ?? workloadReference?.uri),
    gcp_project: boundedText(serviceProperties?.gcpProject ?? workloadProperties?.gcpProject, 256),
    functional_type: boundedText(functionalType?.type, 64),
    registration_type: boundedText(registrationType?.type, 64),
  };
}

@Injectable()
export class McfAppHubInventoryReadService {
  private busy = false;

  constructor(
    private readonly configuration: McfAppHubInventoryConfiguration | null,
    private readonly tokenProvider: McfAppHubTokenProvider = localGcloudToken,
    private readonly fetchProvider: McfAppHubFetch = fetch,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  static fromEnvironment(env: NodeJS.ProcessEnv = process.env): McfAppHubInventoryReadService {
    return new McfAppHubInventoryReadService(loadMcfAppHubInventoryConfiguration(env));
  }

  private async list(
    collection: Collection,
    token: string,
    config: McfAppHubInventoryConfiguration,
  ): Promise<McfAppHubInventoryItem[]> {
    const items: McfAppHubInventoryItem[] = [];
    const seenTokens = new Set<string>();
    let nextToken: string | null = null;
    const names = new Set<string>();

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const url = new URL(
        `https://apphub.googleapis.com/v1/projects/${config.project}/locations/global/${collection}`,
      );
      url.searchParams.set('pageSize', String(MAX_PAGE_SIZE));
      if (nextToken !== null) url.searchParams.set('pageToken', nextToken);
      let response: Response;
      try {
        response = await this.fetchProvider(url.toString(), {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          redirect: 'error',
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (error) {
        const timedOut = error instanceof Error && /timeout|aborted/i.test(error.message);
        throw new McfAppHubInventoryUnavailableError(
          timedOut ? 'MCF_APPHUB_TIMEOUT' : 'MCF_APPHUB_UPSTREAM_FAILED',
        );
      }

      if (!response.ok) {
        throw new McfAppHubInventoryUnavailableError(
          response.status === 401 || response.status === 403
            ? 'MCF_APPHUB_AUTH_FAILED'
            : 'MCF_APPHUB_UPSTREAM_FAILED',
        );
      }
      const declaredBytes = Number(response.headers.get('content-length') ?? 0);
      if (declaredBytes > MAX_RESPONSE_BYTES) {
        throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_CONTRACT_INVALID');
      }
      // Bound the body while streaming; Content-Length is not a trustworthy limit.
      let raw: string;
      try {
        if (response.body === null) throw new Error('Missing response stream');
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8', { fatal: true });
        let bytes = 0;
        const chunks: string[] = [];
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > MAX_RESPONSE_BYTES) {
              throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_CONTRACT_INVALID');
            }
            chunks.push(decoder.decode(value, { stream: true }));
          }
          chunks.push(decoder.decode());
        } finally {
          void reader.cancel().catch(() => {});
        }
        raw = chunks.join('');
      } catch (error) {
        if (error instanceof McfAppHubInventoryUnavailableError) throw error;
        throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_UPSTREAM_FAILED');
      }
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_CONTRACT_INVALID');
      }
      if (payload === null || Array.isArray(payload) || typeof payload !== 'object') {
        throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_CONTRACT_INVALID');
      }
      if (
        payload.unreachable !== undefined &&
        (!Array.isArray(payload.unreachable) || payload.unreachable.length > 0)
      ) {
        throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_UPSTREAM_FAILED');
      }
      const records = payload[collection] ?? [];
      if (
        !Array.isArray(records) ||
        records.length > MAX_PAGE_SIZE ||
        records.length + items.length > MAX_RECORDS
      ) {
        throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_CONTRACT_INVALID');
      }
      for (const record of records) {
        const item = selectKnownFields(record, config.project, config.location, collection);
        if (names.has(item.name))
          throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_CONTRACT_INVALID');
        names.add(item.name);
        items.push(item);
      }

      const cursor = payload.nextPageToken;
      if (cursor === undefined || cursor === '') return items;
      if (typeof cursor !== 'string' || cursor.length > 2048 || seenTokens.has(cursor)) {
        throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_CONTRACT_INVALID');
      }
      seenTokens.add(cursor);
      nextToken = cursor;
    }
    throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_CONTRACT_INVALID');
  }

  async readOnly(): Promise<McfAppHubInventoryReceipt> {
    const config = this.configuration;
    if (config === null) {
      throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_READ_DISABLED');
    }
    if (this.busy) throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_BUSY');
    this.busy = true;
    try {
      const token = await this.tokenProvider(config);
      if (typeof token !== 'string' || token.length < 20) {
        throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_AUTH_FAILED');
      }
      // No partial result: all three collections must succeed before a receipt is published.
      const applications = await this.list('applications', token, config);
      const discoveredServices = await this.list('discoveredServices', token, config);
      const discoveredWorkloads = await this.list('discoveredWorkloads', token, config);
      return {
        schema_version: 1,
        protocol: 'MCF_APPHUB_CONTEXT_FABRIC_READ_V1',
        read_only: true,
        material_action: false,
        evidence_only: true,
        provider_payload_persisted_by_mcf: false,
        project_id: config.project,
        location: 'global',
        observed_at: this.now(),
        provenance: {
          source_ref: `gcp-apphub://projects/${config.project}/locations/global`,
          source_mode: 'LIVE_PROVIDER_READ',
          freshness: 'LIVE_REQUIRED',
        },
        inventory: { applications, discoveredServices, discoveredWorkloads },
        counts: {
          applications: applications.length,
          discoveredServices: discoveredServices.length,
          discoveredWorkloads: discoveredWorkloads.length,
        },
      };
    } catch (error) {
      if (error instanceof McfAppHubInventoryUnavailableError) throw error;
      // Never disclose tokens, provider payloads, internal paths or error stack to the client.
      throw new McfAppHubInventoryUnavailableError('MCF_APPHUB_UPSTREAM_FAILED');
    } finally {
      this.busy = false;
    }
  }
}
