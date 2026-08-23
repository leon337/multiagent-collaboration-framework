import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { afterEach, describe, expect, it } from 'vitest';

import { createRepositoryPolicy } from './policy.js';
import { WorktreeManager } from './worktree-manager.js';

const executeFile = promisify(execFile);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => rm(directory, { recursive: true })),
  );
});

async function fixture(): Promise<{
  manager: WorktreeManager;
  policy: ReturnType<typeof createRepositoryPolicy>;
  sha: string;
}> {
  const root = await mkdtemp(`${os.tmpdir()}/mcf-worktree-`);
  temporaryDirectories.push(root);
  const repositoryPath = path.join(root, 'repository');
  const authorizedWorktreeRoot = path.join(root, 'worktrees');
  const worktreeRoot = path.join(authorizedWorktreeRoot, 'mcf');
  await mkdir(repositoryPath, { mode: 0o700 });
  await mkdir(worktreeRoot, { recursive: true, mode: 0o700 });
  await executeFile('/usr/bin/git', ['init', '--quiet'], { cwd: repositoryPath });
  await writeFile(path.join(repositoryPath, 'README.md'), 'base\n');
  await executeFile('/usr/bin/git', ['add', 'README.md'], { cwd: repositoryPath });
  await executeFile(
    '/usr/bin/git',
    ['-c', 'user.name=MCF Test', '-c', 'user.email=mcf@example.invalid', 'commit', '--quiet', '-m', 'base'],
    { cwd: repositoryPath },
  );
  const { stdout } = await executeFile('/usr/bin/git', ['rev-parse', 'HEAD'], {
    cwd: repositoryPath,
  });
  const sha = stdout.trim();
  return {
    manager: new WorktreeManager({
      gitExecutable: '/usr/bin/git',
      authorizedWorktreeRoot,
      commandTimeoutMs: 5_000,
    }),
    policy: createRepositoryPolicy({
      repositoryKey: 'mcf',
      repositoryPath,
      worktreeRoot,
      allowedBaseCommitShas: [sha],
      writablePaths: ['apps/worker'],
      validationCommands: [],
    }),
    sha,
  };
}

describe('WorktreeManager persistent mission worktrees', () => {
  it('recovers the same pinned worktree and preserves unfinished mission changes', async () => {
    const { manager, policy, sha } = await fixture();
    const created = await manager.prepare(policy, 'mission-001', sha);
    await writeFile(path.join(created.path, 'unfinished.txt'), 'durable state\n');

    const recovered = await manager.prepare(policy, 'mission-001', sha);

    expect(created.recovered).toBe(false);
    expect(recovered).toMatchObject({ path: created.path, baseCommitSha: sha, recovered: true });
    const { stdout } = await executeFile('/usr/bin/git', ['status', '--porcelain'], {
      cwd: recovered.path,
    });
    expect(stdout).toContain('unfinished.txt');
  });

  it('refuses an existing directory that is not the authorized repository worktree', async () => {
    const { manager, policy, sha } = await fixture();
    const collision = path.join(policy.worktreeRoot, `mission-foreign--${sha.slice(0, 12)}`);
    await mkdir(collision, { mode: 0o700 });

    await expect(manager.prepare(policy, 'mission-foreign', sha)).rejects.toThrow();
  });
});
