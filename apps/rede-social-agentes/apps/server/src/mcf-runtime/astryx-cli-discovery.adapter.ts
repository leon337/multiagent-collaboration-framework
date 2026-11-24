import { createHash } from 'node:crypto';
import { execFile as nodeExecFile } from 'node:child_process';
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';

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
export const ASTRYX_OPERATIONS = [
  'list-components',
  'read-component-docs',
  'list-templates',
  'read-template-source',
  'read-template-skeleton',
  'draft-template-scaffold',
] as const;

const MAX_OUTPUT_BYTES = 32_768;
const MAX_TEMPLATE_OUTPUT_BYTES = 262_144;
const MAX_TEMPLATE_SOURCE_BYTES = 262_144;
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
    env: Record<string, string>;
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
  templateId: string | undefined,
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

  const expectedTypes: Record<AstryxOperation, string> = {
    'list-components': 'component.list',
    'read-component-docs': 'component.detail',
    'list-templates': 'template.list',
    'read-template-source': 'template.show',
    'read-template-skeleton': 'template.skeleton',
    'draft-template-scaffold': 'template.copy',
  };
  if (envelope.type !== expectedTypes[operation]) {
    return invalid('Astryx CLI returned an unexpected response type');
  }
  const data = envelope.data;
  if (operation === 'list-components') {
    if (!isRecord(data) || !isRecord(data.components) || data.detail !== 'names') {
      return invalid(
        'Astryx CLI component list must contain its catalog at the fixed names detail level',
      );
    }
  } else if (operation === 'read-component-docs') {
    if (!isRecord(data) || data.name !== componentName) {
      return invalid('Astryx CLI documentation does not match the requested component');
    }
  } else if (operation === 'list-templates') {
    if (!Array.isArray(data) && (!isRecord(data) || !Array.isArray(data.templates))) {
      return invalid('Astryx CLI template list must contain a typed template catalog');
    }
  } else if (operation === 'read-template-source') {
    if (!isRecord(data) || typeof data.source !== 'string' || data.source.length === 0) {
      return invalid('Astryx CLI template source is missing its source text');
    }
  } else if (operation === 'read-template-skeleton') {
    if (!isRecord(data) || Object.keys(data).length === 0) {
      return invalid('Astryx CLI template skeleton is empty or malformed');
    }
  } else if (!isRecord(data) || data.filesCopied !== 1) {
    return invalid('Astryx CLI scaffold must copy exactly one template file into scratch space');
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
  readonly adapterId = 'mcf-astryx-cli-governed-v2';

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
      request.tool.resource === ASTRYX_RESOURCE &&
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
    const cwd = await this.resolveWorkspace();
    const packages = await this.resolveCliPackages(cwd);
    const isProposal = operation === 'draft-template-scaffold';
    let componentName: string | undefined;
    let templateId: string | undefined;
    let targetPath: string | undefined;
    let baseCommitSha: string | undefined;
    let allowedPaths: string[] = [];
    let proposalWorkspace: string | undefined;
    let executionCwd = cwd;
    let args: string[];

    if (operation === 'list-components') {
      args = ['--json', 'component', '--list'];
    } else if (operation === 'read-component-docs') {
      const name = request.inputs.componentName;
      if (typeof name !== 'string' || !/^[A-Z][A-Za-z0-9]{0,63}$/u.test(name)) {
        return invalidContext('componentName must be a valid Astryx component identifier');
      }
      componentName = name;
      args = ['--json', 'component', name, '--detail', 'compact'];
    } else if (operation === 'list-templates') {
      args = ['--json', 'template', '--list'];
    } else {
      const id = request.inputs.templateId;
      if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/u.test(id)) {
        return invalidContext('templateId must be a valid Astryx template identifier');
      }
      templateId = id;
      if (operation === 'read-template-source') {
        args = ['--json', 'template', id];
      } else if (operation === 'read-template-skeleton') {
        args = ['--json', 'template', id, '--skeleton'];
      } else {
        const rawPath = request.inputs.targetPath;
        if (
          typeof rawPath !== 'string' ||
          rawPath !== rawPath.trim() ||
          rawPath.startsWith('/') ||
          rawPath.includes('\\') ||
          rawPath.includes('\0')
        ) {
          return invalidContext('targetPath must be a safe repository-relative file path');
        }
        const segments = rawPath.split('/');
        if (
          segments.some((segment) => !segment || segment === '.' || segment === '..') ||
          !/\.(?:tsx|jsx|ts|js)$/u.test(rawPath)
        ) {
          return invalidContext('targetPath must be a safe TypeScript or JavaScript source file');
        }
        targetPath = rawPath;
        const rawSha = request.inputs.baseCommitSha;
        if (typeof rawSha !== 'string' || !/^[a-f0-9]{40}$/iu.test(rawSha)) {
          return invalidContext('baseCommitSha must be an exact 40-character Git SHA');
        }
        baseCommitSha = rawSha.toLowerCase();
        const repository = request.inputs.repository;
        if (
          typeof repository !== 'string' ||
          !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/[A-Za-z0-9._-]{1,100}$/u.test(
            repository,
          )
        ) {
          return invalidContext('repository must be a canonical owner/repository identifier');
        }
        if (
          !Array.isArray(request.inputs.allowed_paths) ||
          request.inputs.allowed_paths.length === 0
        ) {
          return invalidContext('allowed_paths must contain at least one approved repository path');
        }
        allowedPaths = request.inputs.allowed_paths.map((value) => {
          if (
            typeof value !== 'string' ||
            value !== value.trim() ||
            value.startsWith('/') ||
            value.includes('\\') ||
            value.split('/').some((segment) => !segment || segment === '.' || segment === '..')
          ) {
            return invalidContext('allowed_paths contains an unsafe repository-relative path');
          }
          return value;
        });
        if (!allowedPaths.some((scope) => rawPath === scope || rawPath.startsWith(`${scope}/`))) {
          return invalidContext(
            'targetPath must remain inside an explicitly approved allowed_paths entry',
          );
        }
        proposalWorkspace = await mkdtemp(resolve(cwd, '.mcf-astryx-proposal-'));
        executionCwd = proposalWorkspace;
        const destination = resolve(proposalWorkspace, targetPath);
        if (!isWithin(proposalWorkspace, destination)) {
          await rm(proposalWorkspace, { recursive: true, force: true });
          return invalidContext('Astryx proposal destination escaped its disposable workspace');
        }
        await mkdir(dirname(destination), { recursive: true });
        args = ['--json', 'template', id, targetPath];
      }
    }

    const command = [process.execPath, packages.cliBinary, ...args];
    const configDir = resolve(executionCwd, '.config');
    const cacheDir = resolve(executionCwd, '.cache');
    const tempDir = resolve(executionCwd, '.tmp');
    const appDataDir = resolve(executionCwd, '.appdata');
    const localAppDataDir = resolve(executionCwd, '.localappdata');
    await Promise.all(
      [configDir, cacheDir, tempDir, appDataDir, localAppDataDir].map((directory) =>
        mkdir(directory, { recursive: true }),
      ),
    );
    const childEnv = {
      CI: 'true',
      NO_COLOR: '1',
      NODE_ENV: 'production',
      HOME: executionCwd,
      USERPROFILE: executionCwd,
      APPDATA: appDataDir,
      LOCALAPPDATA: localAppDataDir,
      XDG_CONFIG_HOME: configDir,
      XDG_CACHE_HOME: cacheDir,
      TMPDIR: tempDir,
      TEMP: tempDir,
      TMP: tempDir,
      ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
      ...(process.env.WINDIR ? { WINDIR: process.env.WINDIR } : {}),
    };
    const maxOutputBytes = operation.includes('template')
      ? MAX_TEMPLATE_OUTPUT_BYTES
      : MAX_OUTPUT_BYTES;
    let result: { stdout: string; stderr: string };

    try {
      result = await this.runner(process.execPath, [packages.cliBinary, ...args], {
        cwd: executionCwd,
        env: childEnv,
        timeout: Math.min(Math.max(this.timeoutMs, 1_000), 30_000),
        maxBuffer: maxOutputBytes,
        windowsHide: true,
      });
    } catch (error) {
      if (proposalWorkspace) await rm(proposalWorkspace, { recursive: true, force: true });
      const isTimeout =
        isRecord(error) &&
        (error.code === 'ETIMEDOUT' || (error.killed === true && error.signal === 'SIGTERM'));
      const code = isTimeout ? 'ADAPTER_TIMEOUT' : 'ADAPTER_FAILURE';
      throw new ExternalActionAdapterError(
        code,
        'Astryx CLI operation failed; command output was not exposed',
        code === 'ADAPTER_TIMEOUT',
      );
    }

    const stdout = result.stdout.trim();
    if (!stdout || Buffer.byteLength(stdout, 'utf8') > maxOutputBytes) {
      if (proposalWorkspace) await rm(proposalWorkspace, { recursive: true, force: true });
      return invalid('Astryx CLI returned empty or oversized output');
    }

    let sourceContent: string | undefined;
    let diff: string | undefined;
    let diffDigest: string | undefined;
    if (isProposal && targetPath && templateId && baseCommitSha && proposalWorkspace) {
      const destination = resolve(proposalWorkspace, targetPath);
      try {
        const fileInfo = await lstat(destination);
        const resolvedFile = await realpath(destination);
        if (
          !fileInfo.isFile() ||
          fileInfo.isSymbolicLink() ||
          !isWithin(proposalWorkspace, resolvedFile)
        ) {
          return invalid(
            'Astryx scaffold proposal must produce one regular file inside scratch space',
          );
        }
        if (fileInfo.size < 1 || fileInfo.size > MAX_TEMPLATE_SOURCE_BYTES) {
          return invalid(
            'Astryx scaffold proposal source is empty or exceeds the bounded file size',
          );
        }
        sourceContent = await readFile(resolvedFile, 'utf8');
        const envelope = JSON.parse(stdout) as unknown;
        const data = isRecord(envelope) && isRecord(envelope.data) ? envelope.data : null;
        if (!data || data.filesCopied !== 1 || data.fileName !== basename(targetPath)) {
          return invalid('Astryx template copy receipt does not match the exact proposed file');
        }
        if (
          typeof data.outputDir === 'string' &&
          (!isAbsolute(data.outputDir) || resolve(data.outputDir) !== dirname(destination))
        ) {
          return invalid(
            'Astryx template copy outputDir does not match the disposable proposal path',
          );
        }
        const normalizedContent = sourceContent.replace(/\r\n/gu, '\n');
        const lines = normalizedContent.endsWith('\n')
          ? normalizedContent.slice(0, -1).split('\n')
          : normalizedContent.split('\n');
        diff = [
          `diff --git a/${targetPath} b/${targetPath}`,
          'new file mode 100644',
          '--- /dev/null',
          `+++ b/${targetPath}`,
          `@@ -0,0 +1,${lines.length} @@`,
          ...lines.map((line) => `+${line}`),
          '',
        ].join('\n');
        diffDigest = createHash('sha256').update(diff).digest('hex');
      } finally {
        await rm(proposalWorkspace, { recursive: true, force: true });
      }
    }

    const provenance = parseCliEnvelope(
      stdout,
      operation,
      componentName,
      templateId,
      packages.cliVersion,
      packages.coreVersion,
    );
    const outputDigest = createHash('sha256').update(stdout).digest('hex');
    const sourceBytes =
      sourceContent === undefined ? undefined : Buffer.from(sourceContent, 'utf8');
    const diffBytes = diff === undefined ? undefined : Buffer.from(diff, 'utf8');

    return this.evidence.createTrustedReceipt({
      provider: ASTRYX_PROVIDER,
      operation,
      resource: ASTRYX_RESOURCE,
      externalId: null,
      commitSha: baseCommitSha ?? null,
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
        readOnly: !isProposal,
        ...(templateId ? { templateId } : {}),
        ...(isProposal
          ? {
              proposalOnly: true,
              writeMode: 'DISPOSABLE_PROPOSAL_ONLY',
              proposalWorkspace: proposalWorkspace ?? null,
              proposalWorkspaceCleaned: true,
              templateId,
              targetPath,
              baseCommitSha,
              repository: request.inputs.repository,
              approvedPaths: allowedPaths,
              sourceArtifact: {
                encoding: 'base64',
                data: sourceBytes?.toString('base64'),
                byteLength: sourceBytes?.byteLength,
                digest: createHash('sha256')
                  .update(sourceBytes ?? Buffer.alloc(0))
                  .digest('hex'),
              },
              diffArtifact: {
                encoding: 'base64',
                data: diffBytes?.toString('base64'),
                byteLength: diffBytes?.byteLength,
              },
              diffDigest,
            }
          : {}),
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
