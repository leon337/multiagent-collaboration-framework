import { chmod, mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { ArtifactStore } from './artifact-store.js';
import type { CodexRunResult } from './codex-runner.js';
import type { GitEvidence } from './git-evidence.js';
import { CodexMissionStepExecutor } from './job-executor.js';
import type { MissionStepExecutionInput } from './mission-coordinator.js';
import { createRepositoryPolicy, RepositoryPolicyRegistry } from './policy.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => rm(directory, { recursive: true })),
  );
});

function codexResult(): CodexRunResult {
  return {
    command: {
      exitCode: 0,
      signal: null,
      timedOut: false,
      aborted: false,
      stdout: '{"type":"turn.completed"}\n',
      stderr: '',
      stdoutTruncated: false,
      stderrTruncated: false,
      durationMs: 100,
    },
    output: {
      threadId: 'thread-1',
      result: {
        schemaVersion: '1.0',
        status: 'COMPLETED',
        summary: 'Implemented the bounded step.',
        changedFiles: ['apps/worker/src/example.ts'],
        validations: [],
        residualRisks: [],
        nextAction: null,
      },
      finalAgentMessage: '{}',
      turnCompleted: true,
      turnFailed: false,
      invalidLineCount: 0,
      acceptedEventCount: 1,
    },
  };
}

function evidence(changedFiles = ['apps/worker/src/example.ts']): GitEvidence {
  return {
    baseCommitSha: 'b'.repeat(40),
    headCommitSha: 'b'.repeat(40),
    changedFiles,
    changedFileDigests: changedFiles.map((changedFile) => ({
      path: changedFile,
      kind: 'FILE' as const,
      sha256: 'c'.repeat(64),
      bytes: 10,
    })),
    workspaceDigest: 'd'.repeat(64),
    porcelainStatus: ' M apps/worker/src/example.ts\0',
    binaryDiff: 'diff --git a/example b/example\n',
    diffCheckPassed: true,
    diffCheckOutput: '',
    capturedAt: '2026-08-22T12:00:00.000Z',
  };
}

async function fixture(changedFiles?: string[]) {
  const root = await mkdtemp(`${os.tmpdir()}/mcf-executor-`);
  temporaryDirectories.push(root);
  await chmod(root, 0o700);
  const repositoryPath = path.join(root, 'repository');
  const worktreeRoot = path.join(root, 'worktrees');
  const worktreePath = path.join(worktreeRoot, 'mission-001');
  const artifactRoot = path.join(root, 'artifacts');
  await mkdir(repositoryPath, { mode: 0o700 });
  await mkdir(worktreePath, { recursive: true, mode: 0o700 });
  await mkdir(artifactRoot, { mode: 0o700 });
  const policy = createRepositoryPolicy({
    repositoryKey: 'mcf',
    repositoryPath,
    worktreeRoot,
    allowedBaseCommitShas: ['b'.repeat(40)],
    writablePaths: ['apps/worker/src'],
    validationCommands: [],
  });
  const executor = new CodexMissionStepExecutor({
    policies: new RepositoryPolicyRegistry([policy]),
    artifacts: new ArtifactStore({ root: artifactRoot, maximumArtifactBytes: 1_024 * 1_024 }),
    codex: { run: async () => codexResult() },
    evidence: { collect: async () => evidence(changedFiles) },
    now: () => new Date('2026-08-22T12:00:00.000Z'),
  });
  const input: MissionStepExecutionInput = {
    missionId: 'mission-001',
    missionSpecDigest: 'a'.repeat(64),
    repositoryKey: 'mcf',
    baseCommitSha: 'b'.repeat(40),
    worktreePath,
    step: {
      stepKey: 'implement',
      stepOrder: 1,
      objective: 'Implement the bounded worker change.',
      acceptanceCriteria: ['the worker change is validated'],
      verificationProfiles: [],
      attempt: 1,
    },
    executionKey: 'e'.repeat(64),
    signal: new AbortController().signal,
  };
  return { executor, input };
}

describe('CodexMissionStepExecutor', () => {
  it('uses policy-selected execution and returns immutable evidence artifacts', async () => {
    const { executor, input } = await fixture();
    const result = await executor.execute(input);

    expect(result).toMatchObject({
      outcome: 'COMPLETED',
      changedFiles: ['apps/worker/src/example.ts'],
      patchDigest: 'd'.repeat(64),
    });
    expect(result.artifacts.map((artifact) => artifact.kind)).toEqual(
      expect.arrayContaining(['prompt', 'codex-stdout', 'codex-stderr', 'git-diff', 'git-status']),
    );
  });

  it('fails closed when independent Git evidence escapes writable policy', async () => {
    const { executor, input } = await fixture(['apps/server/src/escape.ts']);
    await expect(executor.execute(input)).rejects.toMatchObject({
      name: 'StepExecutionError',
      failure: { kind: 'POLICY', retryable: false },
    });
  });

  it('classifies an unavailable credential lock as transient without exposing output', async () => {
    const { input } = await fixture();
    const root = await mkdtemp(`${os.tmpdir()}/mcf-executor-busy-`);
    temporaryDirectories.push(root);
    await chmod(root, 0o700);
    const policy = createRepositoryPolicy({
      repositoryKey: 'mcf',
      repositoryPath: root,
      worktreeRoot: path.dirname(input.worktreePath),
      allowedBaseCommitShas: [input.baseCommitSha],
      writablePaths: ['apps/worker/src'],
      validationCommands: [],
    });
    const executor = new CodexMissionStepExecutor({
      policies: new RepositoryPolicyRegistry([policy]),
      artifacts: new ArtifactStore({ root, maximumArtifactBytes: 1_024 * 1_024 }),
      codex: {
        run: async () => ({
          ...codexResult(),
          command: { ...codexResult().command, exitCode: 1 },
        }),
      },
      evidence: { collect: async () => evidence() },
    });

    await expect(executor.execute(input)).rejects.toMatchObject({
      failure: { code: 'CODEX_CREDENTIAL_STREAM_BUSY', kind: 'TRANSIENT' },
    });
  });
});
