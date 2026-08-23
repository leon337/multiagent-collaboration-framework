import { createHash } from 'node:crypto';
import path from 'node:path';

import { type ArtifactStore, type StoredArtifact } from './artifact-store.js';
import { CommandRunner } from './command-runner.js';
import type { CodexRunRequest, CodexRunResult } from './codex-runner.js';
import type { GitEvidence } from './git-evidence.js';
import type {
  MissionStepExecutionInput,
  MissionStepExecutionOutput,
  MissionStepExecutorPort,
  MissionStepFailure,
} from './mission-coordinator.js';
import { buildCodexPrompt } from './prompt-builder.js';
import { isPathInside, type RepositoryPolicyRegistry } from './policy.js';

export interface CodexInvocationPort {
  run(request: CodexRunRequest): Promise<CodexRunResult>;
}

export interface GitEvidencePort {
  collect(
    worktreePath: string,
    baseCommitSha: string,
    writablePaths: readonly string[],
  ): Promise<GitEvidence>;
}

export interface CodexMissionStepExecutorOptions {
  readonly policies: RepositoryPolicyRegistry;
  readonly artifacts: ArtifactStore;
  readonly codex: CodexInvocationPort;
  readonly evidence: GitEvidencePort;
  readonly validationMaximumOutputBytes?: number;
  readonly now?: () => Date;
}

export class StepExecutionError extends Error {
  readonly failure: MissionStepFailure;

  constructor(failure: MissionStepFailure) {
    super(failure.message);
    this.name = 'StepExecutionError';
    this.failure = failure;
  }
}

function failure(
  code: string,
  message: string,
  kind: MissionStepFailure['kind'],
  retryable: boolean,
): StepExecutionError {
  return new StepExecutionError({ code, message, kind, retryable });
}

export function classifyStepExecutionFailure(error: unknown): MissionStepFailure {
  if (error instanceof StepExecutionError) return error.failure;
  return {
    code: 'MISSION_STEP_EXECUTION_FAILED',
    message: error instanceof Error ? error.message.slice(0, 2_000) : 'Unknown step execution failure',
    kind: 'TRANSIENT',
    retryable: true,
  };
}

function artifactReference(kind: string, artifact: StoredArtifact) {
  if (artifact.truncated) {
    throw failure(
      'EVIDENCE_TRUNCATED',
      `Required ${kind} evidence exceeded its immutable artifact limit.`,
      'POLICY',
      false,
    );
  }
  return {
    kind,
    path: artifact.path,
    sha256: artifact.sha256,
    bytes: artifact.bytes,
  } as const;
}

function contentName(kind: string, extension: string, content: string): string {
  const digest = createHash('sha256').update(content).digest('hex').slice(0, 20);
  return `${kind}.${digest}.${extension}`;
}

function pathIsWritable(candidate: string, writablePaths: readonly string[]): boolean {
  return writablePaths.some(
    (allowed) => candidate === allowed || candidate.startsWith(`${allowed}/`),
  );
}

function looksLikeAuthenticationFailure(stderr: string): boolean {
  return /(?:login required|not logged in|authentication failed|unauthorized|\b401\b)/iu.test(stderr);
}

function assertActive(signal: AbortSignal): void {
  if (!signal.aborted) return;
  throw signal.reason instanceof Error ? signal.reason : new Error('step execution aborted');
}

const VALIDATION_ENVIRONMENT = Object.freeze({
  LANG: 'C.UTF-8',
  LC_ALL: 'C.UTF-8',
  PATH: '/usr/local/bin:/usr/bin:/bin',
  CI: 'true',
  NO_COLOR: '1',
  GIT_TERMINAL_PROMPT: '0',
});

export class CodexMissionStepExecutor implements MissionStepExecutorPort {
  readonly #options: CodexMissionStepExecutorOptions;
  readonly #validationMaximumOutputBytes: number;
  readonly #now: () => Date;

  constructor(options: CodexMissionStepExecutorOptions) {
    const maximum = options.validationMaximumOutputBytes ?? 4 * 1_024 * 1_024;
    if (!Number.isSafeInteger(maximum) || maximum < 1_024) {
      throw new Error('validation output limit must be an integer of at least 1024 bytes');
    }
    this.#options = options;
    this.#validationMaximumOutputBytes = maximum;
    this.#now = options.now ?? (() => new Date());
  }

