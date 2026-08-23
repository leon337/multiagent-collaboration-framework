import { lstat, mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';

import { CommandRunner, type CommandResult } from './command-runner.js';
import {
  assertBaseCommitAllowed,
  assertFullCommitSha,
  assertSafeIdentifier,
  isPathInside,
  resolveInside,
  type RepositoryPolicy,
} from './policy.js';

export interface PreparedWorktree {
  readonly path: string;
  readonly repositoryKey: string;
  readonly baseCommitSha: string;
  readonly detached: true;
  readonly recovered: boolean;
}

export interface WorktreeManagerOptions {
  readonly gitExecutable: string;
  readonly authorizedWorktreeRoot: string;
  readonly commandTimeoutMs: number;
  readonly maximumStdoutBytes?: number;
  readonly maximumStderrBytes?: number;
}

const GIT_ENVIRONMENT = Object.freeze({
  LANG: 'C',
  LC_ALL: 'C',
  GIT_TERMINAL_PROMPT: '0',
  GIT_CONFIG_NOSYSTEM: '1',
});

function isGitInspectionArgv(argv: readonly string[]): boolean {
  return (
    (argv.length === 4 &&
      argv[0] === 'rev-parse' &&
      argv[1] === '--verify' &&
      argv[2] === '--end-of-options' &&
      typeof argv[3] === 'string' &&
      /^([0-9a-f]{40})\^\{commit\}$/.test(argv[3])) ||
    (argv.length === 3 &&
      argv[0] === 'rev-parse' &&
      argv[1] === '--verify' &&
      argv[2] === 'HEAD') ||
    (argv.length === 3 &&
      argv[0] === 'rev-parse' &&
      argv[1] === '--path-format=absolute' &&
      argv[2] === '--git-common-dir')
  );
}

function worktreeAddArgvIsSafe(argv: readonly string[], root: string): boolean {
  return (
    argv.length === 5 &&
    argv[0] === 'worktree' &&
    argv[1] === 'add' &&
    argv[2] === '--detach' &&
    typeof argv[3] === 'string' &&
    isPathInside(root, argv[3]) &&
    typeof argv[4] === 'string' &&
    /^[0-9a-f]{40}$/.test(argv[4])
  );
}

function requireSuccessfulGit(result: CommandResult, operation: string): void {
  if (result.timedOut) throw new Error(`${operation} timed out`);
  if (result.exitCode !== 0) {
    throw new Error(`${operation} failed: ${result.stderr.slice(0, 2_000)}`);
  }
}

export class WorktreeManager {
  readonly #options: WorktreeManagerOptions;

  constructor(options: WorktreeManagerOptions) {
    this.#options = options;
  }

  async prepare(
    policy: RepositoryPolicy,
    workItemId: string,
    baseCommitSha: string,
  ): Promise<PreparedWorktree> {
    assertSafeIdentifier(workItemId, 'work item id');
    const sha = assertBaseCommitAllowed(policy, baseCommitSha);
    if (!isPathInside(this.#options.authorizedWorktreeRoot, policy.worktreeRoot)) {
      throw new Error('repository worktree root is outside the worker root');
    }

    await this.#assertRealDirectory(policy.repositoryPath, 'repository');
    await mkdir(policy.worktreeRoot, { recursive: true, mode: 0o700 });
    await this.#assertRealDirectory(policy.worktreeRoot, 'worktree root');
    const target = resolveInside(
      policy.worktreeRoot,
      `${workItemId}--${sha.slice(0, 12)}`,
    );
    const commands = this.#createRunner(policy);
    const verify = await commands.run({
      policyId: 'git-inspect',
      executable: this.#options.gitExecutable,
      argv: ['rev-parse', '--verify', '--end-of-options', `${sha}^{commit}`],
      cwd: policy.repositoryPath,
      environment: GIT_ENVIRONMENT,
    });
    requireSuccessfulGit(verify, 'base commit verification');
    if (verify.stdout.trim() !== sha) {
      throw new Error('repository resolved the base commit to a different SHA');
    }

    try {
      await lstat(target);
      await this.#verifyPreparedWorktree(commands, policy.repositoryPath, target, sha);
      return {
        path: target,
        repositoryKey: policy.repositoryKey,
        baseCommitSha: sha,
        detached: true,
        recovered: true,
      };
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    }

    const add = await commands.run({
      policyId: 'git-worktree-add',
      executable: this.#options.gitExecutable,
      argv: ['worktree', 'add', '--detach', target, sha],
      cwd: policy.repositoryPath,
      environment: GIT_ENVIRONMENT,
    });
    requireSuccessfulGit(add, 'detached worktree creation');

    await this.#verifyPreparedWorktree(commands, policy.repositoryPath, target, sha);

    return {
      path: target,
      repositoryKey: policy.repositoryKey,
      baseCommitSha: sha,
      detached: true,
      recovered: false,
    };
  }

  async #verifyPreparedWorktree(
    commands: CommandRunner,
    repositoryPath: string,
    target: string,
    sha: string,
  ): Promise<void> {
    await this.#assertRealDirectory(target, 'prepared worktree');
    const head = await commands.run({
      policyId: 'git-inspect-worktree',
      executable: this.#options.gitExecutable,
      argv: ['rev-parse', '--verify', 'HEAD'],
      cwd: target,
      environment: GIT_ENVIRONMENT,
    });
    requireSuccessfulGit(head, 'prepared worktree HEAD verification');
    if (head.stdout.trim() !== sha) {
      throw new Error('prepared worktree is not pinned to the authorized SHA');
    }

    const [repositoryCommonDirectory, worktreeCommonDirectory] = await Promise.all(
      [repositoryPath, target].map(async (cwd) => {
        const result = await commands.run({
          policyId: cwd === target ? 'git-inspect-worktree' : 'git-inspect',
          executable: this.#options.gitExecutable,
          argv: ['rev-parse', '--path-format=absolute', '--git-common-dir'],
          cwd,
          environment: GIT_ENVIRONMENT,
        });
        requireSuccessfulGit(result, 'Git common directory verification');
        return await realpath(result.stdout.trim());
      }),
    );
    if (repositoryCommonDirectory !== worktreeCommonDirectory) {
      throw new Error('prepared worktree does not belong to the authorized repository');
    }
  }

  #createRunner(policy: RepositoryPolicy): CommandRunner {
    return new CommandRunner({
      defaultTimeoutMs: this.#options.commandTimeoutMs,
      defaultMaxStdoutBytes: this.#options.maximumStdoutBytes ?? 64 * 1_024,
      defaultMaxStderrBytes: this.#options.maximumStderrBytes ?? 256 * 1_024,
      allowlist: [
        {
          id: 'git-inspect',
          executable: this.#options.gitExecutable,
          cwdRoots: [policy.repositoryPath],
          allowedEnvironmentKeys: Object.keys(GIT_ENVIRONMENT),
          validateArgv: isGitInspectionArgv,
        },
        {
          id: 'git-worktree-add',
          executable: this.#options.gitExecutable,
          cwdRoots: [policy.repositoryPath],
          allowedEnvironmentKeys: Object.keys(GIT_ENVIRONMENT),
          validateArgv: (argv) => worktreeAddArgvIsSafe(argv, policy.worktreeRoot),
        },
        {
          id: 'git-inspect-worktree',
          executable: this.#options.gitExecutable,
          cwdRoots: [policy.worktreeRoot],
          allowedEnvironmentKeys: Object.keys(GIT_ENVIRONMENT),
          validateArgv: isGitInspectionArgv,
        },
      ],
    });
  }

  async #assertRealDirectory(directory: string, label: string): Promise<void> {
    if (!path.isAbsolute(directory) || path.resolve(directory) !== directory) {
      throw new Error(`${label} must be a normalized absolute path`);
    }
    const metadata = await lstat(directory);
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      throw new Error(`${label} must be a real directory`);
    }
    if ((await realpath(directory)) !== directory) {
      throw new Error(`${label} must not traverse symbolic links`);
    }
  }
}

export function validateDetachedBaseSha(baseCommitSha: string): string {
  return assertFullCommitSha(baseCommitSha);
}
