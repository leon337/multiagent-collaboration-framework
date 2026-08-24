import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import {
  chmodSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { PassThrough } from 'node:stream';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  loadMcfCloudContextReadConfiguration,
  MCF_CLOUD_CONTEXT_ADAPTER_PATH,
  MCF_CLOUD_CONTEXT_ENABLE_VALUE,
  MCF_CLOUD_CONTEXT_EXECUTION_DEPENDENCY_PATHS,
  MCF_CLOUD_CONTEXT_SOURCE_PATHS,
  MCF_CLOUD_CONTEXT_VERIFIED_PATHS,
  McfCloudContextReadService,
  type McfCloudContextReadConfiguration,
  type McfCloudContextSpawnAdapter,
} from './mcf-cloud-context-read.service.js';

const temporaryDirectories: string[] = [];
const pythonExecutable = realpathSync(
  process.env.MCF_CLOUD_CONTEXT_TEST_PYTHON ?? '/usr/bin/python3',
);
const cloudIngressToken = 'cloud-context-ingress-token-for-service-test-0001';
const sharedContextToken = 'shared-context-read-token-for-service-test-0001';
const ledgerIngressToken = 'ledger-ingress-token-for-service-test-0001';
const ledgerBearerToken = 'ledger-bearer-token-for-service-test-0001';

function digest(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

const pythonExecutableSha256 = digest(readFileSync(pythonExecutable));

function treeFingerprint(root: string): string {
  const evidence: string[] = [];
  const visit = (directory: string, relativeDirectory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      const relativePath = join(relativeDirectory, entry.name);
      const path = join(directory, entry.name);
      const metadata = lstatSync(path);
      if (entry.isDirectory()) {
        evidence.push(`directory:${relativePath}:${metadata.mode & 0o777}`);
        visit(path, relativePath);
      } else if (entry.isSymbolicLink()) {
        evidence.push(`symlink:${relativePath}:${readlinkSync(path)}`);
      } else {
        evidence.push(
          `file:${relativePath}:${metadata.mode & 0o777}:${digest(readFileSync(path))}`,
        );
      }
    }
  };
  visit(root, '');
  return digest(evidence.join('\n'));
}

function providerSchema(): Record<string, unknown> {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    additionalProperties: false,
    required: [
      'protocol',
      'request_id',
      'project_id',
      'operation',
      'status',
      'result',
      'error',
      'freshness',
      'provenance',
    ],
    properties: {
      protocol: { const: 'MCF_CLOUD_CONTEXT_READ_RESULT_V1' },
      request_id: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$' },
      project_id: { const: 'cloud-infrastructure' },
      operation: { const: 'context.get' },
      status: { const: 'PASS' },
      result: { type: 'object' },
      error: { type: 'null' },
      freshness: {
        type: 'object',
        additionalProperties: false,
        required: ['observed_at', 'operational_state', 'workspace_observation', 'source_mode'],
        properties: {
          observed_at: { type: 'string', format: 'date-time' },
          operational_state: { const: 'LIVE_REQUIRED' },
          workspace_observation: { const: 'LIVE_LOCAL_DISPOSABLE' },
          source_mode: { const: 'READ_AT_REQUEST_TIME' },
        },
      },
      provenance: {
        type: 'object',
        additionalProperties: false,
        required: ['repository', 'adapter_config', 'sources'],
        properties: {
          repository: { const: 'leon337/cloud-infrastructure' },
          adapter_config: {
            const: 'platform/control-bridge/mcf-cloud-context-read-config.yaml',
          },
          sources: {
            type: 'array',
            minItems: MCF_CLOUD_CONTEXT_SOURCE_PATHS.length,
            maxItems: MCF_CLOUD_CONTEXT_SOURCE_PATHS.length,
            uniqueItems: true,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['path', 'sha256'],
              properties: {
                path: { enum: [...MCF_CLOUD_CONTEXT_SOURCE_PATHS] },
                sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' },
              },
            },
          },
        },
      },
    },
  };
}

