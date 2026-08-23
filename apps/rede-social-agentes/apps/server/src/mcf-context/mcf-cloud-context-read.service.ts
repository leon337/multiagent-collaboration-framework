import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync,
  constants as fsConstants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
} from 'node:fs';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';

import { Injectable } from '@nestjs/common';
import type { McfCloudContextProviderResponse, McfCloudContextReadReceipt } from '@rsa/contracts';
import { Ajv2020, type AnySchema } from 'ajv/dist/2020.js';
import { z } from 'zod';

export const MCF_CLOUD_CONTEXT_ENABLE_VALUE = 'DISPOSABLE_LOCAL_LAB_ONLY';
export const MCF_CLOUD_CONTEXT_ADAPTER_PATH = 'platform/control-bridge/mcf-cloud-context-read';
export const MCF_CLOUD_CONTEXT_RESULT_SCHEMA_PATH =
  'platform/schemas/mcf-cloud-context-read-result.schema.json';
export const MCF_CLOUD_CONTEXT_SOURCE_PATHS = [
  '.mcf/project-capsule.yaml',
  'context/mcf-cloud-context.yaml',
  'control_plane/g2a/local_context_adapter.py',
  'platform/control-bridge/mcf-cloud-context-read',
  'platform/control-bridge/mcf-cloud-context-read-config.yaml',
  'platform/manifests/g2a-smoke.yaml',
  'platform/schemas/mcf-cloud-context-read-config.schema.json',
  'platform/schemas/mcf-cloud-context-read-result.schema.json',
  'platform/schemas/mcf-cloud-context.schema.json',
  'platform/schemas/mcf-project-capsule.schema.json',
  'platform/schemas/project.schema.json',
  'state/control-bridge-g2a.yaml',
  'state/control-bridge-g2b.yaml',
] as const;

const MAX_CONFIGURATION_BYTES = 32 * 1024;
const MAX_INPUT_BYTES = 4_096;
const MAX_OUTPUT_BYTES = 65_536;
const MAX_STDERR_BYTES = 4_096;
const MAX_SOURCE_BYTES = 262_144;
const MAX_PYTHON_BYTES = 256 * 1024 * 1024;
const PROCESS_TIMEOUT_MS = 20_000;
const PROCESS_KILL_GRACE_MS = 1_000;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const PYTHON_NAME_PATTERN = /^python3(?:\.\d+)*$/u;
const dateTimeSchema = z.iso.datetime({ offset: true });

const absolutePathSchema = z.string().min(1).max(4096).refine(isAbsolute, 'path must be absolute');
const sha256Schema = z.string().regex(SHA256_PATTERN);
const configurationSchema = z
  .object({
    enable: z.literal(MCF_CLOUD_CONTEXT_ENABLE_VALUE),
    repository_root: absolutePathSchema,
    python_executable: absolutePathSchema,
    python_executable_sha256: sha256Schema,
    expected_source_sha256: z.record(z.string(), sha256Schema),
  })
  .strict();

export type McfCloudContextReadConfiguration = z.infer<typeof configurationSchema>;
type ProcessFailureCode =
  | 'MCF_CLOUD_CONTEXT_ADAPTER_FAILED'
  | 'MCF_CLOUD_CONTEXT_BOUNDARY_INVALID'
  | 'MCF_CLOUD_CONTEXT_CONTRACT_INVALID'
  | 'MCF_CLOUD_CONTEXT_OUTPUT_LIMIT_EXCEEDED'
  | 'MCF_CLOUD_CONTEXT_TIMEOUT';

export class McfCloudContextReadUnavailableError extends Error {
  constructor(public readonly code: 'MCF_CLOUD_CONTEXT_READ_DISABLED' | ProcessFailureCode) {
    super('The local read-only Cloud context adapter is unavailable.');
    this.name = 'McfCloudContextReadUnavailableError';
  }
}

interface ProcessResult {
  exitCode: number | null;
  stdout: Buffer;
  stderr: Buffer;
}

export type McfCloudContextSpawnAdapter = (
  executable: string,
  arguments_: readonly string[],
  options: {
    cwd: string;
    env: NodeJS.ProcessEnv;
    shell: false;
    stdio: ['pipe', 'pipe', 'pipe'];
    windowsHide: true;
  },
) => ChildProcessWithoutNullStreams;

