import { chmod, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { ArtifactStore } from './artifact-store.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(async (directory) => rm(directory, { recursive: true })));
});

describe('ArtifactStore', () => {
  it('writes bounded, private, redacted, immutable artifacts', async () => {
    const root = await mkdtemp(`${os.tmpdir()}/mcf-artifacts-`);
    temporaryDirectories.push(root);
    await chmod(root, 0o700);
    const store = new ArtifactStore({
      root,
      maximumArtifactBytes: 20,
      redactionSecrets: ['known-secret'],
    });
    const attempt = await store.createAttemptDirectory('item-1', 1);
    const artifact = await store.writeText(attempt, 'codex.stderr.log', 'known-secret-0123456789012345');

    expect(artifact.truncated).toBe(true);
    expect(artifact.bytes).toBe(20);
    expect(await readFile(artifact.path, 'utf8')).not.toContain('known-secret');
    await expect(store.writeText(attempt, 'codex.stderr.log', 'replacement')).rejects.toMatchObject({
      code: 'EEXIST',
    });
    await expect(store.writeText(attempt, '../escape', 'x')).rejects.toThrow(/artifact name/);
    expect(path.dirname(artifact.path)).toBe(attempt);
  });
});

