import { spawn } from 'node:child_process';
import path from 'node:path';

import { isPathInside } from './policy.js';

export interface CommandAllowlistEntry {
  readonly id: string;
  readonly executable: string;
  readonly cwdRoots: readonly string[];
  readonly allowedEnvironmentKeys: readonly string[];
  readonly validateArgv: (argv: readonly string[]) => boolean;
}

export interface CommandRequest {
  readonly policyId: string;
  readonly executable: string;
  readonly argv: readonly string[];
  readonly cwd: string;
  readonly environment?: Readonly<Record<string, string>>;
  readonly stdin?: string;
  readonly timeoutMs?: number;
  readonly maxStdoutBytes?: number;
  readonly maxStderrBytes?: number;
  readonly redactionSecrets?: readonly string[];
  readonly signal?: AbortSignal;
}

export interface CommandResult {
  readonly exitCode: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly timedOut: boolean;
  readonly aborted: boolean;
  readonly stdout: string;
  readonly stderr: string;
  readonly stdoutTruncated: boolean;
  readonly stderrTruncated: boolean;
  readonly durationMs: number;
}

export interface CommandRunnerOptions {
  readonly allowlist: readonly CommandAllowlistEntry[];
  readonly defaultTimeoutMs?: number;
  readonly defaultMaxStdoutBytes?: number;
  readonly defaultMaxStderrBytes?: number;
  readonly maximumStdinBytes?: number;
  readonly killGraceMs?: number;
}

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1_000;
const DEFAULT_MAX_STDOUT_BYTES = 8 * 1_024 * 1_024;
const DEFAULT_MAX_STDERR_BYTES = 1 * 1_024 * 1_024;
const DEFAULT_MAX_STDIN_BYTES = 1 * 1_024 * 1_024;

function validateScalar(value: string, label: string): void {
  if (value.includes('\0')) {
    throw new Error(`${label} contains a NUL byte`);
  }
}

function validatePositiveInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return value;
}

class BoundedBuffer {
  readonly #chunks: Buffer[] = [];
  readonly #limit: number;
  #size = 0;
  #truncated = false;

  constructor(limit: number) {
    this.#limit = validatePositiveInteger(limit, 'buffer limit');
  }

  append(chunk: Buffer | string): void {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    const remaining = this.#limit - this.#size;
    if (remaining <= 0) {
      this.#truncated = true;
      return;
    }
    if (buffer.length > remaining) {
      this.#chunks.push(buffer.subarray(0, remaining));
      this.#size += remaining;
      this.#truncated = true;
      return;
    }
    this.#chunks.push(buffer);
    this.#size += buffer.length;
  }

  get truncated(): boolean {
    return this.#truncated;
  }

