import { execFile } from 'node:child_process';
import { lstat, realpath } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { promisify } from 'node:util';

import type {
  ContextLiveVerificationRequest,
  ContextLiveVerificationResult,
  ContextLiveVerifier,
} from './context-recovery.service.js';

const execFileAsync = promisify(execFile);
const GIT_REVISION_PATTERN = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u;
const CANONICAL_REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;

export interface GitRepositoryLiveVerifierDependencies {
  now?: () => string;
  runGit?: (repositoryRoot: string, arguments_: readonly string[]) => Promise<string>;
}

async function defaultRunGit(
  repositoryRoot: string,
  arguments_: readonly string[],
): Promise<string> {
  const { stdout } = await execFileAsync('git', ['-C', repositoryRoot, ...arguments_], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024,
    timeout: 5_000,
    windowsHide: true,
  });
  return stdout;
}

export class GitRepositoryLiveVerifier implements ContextLiveVerifier {
  private readonly now: () => string;
  private readonly runGit: (
    repositoryRoot: string,
    arguments_: readonly string[],
  ) => Promise<string>;

  constructor(dependencies: GitRepositoryLiveVerifierDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.runGit = dependencies.runGit ?? defaultRunGit;
  }

  async verify(input: ContextLiveVerificationRequest): Promise<ContextLiveVerificationResult> {
    if (
      input.repository_root === null ||
      !isAbsolute(input.repository_root) ||
      input.expected_revision === null ||
      !GIT_REVISION_PATTERN.test(input.expected_revision) ||
      !CANONICAL_REPOSITORY_PATTERN.test(input.canonical_repository)
    ) {
      return {
        outcome: 'SOURCE_UNAVAILABLE',
        warnings: ['GIT_LIVE_VERIFICATION_CONFIGURATION_INVALID'],
      };
    }

    try {
      const metadata = await lstat(input.repository_root);
      if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
        return {
          outcome: 'SOURCE_UNAVAILABLE',
          warnings: ['GIT_LIVE_VERIFICATION_ROOT_INVALID'],
        };
      }
      const configuredRoot = await realpath(input.repository_root);
      const reportedRoot = (
        await this.runGit(configuredRoot, ['rev-parse', '--show-toplevel'])
      ).trim();
      if ((await realpath(reportedRoot)) !== configuredRoot) {
        return {
          outcome: 'SOURCE_UNAVAILABLE',
          warnings: ['GIT_LIVE_VERIFICATION_ROOT_MISMATCH'],
        };
      }

      const actualRevision = (
        await this.runGit(configuredRoot, ['rev-parse', '--verify', 'HEAD^{commit}'])
      )
        .trim()
        .toLowerCase();
      if (!GIT_REVISION_PATTERN.test(actualRevision)) {
        return {
          outcome: 'SOURCE_UNAVAILABLE',
          warnings: ['GIT_LIVE_VERIFICATION_REVISION_INVALID'],
        };
      }
      const worktreeStatus = (
        await this.runGit(configuredRoot, ['status', '--porcelain=v1', '--untracked-files=normal'])
      ).trim();
      const source = {
        role: 'LIVE_VERIFICATION' as const,
        source_ref: `repo://${input.canonical_repository}/.git/HEAD`,
        source_revision: actualRevision,
        observed_at: this.now(),
      };
      const warnings = [
        ...(actualRevision === input.expected_revision.toLowerCase()
          ? []
          : [`GIT_HEAD_DRIFT:${input.expected_revision.toLowerCase()}:${actualRevision}`]),
        ...(worktreeStatus.length === 0 ? [] : ['GIT_WORKTREE_DIRTY']),
      ];

      return warnings.length === 0
        ? { outcome: 'VERIFIED', source, warnings: [] }
        : { outcome: 'DRIFT_DETECTED', source, warnings };
    } catch {
      return {
        outcome: 'SOURCE_UNAVAILABLE',
        warnings: ['GIT_LIVE_VERIFICATION_FAILED'],
      };
    }
  }
}
