import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { GitRepositoryLiveVerifier } from './git-repository-live-verifier.js';

const temporaryDirectories: string[] = [];

function createGitRepository(): { root: string; revision: string } {
  const root = mkdtempSync(join(tmpdir(), 'mcf-live-git-'));
  temporaryDirectories.push(root);
  execFileSync('git', ['init', '--quiet', root]);
  writeFileSync(join(root, 'README.md'), '# laboratory fixture\n', 'utf8');
  execFileSync('git', ['-C', root, 'add', 'README.md']);
  execFileSync('git', [
    '-C',
    root,
    '-c',
    'user.name=MCF Test',
    '-c',
    'user.email=mcf-test@example.invalid',
    'commit',
    '--quiet',
    '-m',
    'test fixture',
  ]);
  return {
    root,
    revision: execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim(),
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('GitRepositoryLiveVerifier', () => {
  it('verifies the exact clean repository revision without network access', async () => {
    const repository = createGitRepository();
    const verifier = new GitRepositoryLiveVerifier({
      now: () => '2026-08-23T07:00:00Z',
    });

    await expect(
      verifier.verify({
        project_id: 'fixture',
        canonical_repository: 'leon337/fixture',
        repository_root: repository.root,
        expected_revision: repository.revision,
      }),
    ).resolves.toEqual({
      outcome: 'VERIFIED',
      source: {
        role: 'LIVE_VERIFICATION',
        source_ref: 'repo://leon337/fixture/.git/HEAD',
        source_revision: repository.revision,
        observed_at: '2026-08-23T07:00:00Z',
      },
      warnings: [],
    });
  });

  it('reports drift for a dirty worktree without changing it', async () => {
    const repository = createGitRepository();
    writeFileSync(join(repository.root, 'untracked.txt'), 'drift\n', 'utf8');
    const verifier = new GitRepositoryLiveVerifier({
      now: () => '2026-08-23T07:00:00Z',
    });

    const result = await verifier.verify({
      project_id: 'fixture',
      canonical_repository: 'leon337/fixture',
      repository_root: repository.root,
      expected_revision: repository.revision,
    });

    expect(result).toMatchObject({
      outcome: 'DRIFT_DETECTED',
      warnings: ['GIT_WORKTREE_DIRTY'],
    });
    expect(
      execFileSync('git', ['-C', repository.root, 'status', '--porcelain'], { encoding: 'utf8' }),
    ).toContain('?? untracked.txt');
  });

  it('fails closed before invoking Git when configuration is not exact', async () => {
    let calls = 0;
    const verifier = new GitRepositoryLiveVerifier({
      runGit: async () => {
        calls += 1;
        return '';
      },
    });

    await expect(
      verifier.verify({
        project_id: 'fixture',
        canonical_repository: 'leon337/fixture',
        repository_root: null,
        expected_revision: 'not-a-commit',
      }),
    ).resolves.toEqual({
      outcome: 'SOURCE_UNAVAILABLE',
      warnings: ['GIT_LIVE_VERIFICATION_CONFIGURATION_INVALID'],
    });
    expect(calls).toBe(0);
  });
});