function providerProgram(): string {
  const sourcePaths = JSON.stringify(MCF_CLOUD_CONTEXT_SOURCE_PATHS);
  return `#!/usr/bin/env python3
import hashlib
import json
import os
import pathlib
import sys

root = pathlib.Path.cwd()
raw = sys.stdin.buffer.read(4097)
request = json.loads(raw.decode("utf-8"))
expected_keys = {"protocol", "request_id", "project_id", "operation", "arguments"}
if (
    len(raw) > 4096
    or not raw.endswith(b"\\n")
    or set(request) != expected_keys
    or request["protocol"] != "MCF_CLOUD_CONTEXT_READ_V1"
    or request["project_id"] != "cloud-infrastructure"
    or request["operation"] != "context.get"
    or request["arguments"] != {}
    or os.environ.get("MCF_CLOUD_CONTEXT_READ_ENABLE") != "DISPOSABLE_LOCAL_LAB_ONLY"
):
    raise SystemExit(2)
paths = ${sourcePaths}
sources = [
    {"path": path, "sha256": hashlib.sha256((root / path).read_bytes()).hexdigest()}
    for path in paths
]
response = {
    "protocol": "MCF_CLOUD_CONTEXT_READ_RESULT_V1",
    "request_id": request["request_id"],
    "project_id": "cloud-infrastructure",
    "operation": "context.get",
    "status": "PASS",
    "result": {"fixture": "read-only"},
    "error": None,
    "freshness": {
        "observed_at": "2026-08-23T18:00:00Z",
        "operational_state": "LIVE_REQUIRED",
        "workspace_observation": "LIVE_LOCAL_DISPOSABLE",
        "source_mode": "READ_AT_REQUEST_TIME",
    },
    "provenance": {
        "repository": "leon337/cloud-infrastructure",
        "adapter_config": "platform/control-bridge/mcf-cloud-context-read-config.yaml",
        "sources": sources,
    },
}
sys.stdout.write(json.dumps(response, separators=(",", ":"), sort_keys=True) + "\\n")
`;
}

function fixture(): {
  configuration: McfCloudContextReadConfiguration;
  root: string;
  temporaryRoot: string;
} {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'mcf-cloud-context-service-'));
  temporaryDirectories.push(temporaryRoot);
  const root = join(temporaryRoot, 'workspaces/leon337/g2a-smoke/dev');
  for (const sourcePath of MCF_CLOUD_CONTEXT_VERIFIED_PATHS) {
    const target = join(root, sourcePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, `fixture:${sourcePath}\n`, 'utf8');
  }
  writeFileSync(
    join(root, 'platform/schemas/mcf-cloud-context-read-result.schema.json'),
    `${JSON.stringify(providerSchema())}\n`,
    'utf8',
  );
  writeFileSync(join(root, MCF_CLOUD_CONTEXT_ADAPTER_PATH), providerProgram(), 'utf8');
  chmodSync(join(root, MCF_CLOUD_CONTEXT_ADAPTER_PATH), 0o755);

  const expectedVerifiedFileSha256 = Object.fromEntries(
    MCF_CLOUD_CONTEXT_VERIFIED_PATHS.map((sourcePath) => [
      sourcePath,
      digest(readFileSync(join(root, sourcePath))),
    ]),
  );
  return {
    root,
    temporaryRoot,
    configuration: {
      enable: MCF_CLOUD_CONTEXT_ENABLE_VALUE,
      repository_root: root,
      python_executable: pythonExecutable,
      python_executable_sha256: pythonExecutableSha256,
      expected_verified_file_sha256: expectedVerifiedFileSha256,
    },
  };
}

function inertChild(onKill?: () => void, closeOnKill = true): ChildProcessWithoutNullStreams {
  const events = new EventEmitter();
  const child = events as unknown as ChildProcessWithoutNullStreams;
  Object.assign(child, {
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    killed: false,
  });
  child.kill = vi.fn(() => {
    Object.defineProperty(child, 'killed', { configurable: true, value: true });
    onKill?.();
    if (closeOnKill) queueMicrotask(() => events.emit('close', null));
    return true;
  }) as typeof child.kill;
  return child;
}