  async execute(input: MissionStepExecutionInput): Promise<MissionStepExecutionOutput> {
    assertActive(input.signal);
    const policy = this.#options.policies.get(input.repositoryKey);
    if (
      !path.isAbsolute(input.worktreePath) ||
      path.resolve(input.worktreePath) !== input.worktreePath ||
      !isPathInside(policy.worktreeRoot, input.worktreePath)
    ) {
      throw failure(
        'WORKTREE_POLICY_VIOLATION',
        'Mission worktree is outside the repository policy.',
        'POLICY',
        false,
      );
    }
    if (!policy.allowedBaseCommitShas.has(input.baseCommitSha)) {
      throw failure(
        'BASE_SHA_POLICY_VIOLATION',
        'Mission base SHA is not authorized by repository policy.',
        'POLICY',
        false,
      );
    }
    if (!/^[a-f0-9]{64}$/u.test(input.executionKey)) {
      throw failure('INVALID_EXECUTION_KEY', 'Step execution key is invalid.', 'POLICY', false);
    }

    const artifactDirectory = await this.#options.artifacts.createAttemptDirectory(
      `step-${input.executionKey.slice(0, 32)}`,
      input.step.attempt,
    );
    const prompt = buildCodexPrompt(
      {
        workItemId: `step-${input.executionKey.slice(0, 32)}`,
        missionId: input.missionId,
        objective: input.step.objective,
        acceptanceCriteria: input.step.acceptanceCriteria,
        baseCommitSha: input.baseCommitSha,
        attempt: input.step.attempt,
      },
      policy,
    );
    const artifacts = [
      artifactReference(
        'prompt',
        await this.#options.artifacts.writeTextIdempotent(
          artifactDirectory,
          contentName('prompt', 'txt', prompt),
          prompt,
        ),
      ),
    ];

    const codex = await this.#options.codex.run({
      worktreePath: input.worktreePath,
      prompt,
      signal: input.signal,
    });
    assertActive(input.signal);
    artifacts.push(
      artifactReference(
        'codex-stdout',
        await this.#options.artifacts.writeTextIdempotent(
          artifactDirectory,
          contentName('codex-stdout', 'jsonl', codex.command.stdout),
          codex.command.stdout,
        ),
      ),
      artifactReference(
        'codex-stderr',
        await this.#options.artifacts.writeTextIdempotent(
          artifactDirectory,
          contentName('codex-stderr', 'log', codex.command.stderr),
          codex.command.stderr,
        ),
      ),
    );

    if (codex.command.aborted) assertActive(input.signal);
    if (codex.command.timedOut) {
      throw failure('CODEX_STEP_TIMEOUT', 'The bounded Codex step timed out.', 'TRANSIENT', true);
    }
    if (codex.command.stdoutTruncated || codex.command.stderrTruncated) {
      throw failure(
        'CODEX_OUTPUT_TRUNCATED',
        'Codex output exceeded the configured evidence limit.',
        'POLICY',
        false,
      );
    }
    if (codex.command.exitCode !== 0) {
      if (codex.command.exitCode === 1 && codex.command.stderr.trim() === '') {
        throw failure(
          'CODEX_CREDENTIAL_STREAM_BUSY',
          'The serialized Codex credential stream is already in use.',
          'TRANSIENT',
          true,
        );
      }
      if (looksLikeAuthenticationFailure(codex.command.stderr)) {
        throw failure(
          'CODEX_LOGIN_REQUIRED',
          'The persistent Codex login must be reseeded by an operator.',
          'AUTH',
          false,
        );
      }
      throw failure('CODEX_PROCESS_FAILED', 'The bounded Codex process failed.', 'TRANSIENT', true);
    }
    if (
      codex.output.turnFailed ||
      !codex.output.turnCompleted ||
      codex.output.result === null
    ) {
      throw failure(
        'CODEX_RESULT_INVALID',
        'Codex did not return one complete schema-valid result.',
        'TRANSIENT',
        true,
      );
    }

    const git = await this.#options.evidence.collect(
      input.worktreePath,
      input.baseCommitSha,
      policy.writablePaths,
    );
    const escaped = git.changedFiles.find(
      (changedFile) => !pathIsWritable(changedFile, policy.writablePaths),
    );
    if (escaped !== undefined) {
      throw failure(
        'WRITE_SCOPE_VIOLATION',
        `Independent Git evidence found an out-of-scope path: ${escaped}`,
        'POLICY',
        false,
      );
    }
    if (git.baseCommitSha !== input.baseCommitSha || git.headCommitSha !== input.baseCommitSha) {
      throw failure(
        'WORKTREE_HEAD_MOVED',
        'The mission worktree moved away from its immutable base SHA.',
        'POLICY',
        false,
      );
    }
    if (!git.diffCheckPassed) {
      throw failure('GIT_DIFF_CHECK_FAILED', 'Git diff --check failed.', 'POLICY', false);
    }

    artifacts.push(
      artifactReference(
        'git-diff',
        await this.#options.artifacts.writeTextIdempotent(
          artifactDirectory,
          contentName('git-diff', 'patch', git.binaryDiff),
          git.binaryDiff,
        ),
      ),
      artifactReference(
        'git-status',
        await this.#options.artifacts.writeTextIdempotent(
          artifactDirectory,
          contentName('git-status', 'porcelain', git.porcelainStatus),
          git.porcelainStatus,
        ),
      ),
    );

    const validations = [];
    if (codex.output.result.status === 'COMPLETED') {
      for (const profile of input.step.verificationProfiles) {
        const command = policy.validationCommands.find((candidate) => candidate.id === profile);
        if (command === undefined) {
          throw failure(
            'VERIFICATION_PROFILE_NOT_ALLOWED',
            `Verification profile is not authorized: ${profile}`,
            'POLICY',
            false,
          );
        }
        const runner = new CommandRunner({
          defaultTimeoutMs: command.timeoutMs,
          defaultMaxStdoutBytes: this.#validationMaximumOutputBytes,
          defaultMaxStderrBytes: this.#validationMaximumOutputBytes,
          allowlist: [
            {
              id: `validation-${command.id}`,
              executable: command.executable,
              cwdRoots: [input.worktreePath],
              allowedEnvironmentKeys: Object.keys(VALIDATION_ENVIRONMENT),
              validateArgv: (argv) =>
                argv.length === command.argv.length &&
                argv.every((argument, index) => argument === command.argv[index]),
            },
          ],
        });
        const result = await runner.run({
          policyId: `validation-${command.id}`,
          executable: command.executable,
          argv: command.argv,
          cwd: input.worktreePath,
          environment: VALIDATION_ENVIRONMENT,
          timeoutMs: command.timeoutMs,
          signal: input.signal,
        });
        assertActive(input.signal);
        const validationLog = JSON.stringify({
          profile,
          exitCode: result.exitCode,
          signal: result.signal,
          timedOut: result.timedOut,
          stdout: result.stdout,
          stderr: result.stderr,
        });
        const validationArtifact = artifactReference(
          'validation-log',
          await this.#options.artifacts.writeTextIdempotent(
            artifactDirectory,
            contentName(`validation-${profile}`, 'json', validationLog),
            `${validationLog}\n`,
          ),
        );
        artifacts.push(validationArtifact);
        validations.push({
          profile,
          status:
            !result.timedOut && !result.aborted && result.exitCode === 0
              ? ('PASSED' as const)
              : ('FAILED' as const),
          exitCode: result.exitCode,
          outputDigest: validationArtifact.sha256,
        });
      }
    } else {
      validations.push(
        ...input.step.verificationProfiles.map((profile) => ({
          profile,
          status: 'SKIPPED' as const,
          exitCode: null,
          outputDigest: null,
        })),
      );
    }

    const validationFailed = validations.some((validation) => validation.status === 'FAILED');
    const outcome = validationFailed
      ? ('FAILED' as const)
      : codex.output.result.status === 'COMPLETED'
        ? ('COMPLETED' as const)
        : codex.output.result.status;

    return {
      outcome,
      summary: validationFailed
        ? `${codex.output.result.summary} One or more required validations failed.`
        : codex.output.result.summary,
      changedFiles: [...git.changedFiles],
      patchDigest: git.workspaceDigest,
      artifacts,
      validations,
      completedAt: this.#now().toISOString(),
    };
  }
}
