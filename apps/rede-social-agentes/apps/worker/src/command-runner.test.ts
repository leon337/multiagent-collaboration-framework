import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { CommandRunner, redactSensitiveText } from './command-runner.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(async (directory) => rm(directory, { recursive: true })));
});

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(`${os.tmpdir()}/mcf-command-runner-`);
  temporaryDirectories.push(directory);
  return directory;
}

function nodeRunner(cwd: string, validateArgv: (argv: readonly string[]) => boolean): CommandRunner {
  return new CommandRunner({
    defaultTimeoutMs: 1_000,
    defaultMaxStdoutBytes: 1_024,
    defaultMaxStderrBytes: 1_024,
    killGraceMs: 25,
    allowlist: [
      {
        id: 'node-test',
        executable: process.execPath,
        cwdRoots: [cwd],
        allowedEnvironmentKeys: ['TEST_SECRET'],
        validateArgv,
      },
    ],
  });
}

describe('CommandRunner', () => {
  it('passes metacharacters as one argv value with shell disabled', async () => {
    const cwd = await temporaryDirectory();
    const dangerous = '$(touch should-never-exist); echo injected';
    const argv = ['-e', 'process.stdout.write(process.argv[1])', dangerous];
    const result = await nodeRunner(cwd, (candidate) => JSON.stringify(candidate) === JSON.stringify(argv)).run({
      policyId: 'node-test',
      executable: process.execPath,
      argv,
      cwd,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(dangerous);
  });

  it('enforces argv, cwd, environment and executable allowlists', async () => {
    const cwd = await temporaryDirectory();
    const runner = nodeRunner(cwd, (argv) => argv[0] === '--version');

    await expect(
      runner.run({ policyId: 'node-test', executable: process.execPath, argv: ['-e', '1'], cwd }),
    ).rejects.toThrow(/argv/);
    await expect(
      runner.run({
        policyId: 'node-test',
        executable: process.execPath,
        argv: ['--version'],
        cwd: '/tmp',
      }),
    ).rejects.toThrow(/outside allowlisted roots/);
    await expect(
      runner.run({
        policyId: 'node-test',
        executable: process.execPath,
        argv: ['--version'],
        cwd,
        environment: { FORBIDDEN: 'value' },
      }),
    ).rejects.toThrow(/environment key/);
  });

  it('bounds output, times out, and redacts credentials', async () => {
    const cwd = await temporaryDirectory();
    const outputArgv = [
      '-e',
      'process.stdout.write("x".repeat(100)); process.stderr.write(process.env.TEST_SECRET)',
    ];
    const runner = nodeRunner(cwd, (candidate) =>
      [JSON.stringify(outputArgv), JSON.stringify(['-e', 'setInterval(() => {}, 1000)'])].includes(
        JSON.stringify(candidate),
      ),
    );
    const bounded = await runner.run({
      policyId: 'node-test',
      executable: process.execPath,
      argv: outputArgv,
      cwd,
      environment: { TEST_SECRET: 'super-secret-value' },
      maxStdoutBytes: 10,
    });
    expect(bounded.stdout).toBe('xxxxxxxxxx');
    expect(bounded.stdoutTruncated).toBe(true);
    expect(bounded.stderr).toBe('[REDACTED]');

    const timedOut = await runner.run({
      policyId: 'node-test',
      executable: process.execPath,
      argv: ['-e', 'setInterval(() => {}, 1000)'],
      cwd,
      timeoutMs: 30,
    });
    expect(timedOut.timedOut).toBe(true);
    expect(timedOut.signal).not.toBeNull();
  });

  it('terminates a child when the owning lease aborts', async () => {
    const cwd = await temporaryDirectory();
    const argv = ['-e', 'setInterval(() => {}, 1000)'];
    const controller = new AbortController();
    const running = nodeRunner(cwd, (candidate) => JSON.stringify(candidate) === JSON.stringify(argv)).run({
      policyId: 'node-test',
      executable: process.execPath,
      argv,
      cwd,
      signal: controller.signal,
    });

    controller.abort(new Error('lease lost'));
    const result = await running;
    expect(result.aborted).toBe(true);
    expect(result.timedOut).toBe(false);
    expect(result.signal).not.toBeNull();
  });

  it('redacts token-shaped values without needing the exact secret', () => {
    expect(
      redactSensitiveText(
        'authorization: Bearer abcdef and {"refresh_token":"hidden"} eyJabcdefghijk.abcdefghijkl.abcdefghijkl',
      ),
    ).not.toContain('hidden');
  });
});
