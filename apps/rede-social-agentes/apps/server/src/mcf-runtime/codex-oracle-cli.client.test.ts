import { mkdtemp, mkdir, readFile, rm, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AgentExecutionService } from './agent-execution.service.js';
import {
  CodexOracleProviderAdapter,
  ORACLE_CODEX_EXPERIMENTAL_PROVIDER,
} from './codex-oracle-provider.adapter.js';
import { LocalCodexOracleBridgeClient } from './codex-oracle-cli.client.js';
import { ProviderAdapterRegistry } from './provider-adapter.registry.js';
import type { AgentExecutionRequest } from './agent-execution.contracts.js';

const ROOT = resolve(process.cwd(), '../../../../');
const BRIDGE_SCRIPT = join(ROOT, 'tools/oracle-bridge/oracle_bridge.py');
const SCHEMA = join(ROOT, 'schemas/mcf-oracle-decision.v1.schema.json');

const fakeCodex = `#!/usr/bin/env python3
import json, pathlib, sys, uuid
args = sys.argv[1:]
if args == ["login", "status"]:
    print("Logged in using ChatGPT", file=sys.stderr)
    sys.exit(0)
if "--model" not in args or args[args.index("--model")+1] != "gpt-6-astra":
    sys.exit(15)
request = json.loads(sys.stdin.read().splitlines()[-1])
out = pathlib.Path(args[args.index("--output-last-message")+1])
decision = {
  "schema_version": "1.0.0",
  "mission_id": request["mission_id"],
  "request_id": request["request_id"],
  "decision_id": "decision-"+request["request_id"],
  "status": "PROPOSED", "rationale": "fixture",
  "strategy": [], "specialists": ["Sofia"],
  "gates": ["Human approval before production"],
  "acceptance_evidence": ["verified CI"],
  "needs_human_approval": True,
}
out.write_text(json.dumps(decision))
counter = pathlib.Path(__file__).with_suffix(".count")
counter.write_text(str(int(counter.read_text())+1 if counter.exists() else 1))
thread = args[-2] if args[1] == "resume" else str(uuid.uuid4())
print(json.dumps({"type":"thread.started", "thread_id":thread}))
print(json.dumps({"type":"turn.completed"}))
`;

describe('MCF canonical AgentExecutionService → local Python Oracle CLI bridge', () => {
  let folder = '';
  let stateRoot = '';
  let fakeExecutable = '';
  let settings: ConstructorParameters<typeof LocalCodexOracleBridgeClient>[0];
  const request: AgentExecutionRequest = {
    missionId: 'MCF-ORACLE-001',
    runId: 'local-oracle-e2e-001',
    agent: {
      agentId: 'Oraculo',
      role: 'strategic-test-only',
      version: 'candidate',
      capabilities: ['planning'],
    },
    provider: ORACLE_CODEX_EXPERIMENTAL_PROVIDER,
    authority: {
      authorityId: 'fixture-only',
      issuer: 'MISSION',
      missionId: 'MCF-ORACLE-001',
      runId: 'local-oracle-e2e-001',
      allowedActions: ['oracle.strategy.consult'],
      providerScope: [ORACLE_CODEX_EXPERIMENTAL_PROVIDER.providerId],
      expiresAt: null,
      approvalRequired: false,
    },
    prompt: 'Only return a proposed strategy; do not execute actions.',
    requestedAction: 'oracle.strategy.consult',
    requestedCapabilities: ['PERSISTENT_CONTEXT', 'RESUMABLE_STATE'],
  };

  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), 'oracle-mcf-adapter-'));
    stateRoot = join(folder, 'private-state');
    fakeExecutable = join(folder, 'codex-fake');
    await mkdir(stateRoot, { mode: 0o700 });
    await writeFile(fakeExecutable, fakeCodex, { mode: 0o700 });
    await chmod(fakeExecutable, 0o700);
    settings = {
      bridgeScript: BRIDGE_SCRIPT,
      decisionSchema: SCHEMA,
      stateRoot,
      pythonBinary: 'python3',
      codexBinary: fakeExecutable,
      homeDirectory: folder,
      timeoutSeconds: 20,
    };
  });

  afterEach(async () => {
    if (folder) await rm(folder, { recursive: true, force: true });
  });

  function runtime() {
    const client = new LocalCodexOracleBridgeClient(settings);
    return new AgentExecutionService(
      new ProviderAdapterRegistry([new CodexOracleProviderAdapter(client, true)]),
    );
  }

  it('executes actual canonical MCF provider path via a real Python bridge process', async () => {
    const handle = await runtime().start(request);
    expect(handle.providerExecutionId).toBe('decision-local-oracle-e2e-001');
    expect(await readFile(fakeExecutable + '.count', 'utf8')).toBe('1');
  });

  it('replays a durable result after a new MCF adapter process without another model call', async () => {
    const first = await runtime().start(request);
    const second = await runtime().start(request);
    expect(second).toEqual(first);
    expect(await readFile(fakeExecutable + '.count', 'utf8')).toBe('1');
  });

  it('maintains per-mission sessions and uses Codex resume for a new run', async () => {
    const first = await runtime().start(request);
    const second = await runtime().start({
      ...request,
      runId: 'local-oracle-e2e-002',
      authority: { ...request.authority, runId: 'local-oracle-e2e-002' },
    });
    expect(first.providerExecutionId).toBe('decision-local-oracle-e2e-001');
    expect(second.providerExecutionId).toBe('decision-local-oracle-e2e-002');
    expect(await readFile(fakeExecutable + '.count', 'utf8')).toBe('2');
  });

  it('rejects unauthorized tool actions before reaching local subprocess', async () => {
    await expect(
      runtime().start({ ...request, requestedAction: 'deploy-production' }),
    ).rejects.toThrow('does not authorize');
    await expect(readFile(fakeExecutable + '.count', 'utf8')).rejects.toThrow();
  });

  it('keeps the provider unreachable unless explicitly enabled in code', async () => {
    const client = new LocalCodexOracleBridgeClient(settings);
    const engine = new AgentExecutionService(
      new ProviderAdapterRegistry([new CodexOracleProviderAdapter(client)]),
    );
    await expect(engine.start(request)).rejects.toThrow('disabled');
    await expect(readFile(fakeExecutable + '.count', 'utf8')).rejects.toThrow();
  });
});
