import { createHash } from 'node:crypto';
import { execFile as nodeExecFile } from 'node:child_process';
import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

import type { McfToolReceipt } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';

export const ASTRYX_PROVIDER = 'mcf-astryx-cli';
export const ASTRYX_RESOURCE = 'astryx-design-system';
export const ASTRYX_SKILL = 'MCF-ASTRYX-COMPONENT-DISCOVERY';
export const ASTRYX_OPERATIONS = ['list-components', 'read-component-docs'] as const;

const MAX_OUTPUT_BYTES = 32_768;
const DEFAULT_TIMEOUT_MS = 10_000;
const ASTRYX_CLI_PACKAGE = '@astryxdesign/cli';
const ASTRYX_CORE_PACKAGE = '@astryxdesign/core';

type AstryxOperation = (typeof ASTRYX_OPERATIONS)[number];
type ExecFile = (
  file: string,
  args: string[],
  options: {
    cwd: string;
    timeout: number;
    maxBuffer: number;
    windowsHide: boolean;
  },
) => Promise<{ stdout: string; stderr: string }>;

const execFile: ExecFile = (file, args, options) =>
  new Promise((resolvePromise, rejectPromise) => {
    nodeExecFile(file, args, options, (error, stdout, stderr) => {
      if (error) {
        rejectPromise(error);
        return;
      }
      resolvePromise({
        stdout: String(stdout ?? ''),
        stderr: String(stderr ?? ''),
      });
    });
  });

function parseCliEnvelope(
  stdout: string,
  operation: AstryxOperation,
  componentName?: string,
): { cliVersion: string; coreVersion: string; cliCopy: string } {
  let envelope: unknown;

  try {
    envelope = JSON.parse(stdout);
  } catch {
    return invalid('Astryx CLI returned invalid JSON');
  }

  if (!isRecord(envelope) || envelope.apiVersion !== 1) {
    return invalid('Astryx CLI returned an unsupported JSON envelope');
  }

  const expectedType = operation === 'list-components' ? 'component.list' : 'component.detail';
  if (envelope.type !== expectedType || !isRecord(envelope.data)) {
    return invalid('Astryx CLI returned an unexpected component response');
  }

  if (operation === 'list-components') {
    if (!isRecord(envelope.data.components)) {
      return invalid('Astryx CLI component list is missing its component catalog');
    }
  } else if (envelope.data.name !== componentName) {
    return invalid('Astryx CLI documentation does not match the requested component');
  }

  if (!isRecord(envelope.meta) || !isRecord(envelope.meta.answeredBy)) {
    return invalid('Astryx CLI response is missing package provenance');
  }

  const answeredBy = envelope.meta.answeredBy;
  const cliVersion = answeredBy.cli;
  const coreVersion = answeredBy.core;
  const cliCopy = answeredBy.copy;
  const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;

  if (
    typeof cliVersion !== 'string' ||
    !semver.test(cliVersion) ||
    typeof coreVersion !== 'string' ||
    !semver.test(coreVersion) ||
    cliCopy !== 'project'
  ) {
    return invalid('Astryx CLI must report pinned project CLI and Core versions');
  }

  return { cliVersion, coreVersion, cliCopy };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalid(message: string): never {
  throw new ExternalActionAdapterError('INVALID_RESPONSE', message, false);
}

export class AstryxCliDiscoveryAdapter implements ExternalActionAdapter {
  readonly adapterId = 'mcf-astryx-cli-readonly-v1';

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly enabled: boolean,
    private readonly workspaceRoot: string,
    private readonly binary = 'pnpm',
    private readonly runner: ExecFile = execFile,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  supports(request: ExternalActionRequest): boolean {
    return (
      request.skill.skillId === ASTRYX_SKILL &&
      canonicalizeProvider(request.tool.provider) === ASTRYX_PROVIDER &&
      canonicalizeToolValue(request.tool.resource) === ASTRYX_RESOURCE &&
      ASTRYX_OPERATIONS.includes(canonicalizeToolValue(request.tool.operation) as AstryxOperation)
    );
  }

  private async resolveWorkspace(): Promise<string> {
    if (!isAbsolute(this.workspaceRoot)) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'Astryx workspace root must be absolute',
        false,
      );
    }

    try {
      const root = await realpath(resolve(this.workspaceRoot));
      const metadata = await stat(root);
      if (!metadata.isDirectory()) {
        throw new Error('not a directory');
      }
      return root;
    } catch {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'Astryx workspace is unavailable',
        false,
      );
    }
  }

  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    if (!this.supports(request)) {
      throw new ExternalActionAdapterError(
        'UNSUPPORTED_TARGET',
        'Astryx CLI operation is not allowlisted',
        false,
      );
    }
    if (!this.enabled) {
      throw new ExternalActionAdapterError(
        'UNSUPPORTED_TARGET',
        'Astryx CLI adapter is disabled',
        false,
      );
    }
    if (!isRecord(request.inputs)) {
      invalid('Astryx discovery inputs are invalid');
    }

    const operation = canonicalizeToolValue(request.tool.operation) as AstryxOperation;
    let args: string[];

    if (operation === 'list-components') {
      args = ['exec', 'astryx', '--json', 'component', '--list'];
    } else {
      const name = request.inputs.componentName;
      if (typeof name !== 'string' || !/^[A-Z][A-Za-z0-9]{0,63}$/u.test(name)) {
        throw new ExternalActionAdapterError(
          'INVALID_CONTEXT',
          'componentName must be a valid Astryx component identifier',
          false,
        );
      }
      args = ['exec', 'astryx', '--json', 'component', name, '--detail', 'compact'];
    }

    const cwd = await this.resolveWorkspace();
    let result: { stdout: string; stderr: string };

    try {
      result = await this.runner(this.binary, args, {
        cwd,
        timeout: Math.min(Math.max(this.timeoutMs, 1_000), 30_000),
        maxBuffer: MAX_OUTPUT_BYTES,
        windowsHide: true,
      });
    } catch (error) {
      const code =
        isRecord(error) && error.code === 'ETIMEDOUT' ? 'ADAPTER_TIMEOUT' : 'ADAPTER_FAILURE';
      throw new ExternalActionAdapterError(
        code,
        'Astryx CLI discovery failed; command output was not exposed',
        code === 'ADAPTER_TIMEOUT',
      );
    }

    const stdout = result.stdout.trim();
    if (!stdout || Buffer.byteLength(stdout, 'utf8') > MAX_OUTPUT_BYTES) {
      return invalid('Astryx CLI returned empty or oversized discovery output');
    }

    const componentName =
      operation === 'read-component-docs' && typeof request.inputs.componentName === 'string'
        ? request.inputs.componentName
        : undefined;
    const provenance = parseCliEnvelope(stdout, operation, componentName);
    const outputDigest = createHash('sha256').update(stdout).digest('hex');

    return this.evidence.createTrustedReceipt({
      provider: ASTRYX_PROVIDER,
      operation,
      resource: request.tool.resource,
      externalId: null,
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        adapterId: this.adapterId,
        cliPackage: ASTRYX_CLI_PACKAGE,
        corePackage: ASTRYX_CORE_PACKAGE,
        cliVersion: provenance.cliVersion,
        coreVersion: provenance.coreVersion,
        cliCopy: provenance.cliCopy,
        readOnly: true,
        command: [this.binary, ...args],
        workspace: cwd,
        stdout,
        stderr: result.stderr.slice(0, 2_048),
        exitCode: 0,
        outputBytes: Buffer.byteLength(stdout, 'utf8'),
        outputDigest,
      },
    });
  }
}
