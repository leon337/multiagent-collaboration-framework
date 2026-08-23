import { createHash } from 'node:crypto';
import { lstat, readFile, readlink, realpath } from 'node:fs/promises';
import path from 'node:path';

import { CommandRunner, type CommandResult } from './command-runner.js';
import { assertFullCommitSha, isPathInside, normalizeRelativeWorkspacePath } from './policy.js';

export interface GitEvidence {
  readonly baseCommitSha: string;
  readonly headCommitSha: string;
  readonly changedFiles: readonly string[];
  readonly changedFileDigests: readonly ChangedFileDigest[];
  readonly workspaceDigest: string;
  readonly porcelainStatus: string;
  readonly binaryDiff: string;
  readonly diffCheckPassed: boolean;
  readonly diffCheckOutput: string;
  readonly capturedAt: string;
}

export interface ChangedFileDigest {
  readonly path: string;
  readonly kind: 'FILE' | 'SYMLINK' | 'DELETED';
  readonly sha256: string | null;
  readonly bytes: number;
}

export interface GitEvidenceOptions {
  readonly gitExecutable: string;
  readonly authorizedWorktreeRoot: string;
  readonly commandTimeoutMs: number;
  readonly maximumDiffBytes: number;
}

const GIT_ENVIRONMENT = Object.freeze({
  LANG: 'C',
  LC_ALL: 'C',
  GIT_TERMINAL_PROMPT: '0',
  GIT_CONFIG_NOSYSTEM: '1',
});

const allowedEvidenceArgv = new Set([
  JSON.stringify(['rev-parse', '--verify', 'HEAD']),
  JSON.stringify(['status', '--porcelain=v1', '-z', '--untracked-files=all']),
  JSON.stringify(['diff', '--binary', '--no-ext-diff', 'HEAD']),
  JSON.stringify(['diff', '--check', 'HEAD']),
]);

function requireSuccess(result: CommandResult, operation: string): CommandResult {
  if (result.timedOut) throw new Error(`${operation} timed out`);
  if (result.exitCode !== 0) throw new Error(`${operation} failed: ${result.stderr.slice(0, 2_000)}`);
  return result;
}

function changedFilesFromPorcelain(status: string): readonly string[] {
  const tokens = status.split('\0').filter(Boolean);
  const files = new Set<string>();
  for (let index = 0; index < tokens.length; index += 1) {
    const entry = tokens[index];
    if (entry === undefined || entry.length < 4) throw new Error('invalid Git porcelain entry');
    const code = entry.slice(0, 2);
    files.add(normalizeRelativeWorkspacePath(entry.slice(3)));
    if (code.includes('R') || code.includes('C')) {
      const source = tokens[index + 1];
      if (source === undefined) throw new Error('invalid Git rename porcelain entry');
      files.add(normalizeRelativeWorkspacePath(source));
      index += 1;
    }
  }
  return [...files].sort();
}

function isWithinWritablePath(candidate: string, writablePath: string): boolean {
  return candidate === writablePath || candidate.startsWith(`${writablePath}/`);
}

export class GitEvidenceCollector {
  readonly #options: GitEvidenceOptions;

  constructor(options: GitEvidenceOptions) {
    this.#options = options;
  }

