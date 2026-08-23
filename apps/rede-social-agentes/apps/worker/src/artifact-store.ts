import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { access, lstat, mkdir, open, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';

import { redactSensitiveText } from './command-runner.js';
import { assertSafeIdentifier, isPathInside, resolveInside } from './policy.js';

export interface StoredArtifact {
  readonly path: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly truncated: boolean;
}

export interface ArtifactStoreOptions {
  readonly root: string;
  readonly maximumArtifactBytes: number;
  readonly redactionSecrets?: readonly string[];
}

function assertPrivateMode(mode: number, label: string): void {
  if ((mode & 0o077) !== 0) {
    throw new Error(`${label} must not be accessible by group or other users`);
  }
}

function safeArtifactName(value: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(value) || value === '.' || value === '..') {
    throw new Error('artifact name is not allowlisted');
  }
  return value;
}

export class ArtifactStore {
  readonly #root: string;
  readonly #maximumArtifactBytes: number;
  readonly #redactionSecrets: readonly string[];
  #initialized = false;

  constructor(options: ArtifactStoreOptions) {
    if (!path.isAbsolute(options.root) || path.resolve(options.root) !== options.root) {
      throw new Error('artifact root must be a normalized absolute path');
    }
    if (!Number.isSafeInteger(options.maximumArtifactBytes) || options.maximumArtifactBytes <= 0) {
      throw new Error('maximum artifact bytes must be a positive integer');
    }
    this.#root = options.root;
    this.#maximumArtifactBytes = options.maximumArtifactBytes;
    this.#redactionSecrets = options.redactionSecrets ?? [];
  }

  get root(): string {
    return this.#root;
  }

  async initialize(): Promise<void> {
    await mkdir(this.#root, { recursive: true, mode: 0o700 });
    const metadata = await lstat(this.#root);
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      throw new Error('artifact root must be a real directory');
    }
    assertPrivateMode(metadata.mode, 'artifact root');
    if ((await realpath(this.#root)) !== this.#root) {
      throw new Error('artifact root must not traverse symbolic links');
    }
    this.#initialized = true;
  }

  async createAttemptDirectory(workItemId: string, attempt: number): Promise<string> {
    if (!this.#initialized) await this.initialize();
    assertSafeIdentifier(workItemId, 'work item id');
    if (!Number.isSafeInteger(attempt) || attempt <= 0 || attempt > 999_999) {
      throw new Error('attempt is outside the supported range');
    }

    const itemDirectory = resolveInside(this.#root, workItemId);
    await this.#mkdirPrivateIfMissing(itemDirectory);
    const attemptDirectory = resolveInside(itemDirectory, `attempt-${String(attempt).padStart(6, '0')}`);
    await this.#mkdirPrivateIfMissing(attemptDirectory);
    const resolved = await realpath(attemptDirectory);
    if (!isPathInside(this.#root, resolved) || resolved !== attemptDirectory) {
      throw new Error('attempt artifact directory escapes the private root');
    }
    return attemptDirectory;
  }

  async writeText(
    attemptDirectory: string,
    name: string,
    content: string,
  ): Promise<StoredArtifact> {
    this.#assertAttemptDirectory(attemptDirectory);
    const target = resolveInside(attemptDirectory, safeArtifactName(name));
    const redacted = redactSensitiveText(content, this.#redactionSecrets);
    const source = Buffer.from(redacted, 'utf8');
    const truncated = source.length > this.#maximumArtifactBytes;
    const bounded = truncated ? source.subarray(0, this.#maximumArtifactBytes) : source;

    const handle = await open(target, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
    try {
      await handle.writeFile(bounded);
      await handle.sync();
    } finally {
      await handle.close();
    }

    return {
      path: target,
      sha256: createHash('sha256').update(bounded).digest('hex'),
      bytes: bounded.length,
      truncated,
    };
  }

  async writeJson(
    attemptDirectory: string,
    name: string,
    value: unknown,
  ): Promise<StoredArtifact> {
    return await this.writeText(attemptDirectory, name, `${JSON.stringify(value, null, 2)}\n`);
  }

  async writeTextIdempotent(
    attemptDirectory: string,
    name: string,
    content: string,
  ): Promise<StoredArtifact> {
    try {
      return await this.writeText(attemptDirectory, name, content);
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error;
    }

    this.#assertAttemptDirectory(attemptDirectory);
    const target = resolveInside(attemptDirectory, safeArtifactName(name));
    const redacted = redactSensitiveText(content, this.#redactionSecrets);
    const source = Buffer.from(redacted, 'utf8');
    const truncated = source.length > this.#maximumArtifactBytes;
    const expected = truncated ? source.subarray(0, this.#maximumArtifactBytes) : source;
    const metadata = await lstat(target);
    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      throw new Error('existing artifact is not a real file');
    }
    const existing = await readFile(target);
    if (!existing.equals(expected)) {
      throw new Error(`immutable artifact already exists with different content: ${name}`);
    }
    return {
      path: target,
      sha256: createHash('sha256').update(existing).digest('hex'),
      bytes: existing.length,
      truncated,
    };
  }

  async #mkdirPrivateIfMissing(directory: string): Promise<void> {
    try {
      await mkdir(directory, { mode: 0o700 });
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error;
    }
    const metadata = await lstat(directory);
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      throw new Error(`artifact path is not a real directory: ${directory}`);
    }
    assertPrivateMode(metadata.mode, 'artifact directory');
  }

  #assertAttemptDirectory(attemptDirectory: string): void {
    if (
      !path.isAbsolute(attemptDirectory) ||
      path.resolve(attemptDirectory) !== attemptDirectory ||
      !isPathInside(this.#root, attemptDirectory) ||
      attemptDirectory === this.#root
    ) {
      throw new Error('attempt directory is outside the artifact root');
    }
  }

  async assertArtifactExists(artifact: StoredArtifact): Promise<void> {
    if (!isPathInside(this.#root, artifact.path)) {
      throw new Error('artifact reference is outside the artifact root');
    }
    await access(artifact.path, constants.R_OK);
  }
}
