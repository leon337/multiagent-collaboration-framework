import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import type { OracleBridgeClient, OracleBridgeResult } from './codex-oracle-provider.adapter.js';

/**
 * Local Codex bridge client for MCF. NOT registered with production module.
 * The user-owned machine retains Codex OAuth and the full session history.
 * Does not open an HTTP port or use a paid OpenAI API.
 */
export interface LocalOracleCliSettings {
  bridgeScript: string;
  decisionSchema: string;
  stateRoot: string;
  pythonBinary: string;
  codexBinary: string;
  homeDirectory: string;
  timeoutSeconds: number;
}

const ID = /^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/u;
const MAX_STDOUT = 2_000_000;
const ENV_ALLOWLIST = [
  'HOME',
  'USER',
  'LOGNAME',
  'PATH',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'TERM',
  'XDG_RUNTIME_DIR',
  'XDG_CONFIG_HOME',
  'XDG_CACHE_HOME',
  'XDG_DATA_HOME',
  'NO_COLOR',
  'SSL_CERT_FILE',
] as const;

function requiredId(value: string, field: string): void {
  if (!ID.test(value)) throw new Error(`INVALID_${field}`);
}

function modelInput(
  request: {
    missionId: string;
    requestId: string;
    prompt: string;
    sessionEpoch: number;
  },
  timeoutSeconds: number,
) {
  const idempotencyKey = createHash('sha256')
    .update(JSON.stringify([request.missionId, request.requestId, request.prompt]))
    .digest('hex');
  return {
    schema_version: '1.0.0',
    mission_id: request.missionId,
    request_id: request.requestId,
    idempotency_key: idempotencyKey,
    session_epoch: request.sessionEpoch,
    objective: request.prompt,
    authorized_context: {
      operation: 'oracle.strategy.consult',
      paid_ai_api: false,
      paid_fallback: false,
      constitutional_approval: 'REQUIRED_BEFORE_ACTIVATION',
      external_effects: 'FORBIDDEN_BY_THIS_BRIDGE',
    },
    deadline_utc: new Date(Date.now() + (timeoutSeconds + 60) * 1000).toISOString(),
    policy_version: 'MCF-ORACLE-001-DEC-002',
  };
}

async function invokeBridge(
  settings: LocalOracleCliSettings,
  requestFile: string,
): Promise<OracleBridgeResult> {
  const args = [
    resolve(settings.bridgeScript),
    '--state-root',
    resolve(settings.stateRoot),
    '--codex',
    resolve(settings.codexBinary),
    'consult',
    '--request',
    resolve(requestFile),
    '--decision-schema',
    resolve(settings.decisionSchema),
    '--timeout',
    String(settings.timeoutSeconds),
  ];
  const env: NodeJS.ProcessEnv = {};
  for (const key of ENV_ALLOWLIST) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  // HOME is required for the official Codex ChatGPT login. The caller must
  // supply a known local user directory; never transport tokens over MCP.
  env.HOME = resolve(settings.homeDirectory);
  return new Promise((ok, fail) => {
    const child = spawn(settings.pythonBinary, args, {
      env,
      cwd: resolve(settings.stateRoot),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let overflow = false;
    // Provider diagnostic stderr is intentionally dropped. It may include
    // private prompt content or URLs with auth callback parameters.
    child.stderr?.resume();
    let finished = false;
    const timer = setTimeout(
      () => {
        child.kill('SIGTERM');
        const backup = setTimeout(() => child.kill('SIGKILL'), 1500);
        backup.unref();
      },
      (settings.timeoutSeconds + 20) * 1000,
    );
    timer.unref();
    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => {
      stdout += chunk;
      if (stdout.length > MAX_STDOUT) {
        overflow = true;
        child.kill('SIGTERM');
      }
    });
    child.on('error', () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      fail(new Error('ORACLE_BRIDGE_PROCESS_UNAVAILABLE'));
    });
    child.on('close', (status) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (overflow) {
        fail(new Error('ORACLE_BRIDGE_OUTPUT_LIMIT'));
        return;
      }
      let result: unknown;
      try {
        result = JSON.parse(stdout);
      } catch {
        fail(new Error('ORACLE_BRIDGE_INVALID_JSON'));
        return;
      }
      if (!result || typeof result !== 'object') {
        fail(new Error('ORACLE_BRIDGE_INVALID_CONTRACT'));
        return;
      }
      const response = result as Partial<OracleBridgeResult> & {
        reason?: string;
        status?: string;
      };
      if (status !== 0 || !['COMPLETED', 'CACHED'].includes(response.status ?? '')) {
        // Never propagate arbitrary provider responses as authority or logs.
        const reason = response.reason;
        fail(
          new Error(
            typeof reason === 'string' && /^[A-Z_]{3,80}$/u.test(reason)
              ? reason
              : 'ORACLE_BRIDGE_BLOCKED_OR_UNKNOWN',
          ),
        );
        return;
      }
      ok(response as OracleBridgeResult);
    });
  });
}

/** A transport adapter for the existing canonical AgentExecutionService. */
export class LocalCodexOracleBridgeClient implements OracleBridgeClient {
  constructor(private readonly settings: LocalOracleCliSettings) {}

  async consult(request: {
    missionId: string;
    requestId: string;
    prompt: string;
    sessionEpoch: number;
  }): Promise<OracleBridgeResult> {
    requiredId(request.missionId, 'MISSION_ID');
    requiredId(request.requestId, 'REQUEST_ID');
    if (
      !request.prompt.trim() ||
      !Number.isInteger(request.sessionEpoch) ||
      request.sessionEpoch < 1 ||
      !Number.isInteger(this.settings.timeoutSeconds) ||
      this.settings.timeoutSeconds < 1 ||
      this.settings.timeoutSeconds > 600
    ) {
      throw new Error('INVALID_ORACLE_LOCAL_REQUEST');
    }
    await chmod(resolve(this.settings.stateRoot), 0o700);
    const envelopes = join(resolve(this.settings.stateRoot), 'request-envelopes');
    await mkdir(envelopes, { recursive: true, mode: 0o700 });
    await chmod(envelopes, 0o700);
    const key = createHash('sha256')
      .update(JSON.stringify([request.missionId, request.requestId]))
      .digest('hex');
    const durableEnvelope = join(envelopes, key + '.json');
    const proposed = modelInput(request, this.settings.timeoutSeconds);
    let stableInput: string;
    try {
      stableInput = JSON.stringify(proposed);
      // The deadline and request digest must NOT change on process restart.
      // An exclusive creation prevents two clients from overwriting the same
      // logical request with a new expiration or a different prompt.
      await writeFile(durableEnvelope, stableInput, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      stableInput = await readFile(durableEnvelope, 'utf8');
      const previous = JSON.parse(stableInput) as ReturnType<typeof modelInput>;
      if (
        previous.mission_id !== proposed.mission_id ||
        previous.request_id !== proposed.request_id ||
        previous.objective !== proposed.objective ||
        previous.idempotency_key !== proposed.idempotency_key ||
        previous.session_epoch !== proposed.session_epoch
      ) {
        throw new Error('ORACLE_BRIDGE_DURABLE_REQUEST_CONFLICT', { cause: error });
      }
    }
    const work = await mkdtemp(join(tmpdir(), 'mcf-oracle-input-'));
    await chmod(work, 0o700);
    try {
      const requestFile = join(work, 'request.json');
      await writeFile(requestFile, stableInput, { encoding: 'utf8', mode: 0o600 });
      return await invokeBridge(this.settings, requestFile);
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  }
}
