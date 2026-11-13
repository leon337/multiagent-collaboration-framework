import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { isAbsolute } from 'node:path';

import type { McfToolReceipt } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionRequest,
  type ExternalActionMutationBoundary,
} from './external-action.contracts.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';

export const GOVERNED_BROWSER_PROVIDER = 'mcf-agent-bridge';
export const GOVERNED_BROWSER_OPERATION = 'inspect-governed-browser';
export const GOVERNED_BROWSER_RESOURCE = 'local-workspace';
const SCRIPT_SCHEMA = 'mcf-governed-browser-mission/v1';
const HEX_DIGEST = /^[a-f0-9]{64}$/u;
const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/u;
const HOST_PATTERN = /^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/u;
const SENSITIVE =
  /login|log.in|sign.in|sign.up|register|checkout|pay|purchase|delete|remove|publish|post|submit|account|password|settings|admin|token|logout/iu;
const MAX_RESPONSE = 256_000;

function canonicalPythonJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalPythonJson).join(', ') + ']';
  return (
    '{' +
    Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, item]) => JSON.stringify(key) + ': ' + canonicalPythonJson(item))
      .join(', ') +
    '}'
  );
}

/** Match the Python mission journal SHA-256, so receipts bind to actual event data. */
export function browserEvidenceDigest(events: unknown[]): string {
  return createHash('sha256').update(canonicalPythonJson(events)).digest('hex');
}

export interface BrowserMissionInput {
  missionId: string;
  instanceId: string;
  objective: string;
  startUrl: string;
  allowedHosts: string[];
  waypoints: string[];
  maxSteps: number;
  authorizedScope: true;
  restoreWorkspace: true;
}

export interface BrowserMissionResult {
  schema: string;
  missionId: string;
  instanceId: string;
  status: string;
  verified: boolean;
  completedSteps: number;
  restored: boolean;
  evidenceDigest: string;
  failureCode: string | null;
  events: Array<Record<string, unknown>>;
}

export interface BrowserMissionHost {
  run(input: BrowserMissionInput): Promise<BrowserMissionResult>;
}

export interface GovernedBrowserAdapterConfig {
  enabled: boolean;
  scriptPath: string;
  timeoutMs: number;
}

export class PythonGovernedBrowserHost implements BrowserMissionHost {
  constructor(private readonly config: GovernedBrowserAdapterConfig) {}

  async run(input: BrowserMissionInput): Promise<BrowserMissionResult> {
    if (
      !isAbsolute(this.config.scriptPath) ||
      this.config.timeoutMs < 1_000 ||
      this.config.timeoutMs > 120_000
    ) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'invalid local browser runner config',
        false,
      );
    }
    return await new Promise<BrowserMissionResult>((resolve, reject) => {
      const child = spawn('python3', [this.config.scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { PATH: process.env.PATH ?? '/usr/bin:/bin', HOME: process.env.HOME ?? '' },
      });
      let output = '';
      let exited = false;
      let timedOut = false;
      let overflow = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, this.config.timeoutMs);
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => {
        output += chunk;
        if (output.length > MAX_RESPONSE) {
          overflow = true;
          child.kill('SIGKILL');
        }
      });
      // Stderr may include sensitive local details. Never publish it as a mission error.
      child.stderr.resume();
      child.on('error', () => {
        if (exited) return;
        exited = true;
        clearTimeout(timer);
        reject(
          new ExternalActionAdapterError(
            'ADAPTER_FAILURE',
            'browser runner failed to start',
            false,
          ),
        );
      });
      child.on('close', (code) => {
        if (exited) return;
        exited = true;
        clearTimeout(timer);
        if (overflow) {
          reject(
            new ExternalActionAdapterError(
              'INVALID_RESPONSE',
              'browser runner response too large',
              false,
            ),
          );
          return;
        }
        if (timedOut) {
          reject(
            new ExternalActionAdapterError(
              'ADAPTER_TIMEOUT',
              'browser runner timed out; checkpoint needs reconciliation',
              false,
            ),
          );
          return;
        }
        try {
          const result = JSON.parse(output) as BrowserMissionResult;
          if (code !== 0) {
            reject(
              new ExternalActionAdapterError(
                'ADAPTER_FAILURE',
                'browser mission is blocked or recovering: ' +
                  String(result.failureCode ?? 'unknown').slice(0, 100),
                false,
              ),
            );
            return;
          }
          resolve(result);
        } catch {
          reject(
            new ExternalActionAdapterError(
              'INVALID_RESPONSE',
              'browser runner returned invalid JSON',
              false,
            ),
          );
        }
      });
      child.stdin.on('error', () => {});
      child.stdin.end(JSON.stringify(input));
    });
  }
}

