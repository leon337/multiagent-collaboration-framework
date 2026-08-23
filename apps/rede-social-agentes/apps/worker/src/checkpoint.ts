import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { link, lstat, mkdir, open, readFile, realpath, unlink } from 'node:fs/promises';
import path from 'node:path';

import { z } from 'zod';

import { assertSafeIdentifier, isPathInside, resolveInside } from './policy.js';

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u);
const gitShaSchema = z.string().regex(/^[a-f0-9]{40}$/u);
const absolutePathSchema = z
  .string()
  .refine((value) => path.isAbsolute(value) && path.resolve(value) === value && !value.includes('\0'));
const safeIdSchema = z.string().refine((value) => {
  try {
    assertSafeIdentifier(value);
    return true;
  } catch {
    return false;
  }
});

const commonMarkerSchema = z.object({
  schemaVersion: z.literal('1.0'),
  missionId: safeIdSchema,
  stepKey: safeIdSchema,
  stepOrder: z.number().int().nonnegative().max(100_000),
  executionKey: sha256Schema,
  attempt: z.number().int().positive().max(1_000_000),
  baseCommitSha: gitShaSchema,
  worktreePath: absolutePathSchema,
});

const stepStartedMarkerSchema = commonMarkerSchema
  .extend({
    kind: z.literal('STEP_STARTED'),
    stateVersionStarted: z.number().int().nonnegative(),
    startedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

const artifactSchema = z
  .object({
    kind: z.string().regex(/^[a-z][a-z0-9._-]{0,63}$/u),
    path: absolutePathSchema,
    sha256: sha256Schema,
    bytes: z.number().int().nonnegative(),
  })
  .strict();

const validationSchema = z
  .object({
    profile: z.string().regex(/^[a-z][a-z0-9._-]{0,127}$/u),
    status: z.enum(['PASSED', 'FAILED', 'SKIPPED']),
    exitCode: z.number().int().nullable(),
    outputDigest: sha256Schema.nullable(),
  })
  .strict();

const stepResultMarkerSchema = commonMarkerSchema
  .extend({
    kind: z.literal('STEP_RESULT'),
    outcome: z.enum(['COMPLETED', 'BLOCKED', 'FAILED']),
    summary: z.string().min(1).max(8_000),
    changedFiles: z.array(z.string().min(1).max(1_024)).max(1_024),
    patchDigest: sha256Schema,
    artifacts: z.array(artifactSchema).max(256),
    validations: z.array(validationSchema).max(128),
    completedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export type StepStartedMarker = z.infer<typeof stepStartedMarkerSchema>;
export type StepResultMarker = z.infer<typeof stepResultMarkerSchema>;
export type StepArtifactReference = StepResultMarker['artifacts'][number];
export type StepValidationResult = StepResultMarker['validations'][number];

export interface CheckpointReceipt {
  readonly path: string;
  readonly sha256: string;
  readonly bytes: number;
}

export interface StoredStepResult {
  readonly marker: StepResultMarker;
  readonly receipt: CheckpointReceipt;
}

export interface AtomicCheckpointStoreOptions {
  readonly root: string;
  readonly maximumMarkerBytes?: number;
}

export class CheckpointConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckpointConflictError';
  }
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('checkpoint contains a non-finite number');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(',')}}`;
  }
  throw new Error('checkpoint contains an unsupported value');
}

function digest(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function assertPrivateMode(mode: number, label: string): void {
  if ((mode & 0o077) !== 0) throw new Error(`${label} must be owner-only`);
}

export function createStepExecutionKey(input: {
  readonly missionId: string;
  readonly missionSpecDigest: string;
  readonly stepKey: string;
  readonly stepOrder: number;
}): string {
  assertSafeIdentifier(input.missionId, 'mission id');
  assertSafeIdentifier(input.stepKey, 'step key');
  sha256Schema.parse(input.missionSpecDigest);
  if (!Number.isSafeInteger(input.stepOrder) || input.stepOrder < 0) {
    throw new Error('step order must be a non-negative integer');
  }
  return digest(
    canonicalJson({
      missionId: input.missionId,
      missionSpecDigest: input.missionSpecDigest,
      stepKey: input.stepKey,
      stepOrder: input.stepOrder,
    }),
  );
}

export class AtomicCheckpointStore {
  readonly #root: string;
  readonly #maximumMarkerBytes: number;
  #initialized = false;

  constructor(options: AtomicCheckpointStoreOptions) {
    if (!path.isAbsolute(options.root) || path.resolve(options.root) !== options.root) {
      throw new Error('checkpoint root must be a normalized absolute path');
    }
    const maximumMarkerBytes = options.maximumMarkerBytes ?? 4 * 1_024 * 1_024;
    if (!Number.isSafeInteger(maximumMarkerBytes) || maximumMarkerBytes < 1_024) {
      throw new Error('maximum marker bytes must be an integer of at least 1024');
    }
    this.#root = options.root;
    this.#maximumMarkerBytes = maximumMarkerBytes;
  }

  get root(): string {
    return this.#root;
  }

  async initialize(): Promise<void> {
    await mkdir(this.#root, { recursive: true, mode: 0o700 });
    await this.#assertPrivateRealDirectory(this.#root, 'checkpoint root');
    this.#initialized = true;
  }

  async writeStarted(marker: StepStartedMarker): Promise<CheckpointReceipt> {
    const parsed = stepStartedMarkerSchema.parse(marker);
    const directory = await this.#stepDirectory(parsed.missionId, parsed.stepKey);
    return await this.#publish(
      directory,
      `step-started-attempt-${String(parsed.attempt).padStart(6, '0')}.json`,
      parsed,
      stepStartedMarkerSchema,
    );
  }

  async writeResult(marker: StepResultMarker): Promise<CheckpointReceipt> {
    const parsed = stepResultMarkerSchema.parse(marker);
    const started = await this.readStarted(parsed.missionId, parsed.stepKey, parsed.attempt);
    if (
      started === null ||
      started.executionKey !== parsed.executionKey ||
      started.stepOrder !== parsed.stepOrder ||
      started.attempt !== parsed.attempt ||
      started.baseCommitSha !== parsed.baseCommitSha ||
      started.worktreePath !== parsed.worktreePath
    ) {
      throw new CheckpointConflictError('result has no matching start marker');
    }
    const directory = await this.#stepDirectory(parsed.missionId, parsed.stepKey);
    return await this.#publish(directory, 'step-result.json', parsed, stepResultMarkerSchema);
  }

  async readStarted(
    missionId: string,
    stepKey: string,
    attempt: number,
  ): Promise<StepStartedMarker | null> {
    if (!Number.isSafeInteger(attempt) || attempt < 1 || attempt > 1_000_000) {
      throw new Error('step attempt is invalid');
    }
    const directory = await this.#stepDirectory(missionId, stepKey);
    return await this.#readOptional(
      resolveInside(directory, `step-started-attempt-${String(attempt).padStart(6, '0')}.json`),
      stepStartedMarkerSchema,
    );
  }

  async readResult(
    missionId: string,
    stepKey: string,
    expectedExecutionKey?: string,
  ): Promise<StepResultMarker | null> {
    return (await this.readResultRecord(missionId, stepKey, expectedExecutionKey))?.marker ?? null;
  }

  async readResultRecord(
    missionId: string,
    stepKey: string,
    expectedExecutionKey?: string,
  ): Promise<StoredStepResult | null> {
    const directory = await this.#stepDirectory(missionId, stepKey);
    const target = resolveInside(directory, 'step-result.json');
    const marker = await this.#readOptional(target, stepResultMarkerSchema);
    if (
      marker !== null &&
      expectedExecutionKey !== undefined &&
      marker.executionKey !== expectedExecutionKey
    ) {
      throw new CheckpointConflictError('result marker belongs to a different step execution');
    }
    if (marker === null) return null;
    const content = `${canonicalJson(marker)}\n`;
    return {
      marker,
      receipt: { path: target, sha256: digest(content), bytes: Buffer.byteLength(content) },
    };
  }

  async #stepDirectory(missionId: string, stepKey: string): Promise<string> {
    if (!this.#initialized) await this.initialize();
    assertSafeIdentifier(missionId, 'mission id');
    assertSafeIdentifier(stepKey, 'step key');
    const missionDirectory = resolveInside(this.#root, missionId);
    const stepDirectory = resolveInside(missionDirectory, stepKey);
    await this.#mkdirPrivate(missionDirectory, 'mission checkpoint directory');
    await this.#mkdirPrivate(stepDirectory, 'step checkpoint directory');
    return stepDirectory;
  }

  async #mkdirPrivate(directory: string, label: string): Promise<void> {
    await mkdir(directory, { mode: 0o700 }).catch((error: unknown) => {
      if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error;
    });
    await this.#assertPrivateRealDirectory(directory, label);
  }

  async #assertPrivateRealDirectory(directory: string, label: string): Promise<void> {
    const metadata = await lstat(directory);
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      throw new Error(`${label} must be a real directory`);
    }
    assertPrivateMode(metadata.mode, label);
    if ((await realpath(directory)) !== directory || !isPathInside(this.#root, directory)) {
      throw new Error(`${label} escapes the checkpoint root`);
    }
  }

  async #publish<T>(
    directory: string,
    fileName: string,
    value: T,
    schema: z.ZodType<T>,
  ): Promise<CheckpointReceipt> {
    const content = `${canonicalJson(value)}\n`;
    const bytes = Buffer.byteLength(content);
    if (bytes > this.#maximumMarkerBytes) throw new Error('checkpoint marker exceeds size limit');
    const target = resolveInside(directory, fileName);
    const temporary = resolveInside(directory, `.${fileName}.${randomUUID()}.tmp`);
    const handle = await open(
      temporary,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW,
      0o600,
    );
    try {
      await handle.writeFile(content);
      await handle.sync();
    } finally {
      await handle.close();
    }

    try {
      await link(temporary, target);
      await this.#syncDirectory(directory);
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error;
      const existing = await this.#readRequired(target, schema);
      if (canonicalJson(existing) !== canonicalJson(value)) {
        throw new CheckpointConflictError(`checkpoint marker already exists with different content: ${fileName}`);
      }
    } finally {
      await unlink(temporary).catch(() => undefined);
    }

    return { path: target, sha256: digest(content), bytes };
  }

  async #readOptional<T>(target: string, schema: z.ZodType<T>): Promise<T | null> {
    try {
      return await this.#readRequired(target, schema);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null;
      throw error;
    }
  }

  async #readRequired<T>(target: string, schema: z.ZodType<T>): Promise<T> {
    if (!isPathInside(this.#root, target)) throw new Error('checkpoint path escapes root');
    const metadata = await lstat(target);
    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      throw new Error('checkpoint marker must be a real file');
    }
    if (metadata.size > this.#maximumMarkerBytes) throw new Error('checkpoint marker exceeds size limit');
    const content = await readFile(target, 'utf8');
    return schema.parse(JSON.parse(content) as unknown);
  }

  async #syncDirectory(directory: string): Promise<void> {
    const handle = await open(directory, constants.O_RDONLY | constants.O_DIRECTORY);
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  }
}