function exactSourceDigestMap(value: Record<string, string>): boolean {
  const configured = Object.keys(value).sort();
  const expected = [...MCF_CLOUD_CONTEXT_SOURCE_PATHS].sort();
  return (
    configured.length === expected.length &&
    configured.every((key, index) => key === expected[index])
  );
}

export function loadMcfCloudContextReadConfiguration(
  env: NodeJS.ProcessEnv,
): McfCloudContextReadConfiguration | null {
  const raw = env.MCF_CLOUD_CONTEXT_READ_CONFIG_JSON;
  if (raw === undefined || Buffer.byteLength(raw, 'utf8') > MAX_CONFIGURATION_BYTES) return null;

  try {
    const parsed = configurationSchema.parse(JSON.parse(raw));
    return exactSourceDigestMap(parsed.expected_source_sha256) ? parsed : null;
  } catch {
    return null;
  }
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function readRegularFile(path: string, maximumBytes: number): Buffer {
  const descriptor = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  try {
    const metadata = fstatSync(descriptor);
    if (!metadata.isFile() || metadata.size > maximumBytes) {
      throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
    }
    const content = readFileSync(descriptor);
    if (content.length > maximumBytes) {
      throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
    }
    return content;
  } finally {
    closeSync(descriptor);
  }
}

function hashRegularFile(path: string, maximumBytes: number): { digest: string; prefix: Buffer } {
  const descriptor = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  try {
    const metadata = fstatSync(descriptor);
    if (!metadata.isFile() || metadata.size > maximumBytes) {
      throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
    }
    const digest = createHash('sha256');
    const buffer = Buffer.allocUnsafe(64 * 1024);
    const prefix = Buffer.alloc(4);
    let offset = 0;
    while (offset < metadata.size) {
      const bytesRead = readSync(
        descriptor,
        buffer,
        0,
        Math.min(buffer.length, metadata.size - offset),
        offset,
      );
      if (bytesRead === 0) break;
      if (offset < prefix.length) {
        buffer.copy(prefix, offset, 0, Math.min(bytesRead, prefix.length - offset));
      }
      digest.update(buffer.subarray(0, bytesRead));
      offset += bytesRead;
    }
    if (offset !== metadata.size) {
      throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
    }
    return { digest: digest.digest('hex'), prefix };
  } finally {
    closeSync(descriptor);
  }
}

function assertCanonicalRoot(root: string): void {
  if (resolve(root) !== root || realpathSync(root) !== root || lstatSync(root).isSymbolicLink()) {
    throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
  }
  const parts = root.split(sep).filter(Boolean);
  if (parts.slice(-3).join('/') !== 'leon337/g2a-smoke/dev') {
    throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
  }
}

function confinedPath(root: string, sourcePath: string): string {
  if (!(MCF_CLOUD_CONTEXT_SOURCE_PATHS as readonly string[]).includes(sourcePath)) {
    throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
  }
  let cursor = root;
  for (const segment of sourcePath.split('/')) {
    cursor = join(cursor, segment);
    if (lstatSync(cursor).isSymbolicLink()) {
      throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
    }
  }
  const candidate = realpathSync(cursor);
  const relativePath = relative(root, candidate);
  if (
    relativePath === '' ||
    relativePath === '..' ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
  }
  return candidate;
}

function readAndVerifySources(
  configuration: McfCloudContextReadConfiguration,
): Map<string, Buffer> {
  assertCanonicalRoot(configuration.repository_root);
  const sources = new Map<string, Buffer>();
  for (const sourcePath of MCF_CLOUD_CONTEXT_SOURCE_PATHS) {
    const content = readRegularFile(
      confinedPath(configuration.repository_root, sourcePath),
      MAX_SOURCE_BYTES,
    );
    if (sha256(content) !== configuration.expected_source_sha256[sourcePath]) {
      throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
    }
    sources.set(sourcePath, content);
  }
  return sources;
}

function assertPythonExecutable(configuration: McfCloudContextReadConfiguration): void {
  const executable = configuration.python_executable;
  if (
    resolve(executable) !== executable ||
    realpathSync(executable) !== executable ||
    lstatSync(executable).isSymbolicLink() ||
    !PYTHON_NAME_PATTERN.test(basename(executable))
  ) {
    throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
  }
  const executableEvidence = hashRegularFile(executable, MAX_PYTHON_BYTES);
  if (
    executableEvidence.digest !== configuration.python_executable_sha256 ||
    !executableEvidence.prefix.equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))
  ) {
    throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
  }
  const mode = lstatSync(executable).mode;
  if ((mode & 0o111) === 0) {
    throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
  }
}