  toString(): string {
    return Buffer.concat(this.#chunks, this.#size).toString('utf8');
  }
}

export function redactSensitiveText(text: string, secrets: readonly string[] = []): string {
  let redacted = text
    .replace(/(authorization\s*[:=]\s*(?:bearer\s+)?)[^\s"']+/gi, '$1[REDACTED]')
    .replace(/("(?:access_token|refresh_token|id_token|api_key|password|secret)"\s*:\s*")[^"]*(")/gi, '$1[REDACTED]$2')
    .replace(/\bsk-[a-zA-Z0-9_-]{12,}\b/g, '[REDACTED_OPENAI_KEY]')
    .replace(/\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g, '[REDACTED_JWT]');

  const uniqueSecrets = [...new Set(secrets.filter((secret) => secret.length >= 4))].sort(
    (left, right) => right.length - left.length,
  );
  for (const secret of uniqueSecrets) {
    redacted = redacted.split(secret).join('[REDACTED]');
  }
  return redacted;
}

export class CommandRunner {
  readonly #allowlist: ReadonlyMap<string, CommandAllowlistEntry>;
  readonly #defaultTimeoutMs: number;
  readonly #defaultMaxStdoutBytes: number;
  readonly #defaultMaxStderrBytes: number;
  readonly #maximumStdinBytes: number;
  readonly #killGraceMs: number;

  constructor(options: CommandRunnerOptions) {
    const allowlist = new Map<string, CommandAllowlistEntry>();
    for (const entry of options.allowlist) {
      if (allowlist.has(entry.id)) {
        throw new Error(`duplicate command policy: ${entry.id}`);
      }
      if (!path.isAbsolute(entry.executable) || path.resolve(entry.executable) !== entry.executable) {
        throw new Error(`command executable must be a normalized absolute path: ${entry.id}`);
      }
      allowlist.set(entry.id, entry);
    }
    this.#allowlist = allowlist;
    this.#defaultTimeoutMs = validatePositiveInteger(
      options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS,
      'default timeout',
    );
    this.#defaultMaxStdoutBytes = validatePositiveInteger(
      options.defaultMaxStdoutBytes ?? DEFAULT_MAX_STDOUT_BYTES,
      'default stdout limit',
    );
    this.#defaultMaxStderrBytes = validatePositiveInteger(
      options.defaultMaxStderrBytes ?? DEFAULT_MAX_STDERR_BYTES,
      'default stderr limit',
    );
    this.#maximumStdinBytes = validatePositiveInteger(
      options.maximumStdinBytes ?? DEFAULT_MAX_STDIN_BYTES,
      'stdin limit',
    );
    this.#killGraceMs = validatePositiveInteger(options.killGraceMs ?? 2_000, 'kill grace');
  }

  async run(request: CommandRequest): Promise<CommandResult> {
    const policy = this.#allowlist.get(request.policyId);
    if (policy === undefined) {
      throw new Error(`command policy is not allowlisted: ${request.policyId}`);
    }
    if (request.executable !== policy.executable) {
      throw new Error(`executable does not match command policy: ${request.policyId}`);
    }
    if (!path.isAbsolute(request.cwd) || path.resolve(request.cwd) !== request.cwd) {
      throw new Error('command cwd must be a normalized absolute path');
    }
    if (!policy.cwdRoots.some((root) => isPathInside(root, request.cwd))) {
      throw new Error(`command cwd is outside allowlisted roots: ${request.cwd}`);
    }

    for (const argument of request.argv) {
      validateScalar(argument, 'command argument');
    }
    if (!policy.validateArgv(request.argv)) {
      throw new Error(`argv does not match command policy: ${request.policyId}`);
    }

    const environment = request.environment ?? {};
    const allowedEnvironmentKeys = new Set(policy.allowedEnvironmentKeys);
    for (const [key, value] of Object.entries(environment)) {
      if (!allowedEnvironmentKeys.has(key)) {
        throw new Error(`environment key is not allowlisted: ${key}`);
      }
      validateScalar(key, 'environment key');
      validateScalar(value, `environment value ${key}`);
    }

    const stdin = request.stdin ?? '';
    if (Buffer.byteLength(stdin) > this.#maximumStdinBytes) {
      throw new Error('command stdin exceeds the configured limit');
    }

    const timeoutMs = validatePositiveInteger(
      request.timeoutMs ?? this.#defaultTimeoutMs,
      'command timeout',
    );
    const stdoutBuffer = new BoundedBuffer(
      request.maxStdoutBytes ?? this.#defaultMaxStdoutBytes,
    );
    const stderrBuffer = new BoundedBuffer(
      request.maxStderrBytes ?? this.#defaultMaxStderrBytes,
    );
    const startedAt = Date.now();

    if (request.signal?.aborted) {
      throw request.signal.reason instanceof Error
        ? request.signal.reason
        : new Error('command was aborted before it started');
    }

    return await new Promise<CommandResult>((resolve, reject) => {
      const child = spawn(request.executable, [...request.argv], {
        cwd: request.cwd,
        env: { ...environment },
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });
      let timedOut = false;
      let aborted = false;
      let settled = false;
      let forceKillTimer: NodeJS.Timeout | undefined;

      const terminate = (): void => {
        child.kill('SIGTERM');
        forceKillTimer ??= setTimeout(() => child.kill('SIGKILL'), this.#killGraceMs);
        forceKillTimer.unref();
      };

      const onAbort = (): void => {
        aborted = true;
        terminate();
      };
      request.signal?.addEventListener('abort', onAbort, { once: true });

      const timeout = setTimeout(() => {
        timedOut = true;
        terminate();
      }, timeoutMs);
      timeout.unref();

      child.stdout.on('data', (chunk: Buffer) => stdoutBuffer.append(chunk));
      child.stderr.on('data', (chunk: Buffer) => stderrBuffer.append(chunk));
      child.stdin.on('error', (error: NodeJS.ErrnoException) => {
        // Short-lived commands may close stdin before Node flushes an empty payload.
        // Their exit status remains the authoritative result.
        if (error.code === 'EPIPE') return;
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        request.signal?.removeEventListener('abort', onAbort);
        if (forceKillTimer !== undefined) clearTimeout(forceKillTimer);
        child.kill('SIGTERM');
        reject(error);
      });
      child.once('error', (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        request.signal?.removeEventListener('abort', onAbort);
        if (forceKillTimer !== undefined) clearTimeout(forceKillTimer);
        reject(error);
      });
      child.once('close', (exitCode, signal) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        request.signal?.removeEventListener('abort', onAbort);
        if (forceKillTimer !== undefined) clearTimeout(forceKillTimer);
        const environmentSecrets = Object.values(environment).filter((value) => value.length >= 12);
        const secrets = [...environmentSecrets, ...(request.redactionSecrets ?? [])];
        resolve({
          exitCode,
          signal,
          timedOut,
          aborted,
          stdout: redactSensitiveText(stdoutBuffer.toString(), secrets),
          stderr: redactSensitiveText(stderrBuffer.toString(), secrets),
          stdoutTruncated: stdoutBuffer.truncated,
          stderrTruncated: stderrBuffer.truncated,
          durationMs: Date.now() - startedAt,
        });
      });

      child.stdin.end(stdin);
    });
  }
}