  async collect(
    worktreePath: string,
    baseCommitSha: string,
    writablePaths: readonly string[],
  ): Promise<GitEvidence> {
    const baseSha = assertFullCommitSha(baseCommitSha);
    if (!isPathInside(this.#options.authorizedWorktreeRoot, worktreePath)) {
      throw new Error('worktree is outside the authorized root');
    }
    if (!path.isAbsolute(worktreePath) || path.resolve(worktreePath) !== worktreePath) {
      throw new Error('worktree must be a normalized absolute path');
    }
    const metadata = await lstat(worktreePath);
    if (!metadata.isDirectory() || metadata.isSymbolicLink() || (await realpath(worktreePath)) !== worktreePath) {
      throw new Error('worktree must be a real directory');
    }

    const runner = new CommandRunner({
      defaultTimeoutMs: this.#options.commandTimeoutMs,
      defaultMaxStdoutBytes: this.#options.maximumDiffBytes,
      defaultMaxStderrBytes: 256 * 1_024,
      allowlist: [
        {
          id: 'git-evidence',
          executable: this.#options.gitExecutable,
          cwdRoots: [worktreePath],
          allowedEnvironmentKeys: Object.keys(GIT_ENVIRONMENT),
          validateArgv: (argv) => allowedEvidenceArgv.has(JSON.stringify(argv)),
        },
      ],
    });
    const run = async (argv: readonly string[], maxStdoutBytes?: number): Promise<CommandResult> =>
      await runner.run({
        policyId: 'git-evidence',
        executable: this.#options.gitExecutable,
        argv,
        cwd: worktreePath,
        environment: GIT_ENVIRONMENT,
        ...(maxStdoutBytes === undefined ? {} : { maxStdoutBytes }),
      });

    const head = requireSuccess(
      await run(['rev-parse', '--verify', 'HEAD'], 128),
      'Git HEAD capture',
    ).stdout.trim();
    assertFullCommitSha(head);
    if (head !== baseSha) {
      throw new Error('worktree HEAD moved away from its detached authorized base');
    }

    const statusResult = requireSuccess(
      await run(['status', '--porcelain=v1', '-z', '--untracked-files=all']),
      'Git status capture',
    );
    const changedFiles = changedFilesFromPorcelain(statusResult.stdout);
    const escapedPath = changedFiles.find(
      (candidate) => !writablePaths.some((allowed) => isWithinWritablePath(candidate, allowed)),
    );
    if (escapedPath !== undefined) {
      throw new Error(`changed file is outside the authorized write scope: ${escapedPath}`);
    }
    const diffResult = requireSuccess(
      await run(['diff', '--binary', '--no-ext-diff', 'HEAD']),
      'Git diff capture',
    );
    if (diffResult.stdoutTruncated) {
      throw new Error('Git diff exceeds the evidence size limit');
    }
    const diffCheck = await run(['diff', '--check', 'HEAD']);
    const changedFileDigests: ChangedFileDigest[] = [];
    let changedFileBytes = 0;
    for (const changedFile of changedFiles) {
      const candidate = path.resolve(worktreePath, changedFile);
      if (!isPathInside(worktreePath, candidate)) {
        throw new Error(`changed file escapes worktree: ${changedFile}`);
      }
      try {
        const fileMetadata = await lstat(candidate);
        if (fileMetadata.isSymbolicLink()) {
          const target = Buffer.from(await readlink(candidate));
          changedFileBytes += target.length;
          changedFileDigests.push({
            path: changedFile,
            kind: 'SYMLINK',
            sha256: createHash('sha256').update(target).digest('hex'),
            bytes: target.length,
          });
        } else if (fileMetadata.isFile()) {
          changedFileBytes += fileMetadata.size;
          if (changedFileBytes > this.#options.maximumDiffBytes) {
            throw new Error('changed files exceed the evidence size limit');
          }
          const content = await readFile(candidate);
          changedFileDigests.push({
            path: changedFile,
            kind: 'FILE',
            sha256: createHash('sha256').update(content).digest('hex'),
            bytes: content.length,
          });
        } else {
          throw new Error(`changed path has an unsupported file type: ${changedFile}`);
        }
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          changedFileDigests.push({ path: changedFile, kind: 'DELETED', sha256: null, bytes: 0 });
          continue;
        }
        throw error;
      }
    }
    const workspaceDigest = createHash('sha256')
      .update(JSON.stringify(changedFileDigests))
      .update('\0')
      .update(diffResult.stdout)
      .digest('hex');

    return {
      baseCommitSha: baseSha,
      headCommitSha: head,
      changedFiles,
      changedFileDigests,
      workspaceDigest,
      porcelainStatus: statusResult.stdout,
      binaryDiff: diffResult.stdout,
      diffCheckPassed: !diffCheck.timedOut && diffCheck.exitCode === 0,
      diffCheckOutput: `${diffCheck.stdout}${diffCheck.stderr}`.slice(0, 256 * 1_024),
      capturedAt: new Date().toISOString(),
    };
  }
}