function validUri(value: string): boolean {
  try {
    return new URL(value).protocol.length > 1;
  } catch {
    return false;
  }
}

function validateProviderResponse(
  rawOutput: Buffer,
  requestId: string,
  sourcesBefore: Map<string, Buffer>,
  sourcesAfter: Map<string, Buffer>,
): McfCloudContextProviderResponse {
  const rendered = rawOutput.toString('utf8');
  if (!rendered.endsWith('\n') || rendered.slice(0, -1).includes('\n') || rendered.includes('\0')) {
    throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_CONTRACT_INVALID');
  }

  let value: unknown;
  let schema: AnySchema;
  try {
    value = JSON.parse(rendered);
    schema = JSON.parse(
      sourcesBefore.get(MCF_CLOUD_CONTEXT_RESULT_SCHEMA_PATH)?.toString('utf8') ?? '',
    ) as AnySchema;
  } catch {
    throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_CONTRACT_INVALID');
  }

  let validate;
  try {
    const ajv = new Ajv2020({
      allErrors: true,
      strict: true,
      // The provider schema applies conditional `properties` below objects typed by
      // their parent. Draft 2020-12 permits this; Ajv strictTypes requires repetition.
      strictTypes: false,
      coerceTypes: false,
      removeAdditional: false,
      useDefaults: false,
    });
    ajv.addFormat('date-time', {
      type: 'string',
      validate: (candidate: string) => dateTimeSchema.safeParse(candidate).success,
    });
    ajv.addFormat('uri', { type: 'string', validate: validUri });
    validate = ajv.compile(schema);
  } catch {
    throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_CONTRACT_INVALID');
  }
  if (!validate(value)) {
    throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_CONTRACT_INVALID');
  }

  const response = value as McfCloudContextProviderResponse;
  if (
    response.request_id !== requestId ||
    !REQUEST_ID_PATTERN.test(response.request_id) ||
    response.status !== 'PASS' ||
    response.error !== null ||
    response.project_id !== 'cloud-infrastructure' ||
    response.operation !== 'context.get' ||
    response.freshness.workspace_observation !== 'LIVE_LOCAL_DISPOSABLE' ||
    response.freshness.source_mode !== 'READ_AT_REQUEST_TIME'
  ) {
    throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_CONTRACT_INVALID');
  }

  const reported = new Map(response.provenance.sources.map((item) => [item.path, item.sha256]));
  if (reported.size !== MCF_CLOUD_CONTEXT_SOURCE_PATHS.length) {
    throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_CONTRACT_INVALID');
  }
  for (const sourcePath of MCF_CLOUD_CONTEXT_SOURCE_PATHS) {
    const before = sourcesBefore.get(sourcePath);
    const after = sourcesAfter.get(sourcePath);
    if (
      before === undefined ||
      after === undefined ||
      !before.equals(after) ||
      reported.get(sourcePath) !== sha256(after)
    ) {
      throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_CONTRACT_INVALID');
    }
  }
  return response;
}

@Injectable()
export class McfCloudContextReadService {
  constructor(
    private readonly configuration: McfCloudContextReadConfiguration | null,
    private readonly spawnAdapter: McfCloudContextSpawnAdapter = spawn,
  ) {}

  static fromEnvironment(env: NodeJS.ProcessEnv = process.env): McfCloudContextReadService {
    return new McfCloudContextReadService(loadMcfCloudContextReadConfiguration(env));
  }

