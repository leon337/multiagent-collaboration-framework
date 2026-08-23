import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadWorkerConfig } from './config.js';
import {
  assertBaseCommitAllowed,
  createRepositoryPolicy,
  normalizeRelativeWorkspacePath,
  RepositoryPolicyRegistry,
  resolveInside,
} from './policy.js';

const SHA = 'a'.repeat(40);

describe('worker configuration', () => {
  it('loads fixed, isolated private roots', () => {
    const config = loadWorkerConfig({});
    expect(config.codexHome).toBe('/var/lib/mcf-codex/codex-home');
    expect(config.worktreeRoot).toBe('/var/lib/mcf-codex/worktrees');
    expect(config.artifactRoot).toBe('/var/lib/mcf-codex/artifacts');
    expect(config.codexTimeoutMs).toBeGreaterThan(0);
  });

  it('rejects relative executable and overlapping roots', () => {
    expect(() => loadWorkerConfig({ MCF_CODEX_EXECUTABLE: 'codex' })).toThrow(
      /normalized absolute path/,
    );
    expect(() =>
      loadWorkerConfig({
        MCF_CODEX_HOME: '/srv/mcf/private',
        MCF_WORKTREE_ROOT: '/srv/mcf/private/worktrees',
      }),
    ).toThrow(/must not overlap/);
  });
});

describe('repository policy', () => {
  const policy = createRepositoryPolicy({
    repositoryKey: 'mcf',
    repositoryPath: '/srv/git/mcf',
    worktreeRoot: '/srv/mcf/worktrees/mcf',
    allowedBaseCommitShas: [SHA],
    writablePaths: ['./apps/worker/src', 'docs/runtime'],
    validationCommands: [
      {
        id: 'worker-test',
        executable: '/usr/bin/corepack',
        argv: ['pnpm', '--filter', '@rsa/worker', 'test'],
        timeoutMs: 60_000,
      },
    ],
  });

  it('uses repository keys rather than caller-supplied paths and pins full SHAs', () => {
    const registry = new RepositoryPolicyRegistry([policy]);
    expect(registry.get('mcf')).toBe(policy);
    expect(() => registry.get('../../etc')).toThrow(/safe identifier/);
    expect(() => registry.get('unknown')).toThrow(/not allowlisted/);
    expect(assertBaseCommitAllowed(policy, SHA)).toBe(SHA);
    expect(() => assertBaseCommitAllowed(policy, 'main')).toThrow(/full 40-character/);
    expect(() => assertBaseCommitAllowed(policy, 'b'.repeat(40))).toThrow(/not allowlisted/);
  });

  it('normalizes owned paths and rejects traversal and Git metadata', () => {
    expect(policy.writablePaths).toEqual(['apps/worker/src', 'docs/runtime']);
    expect(normalizeRelativeWorkspacePath('src/module.ts')).toBe('src/module.ts');
    expect(() => normalizeRelativeWorkspacePath('../secret')).toThrow(/outside/);
    expect(() => normalizeRelativeWorkspacePath('.git/config')).toThrow(/outside/);
    expect(() => resolveInside('/srv/root', '..', 'escape')).toThrow(/escapes/);
    expect(resolveInside('/srv/root', 'safe')).toBe(path.join('/srv/root', 'safe'));
  });
});

