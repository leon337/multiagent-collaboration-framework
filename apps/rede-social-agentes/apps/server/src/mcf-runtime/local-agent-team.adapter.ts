import { createHash } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';

import type { McfToolReceipt } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import {
  LOCAL_AGENT_TEAM_OPERATION,
  LOCAL_AGENT_TEAM_PROVIDER,
  LOCAL_AGENT_TEAM_RESOURCE,
  assertLocalAgentTeamWithinMission,
  localAgentProfile,
  type LocalAgentTeamAgent,
} from './local-agent-team.router.js';

export interface LocalAgentTeamConfig {
  enabled: boolean;
  timeoutMs: number;
  maxParallelism: number;
}
export interface LocalAgentWorkerResult {
  agentId: LocalAgentTeamAgent;
  pid: number;
  role: string;
  focus: string[];
  findings: string[];
  cognitiveIndependenceProven: false;
}

export interface LocalAgentTeamHost {
  runWorker(input: {
    agentId: LocalAgentTeamAgent;
    role: string;
    focus: readonly string[];
    objective: string;
    timeoutMs: number;
  }): Promise<LocalAgentWorkerResult>;
}

const workerSource = String.raw`
process.on('message', (message) => {
  const objective = String(message.objective ?? '').trim();
  const focus = Array.isArray(message.focus) ? message.focus.map(String) : [];
  const findings = focus.map((item) =>
    message.role + ': verificar ' + item + ' contra o objetivo recebido',
  );
  if (process.send) {
    process.send({
      agentId: message.agentId,
      pid: process.pid,
      role: message.role,
      focus,
      findings,
      objectiveLength: objective.length,
      cognitiveIndependenceProven: false,
    });
  }
  setImmediate(() => process.exit(0));
});
`;

function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function invalidContext(message: string): never {
  throw new ExternalActionAdapterError('INVALID_CONTEXT', message, false);
}

export class NodeLocalAgentTeamHost implements LocalAgentTeamHost {
  async runWorker(input: {
    agentId: LocalAgentTeamAgent;
    role: string;
    focus: readonly string[];
    objective: string;
    timeoutMs: number;
  }): Promise<LocalAgentWorkerResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['--input-type=module', '--eval', workerSource], {
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
        env: { NODE_ENV: process.env.NODE_ENV ?? 'development' },
      }) as ChildProcess;

      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        callback();
      };
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        finish(() =>
          reject(
            new ExternalActionAdapterError(
              'ADAPTER_TIMEOUT',
              `local agent worker ${input.agentId} exceeded timeout`,
              true,
            ),
          ),
        );
      }, input.timeoutMs);

      child.once('error', (error) =>
        finish(() =>
          reject(
            new ExternalActionAdapterError(
              'ADAPTER_FAILURE',
              `local agent worker could not start: ${error.message}`,
              false,
            ),
          ),
        ),
      );
      child.once('exit', () => {
        if (!settled) {
          finish(() =>
            reject(
              new ExternalActionAdapterError(
                'INVALID_RESPONSE',
                `local agent worker ${input.agentId} exited before receipt`,
                false,
              ),
            ),
          );
        }
      });

      child.once('message', (message) => {
        const candidate = message as Partial<LocalAgentWorkerResult>;
        if (
          candidate.agentId !== input.agentId ||
          !Number.isInteger(candidate.pid) ||
          Number(candidate.pid) <= 0 ||
          typeof candidate.role !== 'string' ||
          !Array.isArray(candidate.focus) ||
          candidate.focus.some((item) => typeof item !== 'string') ||
          !Array.isArray(candidate.findings) ||
          candidate.findings.some((item) => typeof item !== 'string') ||
          candidate.cognitiveIndependenceProven !== false
        ) {
          finish(() =>
            reject(
              new ExternalActionAdapterError(
                'INVALID_RESPONSE',
                `local agent worker ${input.agentId} returned invalid evidence`,
                false,
              ),
            ),
          );
          return;
        }
        finish(() => resolve(candidate as LocalAgentWorkerResult));
      });

      child.send?.({
        agentId: input.agentId,
        role: input.role,
        focus: [...input.focus],
        objective: input.objective,
      });
    });
  }
}