  async readOnly(): Promise<McfCloudContextReadReceipt> {
    const configuration = this.configuration;
    if (configuration === null) {
      throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_READ_DISABLED');
    }

    let sourcesBefore: Map<string, Buffer>;
    try {
      assertPythonExecutable(configuration);
      sourcesBefore = readAndVerifySources(configuration);
    } catch (error) {
      if (error instanceof McfCloudContextReadUnavailableError) throw error;
      throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
    }

    const requestId = `MCF-CLOUD-${randomUUID()}`;
    const request = `${JSON.stringify({
      protocol: 'MCF_CLOUD_CONTEXT_READ_V1',
      request_id: requestId,
      project_id: 'cloud-infrastructure',
      operation: 'context.get',
      arguments: {},
    })}\n`;
    if (Buffer.byteLength(request, 'utf8') > MAX_INPUT_BYTES) {
      throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
    }

    const processResult = await this.execute(configuration, request);
    if (processResult.exitCode !== 0 || processResult.stderr.length !== 0) {
      throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_ADAPTER_FAILED');
    }

    let sourcesAfter: Map<string, Buffer>;
    try {
      assertPythonExecutable(configuration);
      sourcesAfter = readAndVerifySources(configuration);
    } catch (error) {
      if (error instanceof McfCloudContextReadUnavailableError) throw error;
      throw new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_BOUNDARY_INVALID');
    }
    const providerResponse = validateProviderResponse(
      processResult.stdout,
      requestId,
      sourcesBefore,
      sourcesAfter,
    );
    return {
      schema_version: 1,
      read_only: true,
      material_action: false,
      persisted_by_mcf: false,
      evidence_only: true,
      provider_response: providerResponse,
    };
  }

  private execute(
    configuration: McfCloudContextReadConfiguration,
    request: string,
  ): Promise<ProcessResult> {
    return new Promise((resolveResult, rejectResult) => {
      let child: ChildProcessWithoutNullStreams;
      try {
        child = this.spawnAdapter(
          configuration.python_executable,
          ['-I', MCF_CLOUD_CONTEXT_ADAPTER_PATH],
          {
            cwd: configuration.repository_root,
            env: { MCF_CLOUD_CONTEXT_READ_ENABLE: MCF_CLOUD_CONTEXT_ENABLE_VALUE },
            shell: false,
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
          },
        );
      } catch {
        rejectResult(new McfCloudContextReadUnavailableError('MCF_CLOUD_CONTEXT_ADAPTER_FAILED'));
        return;
      }

      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      let stdoutBytes = 0;
      let stderrBytes = 0;
      let failure: ProcessFailureCode | null = null;
      let settled = false;
      let killGrace: NodeJS.Timeout | null = null;
      const rejectFailure = (): void => {
        if (settled || failure === null) return;
        settled = true;
        clearTimeout(timeout);
        if (killGrace !== null) clearTimeout(killGrace);
        rejectResult(new McfCloudContextReadUnavailableError(failure));
      };
      const fail = (code: ProcessFailureCode): void => {
        if (failure !== null || settled) return;
        failure = code;
        try {
          if (!child.killed) child.kill('SIGKILL');
        } catch {
          // Settlement below is independent from a failed platform kill call.
        }
        killGrace = setTimeout(rejectFailure, PROCESS_KILL_GRACE_MS);
      };
      const timeout = setTimeout(() => fail('MCF_CLOUD_CONTEXT_TIMEOUT'), PROCESS_TIMEOUT_MS);

      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBytes += chunk.length;
        if (stdoutBytes > MAX_OUTPUT_BYTES) {
          fail('MCF_CLOUD_CONTEXT_OUTPUT_LIMIT_EXCEEDED');
          return;
        }
        stdout.push(chunk);
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderrBytes += chunk.length;
        if (stderrBytes > MAX_STDERR_BYTES) {
          fail('MCF_CLOUD_CONTEXT_OUTPUT_LIMIT_EXCEEDED');
          return;
        }
        stderr.push(chunk);
      });
      child.once('error', () => fail('MCF_CLOUD_CONTEXT_ADAPTER_FAILED'));
      child.once('close', (exitCode) => {
        clearTimeout(timeout);
        if (killGrace !== null) clearTimeout(killGrace);
        if (settled) return;
        if (failure !== null) {
          rejectFailure();
          return;
        }
        settled = true;
        resolveResult({
          exitCode,
          stdout: Buffer.concat(stdout),
          stderr: Buffer.concat(stderr),
        });
      });
      child.stdin.once('error', () => fail('MCF_CLOUD_CONTEXT_ADAPTER_FAILED'));
      child.stdin.end(request, 'utf8');
    });
  }
}