afterEach(() => {
  vi.useRealTimers();
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('McfCloudContextReadService', () => {
  it('stays disabled unless every exact allowlist field is present', async () => {
    expect(loadMcfCloudContextReadConfiguration({})).toBeNull();
    const valid = fixture().configuration;
    expect(
      loadMcfCloudContextReadConfiguration({
        MCF_CLOUD_CONTEXT_READ_CONFIG_JSON: JSON.stringify(valid),
        MCF_CLOUD_CONTEXT_INGRESS_TOKEN: cloudIngressToken,
        MCF_CONTEXT_READ_TOKEN: sharedContextToken,
        MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: ledgerIngressToken,
        MCF_COGNITIVE_LEDGER_BEARER_TOKEN: ledgerBearerToken,
      }),
    ).toEqual(valid);

    const incomplete = structuredClone(valid);
    delete incomplete.expected_verified_file_sha256['state/control-bridge-g2a.yaml'];
    expect(
      loadMcfCloudContextReadConfiguration({
        MCF_CLOUD_CONTEXT_READ_CONFIG_JSON: JSON.stringify(incomplete),
        MCF_CLOUD_CONTEXT_INGRESS_TOKEN: cloudIngressToken,
        MCF_CONTEXT_READ_TOKEN: sharedContextToken,
        MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: ledgerIngressToken,
        MCF_COGNITIVE_LEDGER_BEARER_TOKEN: ledgerBearerToken,
      }),
    ).toBeNull();

    expect(
      loadMcfCloudContextReadConfiguration({
        MCF_CLOUD_CONTEXT_READ_CONFIG_JSON: JSON.stringify(valid),
        MCF_CLOUD_CONTEXT_INGRESS_TOKEN: sharedContextToken,
        MCF_CONTEXT_READ_TOKEN: sharedContextToken,
        MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: ledgerIngressToken,
        MCF_COGNITIVE_LEDGER_BEARER_TOKEN: ledgerBearerToken,
      }),
    ).toBeNull();

    for (const reusedToken of [ledgerIngressToken, ledgerBearerToken]) {
      expect(
        loadMcfCloudContextReadConfiguration({
          MCF_CLOUD_CONTEXT_READ_CONFIG_JSON: JSON.stringify(valid),
          MCF_CLOUD_CONTEXT_INGRESS_TOKEN: reusedToken,
          MCF_CONTEXT_READ_TOKEN: sharedContextToken,
          MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: ledgerIngressToken,
          MCF_COGNITIVE_LEDGER_BEARER_TOKEN: ledgerBearerToken,
        }),
      ).toBeNull();
    }

    await expect(new McfCloudContextReadService(null).readOnly()).rejects.toMatchObject({
      code: 'MCF_CLOUD_CONTEXT_READ_DISABLED',
    });
  });

  it('spawns one exact Python -I command with a minimal environment and verifies provenance', async () => {
    const { configuration, root } = fixture();
    const fingerprintBefore = treeFingerprint(root);
    const calls: Array<{ executable: string; arguments_: readonly string[]; options: unknown }> =
      [];
    const spawnAdapter: McfCloudContextSpawnAdapter = (executable, arguments_, options) => {
      calls.push({ executable, arguments_, options });
      return spawn(executable, [...arguments_], options);
    };

    const receipt = await new McfCloudContextReadService(configuration, spawnAdapter).readOnly();

    expect(receipt).toMatchObject({
      schema_version: 1,
      read_only: true,
      material_action: false,
      provider_payload_persisted_by_mcf: false,
      evidence_only: true,
      provider_response: {
        status: 'PASS',
        result: { fixture: 'read-only' },
        freshness: { workspace_observation: 'LIVE_LOCAL_DISPOSABLE' },
      },
    });
    expect(receipt.provider_response.provenance.sources).toHaveLength(13);
    expect(calls).toEqual([
      {
        executable: configuration.python_executable,
        arguments_: ['-I', 'platform/control-bridge/mcf-cloud-context-read'],
        options: {
          cwd: configuration.repository_root,
          env: { MCF_CLOUD_CONTEXT_READ_ENABLE: 'DISPOSABLE_LOCAL_LAB_ONLY' },
          shell: false,
          stdio: ['pipe', 'pipe', 'pipe'],
          windowsHide: true,
        },
      },
    ]);
    expect(treeFingerprint(root)).toBe(fingerprintBefore);
  });

  it('rejects concurrent work and releases the single-read bulkhead after success', async () => {
    const { configuration } = fixture();
    const service = new McfCloudContextReadService(configuration);

    const first = service.readOnly();
    await expect(service.readOnly()).rejects.toMatchObject({ code: 'MCF_CLOUD_CONTEXT_BUSY' });
    await expect(first).resolves.toMatchObject({ provider_response: { status: 'PASS' } });
    await expect(service.readOnly()).resolves.toMatchObject({
      provider_response: { status: 'PASS' },
    });
  });

  it('fails before spawn when any configured source or executable digest drifts', async () => {
    const { configuration, root } = fixture();
    writeFileSync(join(root, 'state/control-bridge-g2a.yaml'), 'tampered\n', 'utf8');
    const spawnAdapter = vi.fn();

    await expect(
      new McfCloudContextReadService(
        configuration,
        spawnAdapter as unknown as McfCloudContextSpawnAdapter,
      ).readOnly(),
    ).rejects.toMatchObject({ code: 'MCF_CLOUD_CONTEXT_BOUNDARY_INVALID' });
    expect(spawnAdapter).not.toHaveBeenCalled();

    const symlinked = fixture();
    const symlinkTarget = join(symlinked.temporaryRoot, 'outside.yaml');
    writeFileSync(symlinkTarget, 'outside\n', 'utf8');
    const sourcePath = join(symlinked.root, 'state/control-bridge-g2a.yaml');
    unlinkSync(sourcePath);
    symlinkSync(symlinkTarget, sourcePath);
    await expect(
      new McfCloudContextReadService(symlinked.configuration).readOnly(),
    ).rejects.toMatchObject({ code: 'MCF_CLOUD_CONTEXT_BOUNDARY_INVALID' });

    const second = fixture().configuration;
    second.python_executable_sha256 = '0'.repeat(64);
    await expect(new McfCloudContextReadService(second).readOnly()).rejects.toMatchObject({
      code: 'MCF_CLOUD_CONTEXT_BOUNDARY_INVALID',
    });
  });

  it.each(MCF_CLOUD_CONTEXT_EXECUTION_DEPENDENCY_PATHS)(
    'fails before spawn when execution dependency %s drifts',
    async (executionDependencyPath) => {
      const { configuration, root } = fixture();
      writeFileSync(join(root, executionDependencyPath), 'tampered execution dependency\n', 'utf8');
      const spawnAdapter = vi.fn();

      await expect(
        new McfCloudContextReadService(
          configuration,
          spawnAdapter as unknown as McfCloudContextSpawnAdapter,
        ).readOnly(),
      ).rejects.toMatchObject({ code: 'MCF_CLOUD_CONTEXT_BOUNDARY_INVALID' });
      expect(spawnAdapter).not.toHaveBeenCalled();
    },
  );

  it.each(MCF_CLOUD_CONTEXT_EXECUTION_DEPENDENCY_PATHS)(
    'fails before spawn when execution dependency %s is a symlink',
    async (executionDependencyPath) => {
      const testFixture = fixture();
      const target = join(
        testFixture.temporaryRoot,
        `outside-${executionDependencyPath.replaceAll('/', '-')}`,
      );
      writeFileSync(target, 'outside execution dependency\n', 'utf8');
      const dependency = join(testFixture.root, executionDependencyPath);
      unlinkSync(dependency);
      symlinkSync(target, dependency);
      const spawnAdapter = vi.fn();

      await expect(
        new McfCloudContextReadService(
          testFixture.configuration,
          spawnAdapter as unknown as McfCloudContextSpawnAdapter,
        ).readOnly(),
      ).rejects.toMatchObject({ code: 'MCF_CLOUD_CONTEXT_BOUNDARY_INVALID' });
      expect(spawnAdapter).not.toHaveBeenCalled();
    },
  );

  it.each(MCF_CLOUD_CONTEXT_EXECUTION_DEPENDENCY_PATHS)(
    'fails after execution when dependency %s drifts while the child runs',
    async (executionDependencyPath) => {
      const { configuration, root } = fixture();
      const spawnAdapter: McfCloudContextSpawnAdapter = (executable, arguments_, options) => {
        const child = spawn(executable, [...arguments_], options);
        child.once('close', () => {
          writeFileSync(
            join(root, executionDependencyPath),
            'drifted while the child ran\n',
            'utf8',
          );
        });
        return child;
      };

      await expect(
        new McfCloudContextReadService(configuration, spawnAdapter).readOnly(),
      ).rejects.toMatchObject({ code: 'MCF_CLOUD_CONTEXT_BOUNDARY_INVALID' });
    },
  );

  it.each(['control_plane/__pycache__', 'control_plane/g2a/__pycache__', 'scripts/__pycache__'])(
    'fails before spawn when owned import directory %s contains bytecode cache',
    async (cache) => {
      const { configuration, root } = fixture();
      mkdirSync(join(root, cache), { recursive: true });
      writeFileSync(join(root, cache, 'owned.cpython-312.pyc'), 'untrusted bytecode', 'utf8');
      const spawnAdapter = vi.fn();

      await expect(
        new McfCloudContextReadService(
          configuration,
          spawnAdapter as unknown as McfCloudContextSpawnAdapter,
        ).readOnly(),
      ).rejects.toMatchObject({ code: 'MCF_CLOUD_CONTEXT_BOUNDARY_INVALID' });
      expect(spawnAdapter).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['stdout', 65_537],
    ['stderr', 4_097],
  ] as const)('kills and normalizes an over-limit %s response', async (stream, bytes) => {
    const { configuration } = fixture();
    let child: ChildProcessWithoutNullStreams;
    const spawnAdapter: McfCloudContextSpawnAdapter = () => {
      child = inertChild();
      queueMicrotask(() => (child[stream] as PassThrough).write(Buffer.alloc(bytes)));
      return child;
    };

    await expect(
      new McfCloudContextReadService(configuration, spawnAdapter).readOnly(),
    ).rejects.toMatchObject({ code: 'MCF_CLOUD_CONTEXT_OUTPUT_LIMIT_EXCEEDED' });
    expect(child!.kill).toHaveBeenCalledWith('SIGKILL');
  });

  it('normalizes spawn errors, settles boundedly without close and releases the bulkhead', async () => {
    vi.useFakeTimers();
    const { configuration } = fixture();
    const children: ChildProcessWithoutNullStreams[] = [];
    const spawnAdapter: McfCloudContextSpawnAdapter = () => {
      const child = inertChild(undefined, false);
      children.push(child);
      queueMicrotask(() => child.emit('error', new Error('sensitive internal spawn detail')));
      return child;
    };
    const service = new McfCloudContextReadService(configuration, spawnAdapter);
    const promise = service.readOnly();
    const assertion = expect(promise).rejects.toMatchObject({
      code: 'MCF_CLOUD_CONTEXT_ADAPTER_FAILED',
      message: 'The local read-only Cloud context adapter is unavailable.',
    });

    await vi.advanceTimersByTimeAsync(1_001);
    await assertion;
    expect(children[0]?.kill).toHaveBeenCalledWith('SIGKILL');

    const second = service.readOnly();
    const secondAssertion = expect(second).rejects.toMatchObject({
      code: 'MCF_CLOUD_CONTEXT_ADAPTER_FAILED',
    });
    await vi.advanceTimersByTimeAsync(1_001);
    await secondAssertion;
    expect(children).toHaveLength(2);
  });

  it('enforces timeout, settles boundedly without close and releases the bulkhead', async () => {
    vi.useFakeTimers();
    const { configuration } = fixture();
    let killed = false;
    let calls = 0;
    const spawnAdapter: McfCloudContextSpawnAdapter = () => {
      calls += 1;
      const child = inertChild(() => (killed = true), false);
      if (calls > 1) {
        queueMicrotask(() => child.emit('error', new Error('second synthetic failure')));
      }
      return child;
    };
    const service = new McfCloudContextReadService(configuration, spawnAdapter);
    const promise = service.readOnly();
    const assertion = expect(promise).rejects.toMatchObject({
      code: 'MCF_CLOUD_CONTEXT_TIMEOUT',
    });

    await vi.advanceTimersByTimeAsync(21_001);
    await assertion;
    expect(killed).toBe(true);

    const second = service.readOnly();
    const secondAssertion = expect(second).rejects.toMatchObject({
      code: 'MCF_CLOUD_CONTEXT_ADAPTER_FAILED',
    });
    await vi.advanceTimersByTimeAsync(1_001);
    await secondAssertion;
    expect(calls).toBe(2);
  });
});