function fail(message: string): never {
  throw new ExternalActionAdapterError('INVALID_CONTEXT', message, false);
}

function safeUrl(raw: unknown, hosts: string[]): string {
  if (typeof raw !== 'string' || raw.length > 2048) return fail('invalid browser URL');
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return fail('invalid browser URL');
  }
  if (
    u.protocol !== 'https:' ||
    u.username ||
    u.password ||
    u.port ||
    !hosts.includes(u.hostname) ||
    u.search ||
    u.hash ||
    SENSITIVE.test(u.pathname)
  ) {
    return fail('browser URL outside approved public scope');
  }
  return raw;
}

export function parseBrowserMissionInputs(raw: Record<string, unknown>): BrowserMissionInput {
  const {
    missionId,
    instanceId,
    objective,
    startUrl,
    allowedHosts,
    waypoints,
    maxSteps,
    authorizedScope,
    restoreWorkspace,
  } = raw;
  if (typeof missionId !== 'string' || !ID_PATTERN.test(missionId))
    return fail('invalid missionId');
  if (typeof instanceId !== 'string' || !ID_PATTERN.test(instanceId))
    return fail('invalid instanceId');
  if (typeof objective !== 'string' || objective.trim().length < 4 || objective.length > 400)
    return fail('invalid objective');
  if (
    !Array.isArray(allowedHosts) ||
    allowedHosts.length < 1 ||
    allowedHosts.length > 4 ||
    allowedHosts.some(
      (h) =>
        typeof h !== 'string' || !HOST_PATTERN.test(h) || !h.includes('.') || h !== h.toLowerCase(),
    ) ||
    new Set(allowedHosts).size !== allowedHosts.length
  )
    return fail('invalid allowedHosts');
  if (
    !Array.isArray(waypoints) ||
    waypoints.length < 1 ||
    waypoints.length > 7 ||
    waypoints.some(
      (w) => typeof w !== 'string' || w.trim().length < 2 || w.length > 100 || SENSITIVE.test(w),
    )
  )
    return fail('invalid waypoints');
  if (
    !Number.isInteger(maxSteps) ||
    (maxSteps as number) < waypoints.length + 1 ||
    (maxSteps as number) > 8
  )
    return fail('invalid maxSteps');
  if (authorizedScope !== true || restoreWorkspace !== true)
    return fail('authorized scope and workspace restoration are required');
  if (
    Object.keys(raw).some(
      (key) =>
        ![
          'missionId',
          'instanceId',
          'objective',
          'startUrl',
          'allowedHosts',
          'waypoints',
          'maxSteps',
          'authorizedScope',
          'restoreWorkspace',
        ].includes(key),
    )
  )
    return fail('unexpected mission input');
  const hosts = allowedHosts as string[];
  if (
    hosts.some(
      (h) =>
        h === 'localhost' ||
        h.startsWith('127.') ||
        h.startsWith('10.') ||
        h.startsWith('192.168.') ||
        h.startsWith('172.') ||
        h.startsWith('169.254.'),
    )
  )
    return fail('private address not allowed');
  return {
    missionId,
    instanceId,
    objective,
    startUrl: safeUrl(startUrl, hosts),
    allowedHosts: hosts,
    waypoints: waypoints as string[],
    maxSteps: maxSteps as number,
    authorizedScope: true,
    restoreWorkspace: true,
  };
}

