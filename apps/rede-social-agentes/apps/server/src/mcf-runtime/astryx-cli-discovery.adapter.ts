import { createHash } from 'node:crypto';
import { execFile as nodeExecFile } from 'node:child_process';
import { readFile, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

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
const MAX_STDERR_BYTES = 2_048;
const DEFAULT_TIMEOUT_MS = 10_000;
const ASTRYX_CLI_PACKAGE = '@astryxdesign/cli';
const ASTRYX_CORE_PACKAGE = '@astryxdesign/core';
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;

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

type AstryxCliPackages = {
  cliPackageRoot: string;
  cliBinary: string;
  cliVersion: string;
  corePackageRoot: string;
  coreVersion: string;
};

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isWithin(parent: string, child: string): boolean {
  const candidate = relative(parent, child);
  return (
    candidate === '' ||
    (candidate !== '..' && !candidate.startsWith(`..${sep}`) && !isAbsolute(candidate))
  );
}

function truncateUtf8(value: string, maxBytes: number): string {
  let byteLength = 0;
  let end = 0;

  for (const character of value) {
    const characterLength = Buffer.byteLength(character, 'utf8');
    if (byteLength + characterLength > maxBytes) break;
    byteLength += characterLength;
    end += character.length;
  }

  return value.slice(0, end);
}

function invalid(message: string): never {
  throw new ExternalActionAdapterError('INVALID_RESPONSE', message, false);
}

function invalidContext(message: string): never {
  throw new ExternalActionAdapterError('INVALID_CONTEXT', message, false);
}

function parseCliEnvelope(
  stdout: string,
  operation: AstryxOperation,
  componentName: string | undefined,
  installedCliVersion: string,
  installedCoreVersion: string,
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

  if (
    typeof cliVersion !== 'string' ||
    !SEMVER_PATTERN.test(cliVersion) ||
    cliVersion !== installedCliVersion ||
    typeof coreVersion !== 'string' ||
    !SEMVER_PATTERN.test(coreVersion) ||
    coreVersion !== installedCoreVersion ||
    cliCopy !== 'project'
  ) {
    return invalid('Astryx CLI must report matching project-local CLI and Core versions');
  }

  return { cliVersion, coreVersion, cliCopy };
}

export class AstryxCliDiscoveryAdapter implements ExternalActionAdapter {
  readonly adapterId = 'mcf-astryx-cli-readonly-v1';

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly enabled: boolean,
    private readonly workspaceRoot: string,
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
    // Keep discovery isolated from the checkout; never fall back to process.cwd().
    if (!isAbsolute(this.workspaceRoot)) {
      return invalidContext('Astryx workspace root must be an explicit absolute path');
    }

    try {
      const root = await realpath(resolve(this.workspaceRoot));
      const runtimeRoot = await realpath(process.cwd());
      if (isWithin(runtimeRoot, root) || isWithin(root, runtimeRoot)) {
        return invalidContext('Astryx workspace must not overlap the runtime checkout');
      }

      const metadata = await stat(root);
      if (!metadata.isDirectory()) {
        return invalidContext('Astryx workspace root must be a directory');
      }
      return root;
    } catch {
      return invalidContext('Astryx workspace is unavailable or overlaps the runtime checkout');
    }
  }

  private async resolveCliPackages(workspace: string): Promise<AstryxCliPackages> {
    try {
      const cliPackageRoot = await realpath(
        resolve(workspace, 'node_modules', '@astryxdesign', 'cli'),
      );
      if (!isWithin(workspace, cliPackageRoot)) {
        return invalidContext('Astryx CLI package resolves outside the isolated workspace');
      }

      const packageJson = JSON.parse(
        await readFile(resolve(cliPackageRoot, 'package.json'), 'utf8'),
      ) as unknown;
      if (
        !isRecord(packageJson) ||
        packageJson.name !== ASTRYX_CLI_PACKAGE ||
        typeof packageJson.version !== 'string' ||
        !SEMVER_PATTERN.test(packageJson.version)
      ) {
        return invalidContext(
          'Astryx workspace does not contain a valid project-local CLI package',
        );
      }

      const bin = isRecord(packageJson.bin) ? packageJson.bin.astryx : packageJson.bin;
      if (typeof bin !== 'string' || !bin.startsWith('./')) {
        return invalidContext('Astryx CLI package does not declare its local astryx binary');
      }

      const cliBinary = await realpath(resolve(cliPackageRoot, bin));
      if (!isWithin(cliPackageRoot, cliBinary)) {
        return invalidContext('Astryx CLI binary resolves outside its package');
      }

      const corePackageRoot = await realpath(
        resolve(workspace, 'node_modules', '@astryxdesign', 'core'),
      );
      if (!isWithin(workspace, corePackageRoot)) {
        return invalidContext('Astryx Core package resolves outside the isolated workspace');
      }

      const corePackageJson = JSON.parse(
        await readFile(resolve(corePackageRoot, 'package.json'), 'utf8'),
      ) as unknown;
      if (
        !isRecord(corePackageJson) ||
        corePackageJson.name !== ASTRYX_CORE_PACKAGE ||
        typeof corePackageJson.version !== 'string' ||
        !SEMVER_PATTERN.test(corePackageJson.version)
      ) {
        return invalidContext(
          'Astryx workspace does not contain a valid project-local Core package',
        );
      }

      return {
        cliPackageRoot,
        cliBinary,
        cliVersion: packageJson.version,
        corePackageRoot,
        coreVersion: corePackageJson.version,
      };
    } catch {
      return invalidContext('Astryx project-local CLI package or binary is unavailable');
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
    let componentName: string | undefined;

    if (operation === 'list-components') {
      args = ['--json', 'component', '--list'];
    } else {
      const name = request.inputs.componentName;
      if (typeof name !== 'string' || !/^[A-Z][A-Za-z0-9]{0,63}$/u.test(name)) {
        return invalidContext('componentName must be a valid Astryx component identifier');
      }
      componentName = name;
      args = ['--json', 'component', name, '--detail', 'compact'];
    }

    const cwd = await this.resolveWorkspace();
    const packages = await this.resolveCliPackages(cwd);
    const command = [process.execPath, packages.cliBinary, ...args];
    let result: { stdout: string; stderr: string };

    try {
      result = await this.runner(process.execPath, [packages.cliBinary, ...args], {
        cwd,
        timeout: Math.min(Math.max(this.timeoutMs, 1_000), 30_000),
        maxBuffer: MAX_OUTPUT_BYTES,
        windowsHide: true,
      });
    } catch (error) {
      const isTimeout =
        isRecord(error) &&
        (error.code === 'ETIMEDOUT' || (error.killed === true && error.signal === 'SIGTERM'));
      const code = isTimeout ? 'ADAPTER_TIMEOUT' : 'ADAPTER_FAILURE';
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

    const provenance = parseCliEnvelope(
      stdout,
      operation,
      componentName,
      packages.cliVersion,
      packages.coreVersion,
    );
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
        cliPackageRoot: packages.cliPackageRoot,
        cliBinary: packages.cliBinary,
        corePackageRoot: packages.corePackageRoot,
        readOnly: true,
        command,
        workspace: cwd,
        stdout,
        stderr: truncateUtf8(result.stderr, MAX_STDERR_BYTES),
        exitCode: 0,
        outputBytes: Buffer.byteLength(stdout, 'utf8'),
        outputDigest,
      },
    });
  }
}