async function mapLimited<T, U>(
  values: readonly T[],
  limit: number,
  run: (value: T) => Promise<U>,
): Promise<U[]> {
  const output = new Array<U>(values.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await run(values[index] as T);
    }
  });
  await Promise.all(workers);
  return output;
}

export class LocalAgentTeamAdapter implements ExternalActionAdapter {
  readonly adapterId = 'local-agent-team-process-v1';

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly config: LocalAgentTeamConfig,
    private readonly host: LocalAgentTeamHost = new NodeLocalAgentTeamHost(),
  ) {}

  supports(request: ExternalActionRequest): boolean {
    return (
      request.skill.skillId === 'MCF-EXECUTE-LOCAL-TEAM' &&
      canonicalizeProvider(request.tool.provider) === LOCAL_AGENT_TEAM_PROVIDER &&
      canonicalizeToolValue(request.tool.operation) === LOCAL_AGENT_TEAM_OPERATION &&
      canonicalizeToolValue(request.tool.resource) === LOCAL_AGENT_TEAM_RESOURCE
    );
  }

  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    if (
      !Number.isInteger(this.config.maxParallelism) ||
      this.config.maxParallelism < 1 ||
      this.config.maxParallelism > 8 ||
      !Number.isInteger(this.config.timeoutMs) ||
      this.config.timeoutMs < 1
    ) {
      return invalidContext('local agent team executor configuration is invalid');
    }
    if (!this.config.enabled) {
      throw new ExternalActionAdapterError(
        'UNSUPPORTED_TARGET',
        'local agent team executor is disabled',
        false,
      );
    }
    const objective = request.inputs.objective;
    if (typeof objective !== 'string' || !objective.trim()) {
      return invalidContext('local agent team objective must be non-empty');
    }
    const missionAgents = request.inputs.mission_selected_agents;
    if (
      !Array.isArray(missionAgents) ||
      missionAgents.some((agentId) => typeof agentId !== 'string')
    ) {
      return invalidContext('mission_selected_agents must be server-derived');
    }

    const selectedAgents = assertLocalAgentTeamWithinMission(objective, missionAgents as string[]);
    const results = await mapLimited(
      selectedAgents,
      this.config.maxParallelism,
      async (agentId) => {
        const profile = localAgentProfile(agentId);
        return this.host.runWorker({
          agentId,
          role: profile.role,
          focus: profile.focus,
          objective,
          timeoutMs: this.config.timeoutMs,
        });
      },
    );

    const processIds = results.map((result) => result.pid);
    if (new Set(processIds).size !== processIds.length) {
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'local agent team did not produce unique worker processes',
        false,
      );
    }

    const observedAt = new Date().toISOString();
    const workerReceipts = results.map((result) =>
      this.evidence.createTrustedReceipt({
        provider: LOCAL_AGENT_TEAM_PROVIDER,
        operation: 'worker-result',
        resource: LOCAL_AGENT_TEAM_RESOURCE,
        externalId: `pid:${result.pid}`,
        commitSha: null,
        status: 'SUCCEEDED',
        observedAt,
        metadata: {
          agentId: result.agentId,
          role: result.role,
          workerPid: result.pid,
          focus: result.focus,
          findings: result.findings,
          executionMode: 'DETERMINISTIC_LOCAL_PROCESS',
          cognitiveIndependenceProven: false,
          objectiveDigest: digest(objective),
        },
      }),
    );

    const consolidatedDigest = digest({
      selectedAgents,
      processIds,
      workerReceiptIds: workerReceipts.map((receipt) => receipt.receiptId),
    });

    return this.evidence.createTrustedReceipt({
      provider: LOCAL_AGENT_TEAM_PROVIDER,
      operation: LOCAL_AGENT_TEAM_OPERATION,
      resource: LOCAL_AGENT_TEAM_RESOURCE,
      externalId: request.context?.phaseId ?? null,
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt,
      metadata: {
        selectedAgents,
        processIds,
        workerReceipts,
        consolidatedDigest,
        processIsolationObserved: true,
        executionMode: 'DETERMINISTIC_LOCAL_PROCESS',
        cognitiveIndependenceProven: false,
        maxParallelism: this.config.maxParallelism,
      },
    });
  }
}