export function verifyBrowserMissionResult(
  result: BrowserMissionResult,
  request: BrowserMissionInput,
): void {
  const error = (message: string): never => {
    throw new ExternalActionAdapterError('INVALID_RESPONSE', message, false);
  };
  if (
    result.schema !== SCRIPT_SCHEMA ||
    result.verified !== true ||
    result.status !== 'COMPLETED' ||
    result.restored !== true ||
    result.missionId !== request.missionId ||
    result.instanceId !== request.instanceId ||
    result.failureCode !== null ||
    result.completedSteps !== request.waypoints.length + 1 ||
    !HEX_DIGEST.test(result.evidenceDigest) ||
    !Array.isArray(result.events) ||
    result.events.length > 100
  )
    error('browser mission completion evidence is not valid');
  if (browserEvidenceDigest(result.events) !== result.evidenceDigest)
    error('browser evidence digest does not match the observed timeline');

  const verified = result.events.filter((e) => e.kind === 'NAVIGATION_VERIFIED');
  const planned = result.events.filter((e) => e.kind === 'SEMANTIC_PLAN');
  const restored = result.events.some((e) => e.kind === 'WORKSPACE_RESTORED');
  if (
    verified.length !== result.completedSteps ||
    planned.length !== request.waypoints.length ||
    !restored
  ) {
    error('browser navigation evidence is incomplete');
  }
  for (let i = 0; i < verified.length; i += 1) {
    const event = verified[i];
    if (
      !event ||
      event.step !== i ||
      !HEX_DIGEST.test(String(event.textDigest)) ||
      typeof event.textLength !== 'number' ||
      event.textLength <= 0
    ) {
      error('browser step evidence is malformed');
    }
    safeUrl(event?.url, request.allowedHosts);
  }
  for (let i = 0; i < planned.length; i += 1) {
    const event = planned[i];
    if (!event || event.step !== i + 1 || event.targetLabel !== request.waypoints[i])
      error('browser semantic plan is not bound to mission waypoints');
  }
  if (verified[0]?.url !== request.startUrl) error('browser start URL differs from approved input');
}

export class GovernedBrowserExternalAdapter implements ExternalActionAdapter {
  readonly adapterId = 'mcf-governed-browser-local-v1';

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly config: GovernedBrowserAdapterConfig,
    private readonly host: BrowserMissionHost = new PythonGovernedBrowserHost(config),
  ) {}

  supports(request: ExternalActionRequest): boolean {
    return (
      request.skill.skillId === 'MCF-AUTONOMOUS-BROWSER-RESEARCH' &&
      canonicalizeProvider(request.tool.provider) === GOVERNED_BROWSER_PROVIDER &&
      canonicalizeToolValue(request.tool.operation) === GOVERNED_BROWSER_OPERATION &&
      canonicalizeToolValue(request.tool.resource) === GOVERNED_BROWSER_RESOURCE
    );
  }

  async execute(
    request: ExternalActionRequest,
    mutationBoundary?: ExternalActionMutationBoundary,
  ): Promise<McfToolReceipt> {
    if (!this.config.enabled || process.env.NODE_ENV === 'production')
      throw new ExternalActionAdapterError(
        'UNSUPPORTED_TARGET',
        'local governed browser is disabled',
        false,
      );
    if (!this.supports(request))
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'invalid governed browser route',
        false,
      );
    const mission = parseBrowserMissionInputs(request.inputs);
    if (mutationBoundary) {
      // Durable PREPARED metadata is committed before the workspace is touched.
      await mutationBoundary.persistReconciliationMetadata({
        schema: 'mcf-governed-browser-reconciliation/v1',
        missionId: mission.missionId,
        instanceId: mission.instanceId,
        plannedSteps: mission.waypoints.length + 1,
        operation: GOVERNED_BROWSER_OPERATION,
        effect: 'local-workspace-navigation',
      });
    }
    const result = await this.host.run(mission);
    verifyBrowserMissionResult(result, mission);
    return this.evidence.createTrustedReceipt({
      provider: GOVERNED_BROWSER_PROVIDER,
      operation: GOVERNED_BROWSER_OPERATION,
      resource: GOVERNED_BROWSER_RESOURCE,
      externalId: mission.missionId,
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        missionId: mission.missionId,
        instanceId: mission.instanceId,
        completedSteps: result.completedSteps,
        waypointCount: mission.waypoints.length,
        restored: true,
        verified: true,
        conclusion: 'COMPLETED',
        evidenceDigest: result.evidenceDigest,
        executionMode: 'BOUNDED_SEMANTIC_BROWSER',
        publicReadOnly: true,
        events: result.events,
      },
    });
  }
}
