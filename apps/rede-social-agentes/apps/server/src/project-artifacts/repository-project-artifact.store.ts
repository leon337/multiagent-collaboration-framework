import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, open, readFile, rename, unlink, type FileHandle } from 'node:fs/promises';
import { basename, dirname, join, resolve, sep } from 'node:path';

import type {
  IntentAlignmentReceiptV1,
  McfArtifactRef,
  ProjectIntentPackageV1,
  ProjectRealityReportV1,
} from '@rsa/contracts';
import { Ajv2020, type AnySchema, type ValidateFunction } from 'ajv/dist/2020.js';

export const PROJECT_ARTIFACT_DIGEST_CONVENTION =
  'sha256 of UTF-8 canonical JSON with recursively sorted object keys, array order preserved, and only the root contentDigest property omitted';

export type ProjectArtifact =
  ProjectIntentPackageV1 | ProjectRealityReportV1 | IntentAlignmentReceiptV1;

export type ProjectArtifactType = ProjectArtifact['artifactType'];

type ArtifactOf<TType extends ProjectArtifactType> = Extract<
  ProjectArtifact,
  { artifactType: TType }
>;

export type CanonicalArtifactRef<TType extends ProjectArtifactType> = McfArtifactRef & {
  artifactType: TType;
  schemaVersion: '1.0';
};

export interface LocalProjectArtifact<TType extends ProjectArtifactType> {
  checkpointState: 'LOCAL_UNCHECKPOINTED';
  reference: CanonicalArtifactRef<TType> & { commitSha: null };
  artifact: ArtifactOf<TType>;
}

export interface RemoteVerifiedProjectArtifact<TType extends ProjectArtifactType> {
  checkpointState: 'REMOTE_VERIFIED';
  reference: CanonicalArtifactRef<TType> & { commitSha: string };
  artifact: ArtifactOf<TType>;
}

export interface ExactCommitReadRequest {
  repository: string;
  commitSha: string;
  path: string;
}

export interface ExactCommitReadResult extends ExactCommitReadRequest {
  content: string;
}

export interface ExactCommitArtifactReader {
  readAtExactCommit(request: ExactCommitReadRequest): Promise<ExactCommitReadResult>;
}

export type ProjectArtifactErrorCode =
  | 'INVALID_ARTIFACT_ID'
  | 'SCHEMA_INVALID'
  | 'DIGEST_MISMATCH'
  | 'REFERENCE_MISMATCH'
  | 'LOCAL_REFERENCE_REQUIRED'
  | 'REMOTE_REFERENCE_REQUIRED'
  | 'REMOTE_RESOLUTION_MISMATCH'
  | 'ALIGNED_PIP_IMMUTABLE'
  | 'PRR_REVISION_IMMUTABLE'
  | 'ALIGNMENT_RECEIPT_IMMUTABLE'
  | 'ALIGNMENT_BINDING_INVALID'
  | 'WRITE_CONFLICT';

export class ProjectArtifactError extends Error {
  constructor(
    readonly code: ProjectArtifactErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ProjectArtifactError';
  }
}

export interface RepositoryProjectArtifactStoreOptions {
  repositoryRoot: string;
  schemaDirectory: string;
  repository: string;
  atomicRename?: ((source: string, destination: string) => Promise<void>) | undefined;
}

const ARTIFACT_SCHEMAS: Record<ProjectArtifactType, string> = {
  PROJECT_INTENT_PACKAGE: 'project-intent-package-v1.schema.json',
  PROJECT_REALITY_REPORT: 'project-reality-report-v1.schema.json',
  INTENT_ALIGNMENT_RECEIPT: 'intent-alignment-receipt-v1.schema.json',
};

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;

function fail(code: ProjectArtifactErrorCode, message: string): never {
  throw new ProjectArtifactError(code, message);
}

function isNodeError(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && error.code === code;
}

function assertSafeId(id: string, label: string): void {
  if (!SAFE_ID.test(id)) {
    fail('INVALID_ARTIFACT_ID', `${label} is not safe for a canonical artifact path`);
  }
}

export function canonicalPipPath(revisionId: string): string {
  assertSafeId(revisionId, 'PIP revisionId');
  return `.mcf/intent/pip-${revisionId}.json`;
}

export function canonicalPrrPath(revisionId: string): string {
  assertSafeId(revisionId, 'PRR revisionId');
  return `.mcf/reality/prr-${revisionId}.json`;
}

export function canonicalAlignmentReceiptPath(receiptId: string): string {
  assertSafeId(receiptId, 'alignment receiptId');
  return `.mcf/receipts/intent-alignment-${receiptId}.json`;
}

function canonicalPathForArtifact(artifact: ProjectArtifact): string {
  switch (artifact.artifactType) {
    case 'PROJECT_INTENT_PACKAGE':
      return canonicalPipPath(artifact.revisionId);
    case 'PROJECT_REALITY_REPORT':
      return canonicalPrrPath(artifact.revisionId);
    case 'INTENT_ALIGNMENT_RECEIPT':
      return canonicalAlignmentReceiptPath(artifact.receiptId);
  }
}

function canonicalPathForReference(reference: CanonicalArtifactRef<ProjectArtifactType>): string {
  switch (reference.artifactType) {
    case 'PROJECT_INTENT_PACKAGE':
      return canonicalPipPath(reference.revisionId);
    case 'PROJECT_REALITY_REPORT':
      return canonicalPrrPath(reference.revisionId);
    case 'INTENT_ALIGNMENT_RECEIPT':
      return canonicalAlignmentReceiptPath(reference.revisionId);
  }
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, nested]) => [key, sortJson(nested)]),
    );
  }
  return value;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

export function calculateProjectArtifactDigest(artifact: ProjectArtifact): string {
  const payload = { ...artifact } as Record<string, unknown>;
  delete payload.contentDigest;
  return `sha256:${createHash('sha256').update(canonicalJson(payload), 'utf8').digest('hex')}`;
}

function withCalculatedDigest<TArtifact extends ProjectArtifact>(artifact: TArtifact): TArtifact {
  const copy = structuredClone(artifact);
  copy.contentDigest = calculateProjectArtifactDigest(copy);
  return copy;
}

function serializeArtifact(artifact: ProjectArtifact): string {
  return `${JSON.stringify(sortJson(artifact), null, 2)}\n`;
}

function readSchema(schemaDirectory: string, filename: string): AnySchema {
  return JSON.parse(requireSchemaFile(join(schemaDirectory, filename))) as AnySchema;
}

function requireSchemaFile(path: string): string {
  // Schema loading is deliberately synchronous at construction so a misconfigured store fails early.
  return readFileSync(path, 'utf8');
}

export class RepositoryProjectArtifactStore {
  private readonly repositoryRoot: string;
  private readonly repository: string;
  private readonly validators: Record<ProjectArtifactType, ValidateFunction>;
  private readonly referenceValidator: ValidateFunction;
  private readonly atomicRename: (source: string, destination: string) => Promise<void>;

  constructor(options: RepositoryProjectArtifactStoreOptions) {
    this.repositoryRoot = resolve(options.repositoryRoot);
    this.repository = options.repository;
    this.atomicRename = options.atomicRename ?? rename;

    const ajv = new Ajv2020({ allErrors: true, strict: true });
    ajv.addFormat('date-time', {
      type: 'string',
      validate: (value: string) => !Number.isNaN(Date.parse(value)),
    });
    const referenceSchema = readSchema(options.schemaDirectory, 'mcf-artifact-ref.schema.json');
    this.referenceValidator = ajv.compile(referenceSchema);
    this.validators = {
      PROJECT_INTENT_PACKAGE: ajv.compile(
        readSchema(options.schemaDirectory, ARTIFACT_SCHEMAS.PROJECT_INTENT_PACKAGE),
      ),
      PROJECT_REALITY_REPORT: ajv.compile(
        readSchema(options.schemaDirectory, ARTIFACT_SCHEMAS.PROJECT_REALITY_REPORT),
      ),
      INTENT_ALIGNMENT_RECEIPT: ajv.compile(
        readSchema(options.schemaDirectory, ARTIFACT_SCHEMAS.INTENT_ALIGNMENT_RECEIPT),
      ),
    };
  }

  async writePip(
    artifact: ProjectIntentPackageV1,
  ): Promise<LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>> {
    return this.writeArtifact(artifact);
  }

  async writePrr(
    artifact: ProjectRealityReportV1,
  ): Promise<LocalProjectArtifact<'PROJECT_REALITY_REPORT'>> {
    return this.writeArtifact(artifact);
  }

  async writeAlignmentReceipt(
    artifact: IntentAlignmentReceiptV1,
    pip:
      | LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>
      | RemoteVerifiedProjectArtifact<'PROJECT_INTENT_PACKAGE'>,
  ): Promise<LocalProjectArtifact<'INTENT_ALIGNMENT_RECEIPT'>> {
    const normalized = withCalculatedDigest(artifact);
    this.validateArtifact(normalized);
    this.assertAlignmentBinding(normalized, pip);
    return this.writeArtifact(normalized);
  }

  async loadLocal<TType extends ProjectArtifactType>(
    reference: CanonicalArtifactRef<TType>,
  ): Promise<LocalProjectArtifact<TType>> {
    this.validateReference(reference);
    if (reference.commitSha !== null) {
      fail(
        'LOCAL_REFERENCE_REQUIRED',
        'a reference with commitSha cannot be loaded or reported as LOCAL_UNCHECKPOINTED',
      );
    }
    const content = await readFile(this.absolutePath(reference.path), 'utf8');
    const artifact = this.parseAndVerify<TType>(content, reference);
    return {
      checkpointState: 'LOCAL_UNCHECKPOINTED',
      reference: reference as CanonicalArtifactRef<TType> & { commitSha: null },
      artifact,
    };
  }

  async resolveLocalPipRevision(
    projectId: string,
    revisionId: string,
  ): Promise<LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>> {
    return this.resolveLocalArtifact('PROJECT_INTENT_PACKAGE', projectId, revisionId);
  }

  async resolveLocalAlignmentReceipt(
    projectId: string,
    receiptId: string,
  ): Promise<LocalProjectArtifact<'INTENT_ALIGNMENT_RECEIPT'>> {
    return this.resolveLocalArtifact('INTENT_ALIGNMENT_RECEIPT', projectId, receiptId);
  }

  async loadRemoteVerified<TType extends ProjectArtifactType>(
    reference: CanonicalArtifactRef<TType>,
    reader: ExactCommitArtifactReader,
  ): Promise<RemoteVerifiedProjectArtifact<TType>> {
    this.validateReference(reference);
    if (reference.commitSha === null) {
      fail('REMOTE_REFERENCE_REQUIRED', 'REMOTE_VERIFIED requires a non-null exact commitSha');
    }
    const request: ExactCommitReadRequest = {
      repository: reference.repository,
      commitSha: reference.commitSha,
      path: reference.path,
    };
    const resolved = await reader.readAtExactCommit(request);
    if (
      resolved.repository !== request.repository ||
      resolved.commitSha !== request.commitSha ||
      resolved.path !== request.path
    ) {
      fail(
        'REMOTE_RESOLUTION_MISMATCH',
        'external reader did not resolve the exact repository, commit and artifact path requested',
      );
    }
    const artifact = this.parseAndVerify<TType>(resolved.content, reference);
    return {
      checkpointState: 'REMOTE_VERIFIED',
      reference: reference as CanonicalArtifactRef<TType> & { commitSha: string },
      artifact,
    };
  }

  private async writeArtifact<TArtifact extends ProjectArtifact>(
    input: TArtifact,
  ): Promise<LocalProjectArtifact<TArtifact['artifactType']>> {
    const artifact = withCalculatedDigest(input);
    this.validateArtifact(artifact);
    const path = canonicalPathForArtifact(artifact);
    const absolutePath = this.absolutePath(path);
    await mkdir(dirname(absolutePath), { recursive: true });
    const lockPath = `${absolutePath}.lock`;
    let lock: FileHandle;
    try {
      lock = await open(lockPath, 'wx');
    } catch (error) {
      if (isNodeError(error, 'EEXIST')) {
        return fail('WRITE_CONFLICT', `artifact path is locked: ${path}`);
      }
      throw error;
    }

    try {
      const existing = await this.readExisting(absolutePath, artifact.artifactType);
      if (existing !== null) {
        this.assertWriteAllowed(existing, artifact);
        if (existing.contentDigest === artifact.contentDigest) {
          return this.localResult(artifact, path);
        }
      }
      await this.writeAtomically(absolutePath, serializeArtifact(artifact));
      return this.localResult(artifact, path);
    } finally {
      await lock.close();
      await unlink(lockPath).catch((error: unknown) => {
        if (!isNodeError(error, 'ENOENT')) throw error;
      });
    }
  }

  private async resolveLocalArtifact<TType extends ProjectArtifactType>(
    artifactType: TType,
    projectId: string,
    revisionId: string,
  ): Promise<LocalProjectArtifact<TType>> {
    const path = canonicalPathForReference({
      artifactType,
      schemaVersion: '1.0',
      projectId,
      revisionId,
      path: '',
      contentDigest: `sha256:${'0'.repeat(64)}`,
      repository: this.repository,
      commitSha: null,
    });
    const content = await readFile(this.absolutePath(path), 'utf8');
    let artifact: ProjectArtifact;
    try {
      artifact = JSON.parse(content) as ProjectArtifact;
    } catch {
      return fail('SCHEMA_INVALID', 'artifact is not valid JSON');
    }
    this.validateArtifact(artifact);
    this.verifyDigest(artifact);
    const artifactRevision =
      artifact.artifactType === 'INTENT_ALIGNMENT_RECEIPT'
        ? artifact.receiptId
        : artifact.revisionId;
    if (
      artifact.artifactType !== artifactType ||
      artifact.projectId !== projectId ||
      artifactRevision !== revisionId
    ) {
      return fail('REFERENCE_MISMATCH', 'artifact identity does not match its canonical path');
    }
    return this.localResult(artifact, path) as unknown as LocalProjectArtifact<TType>;
  }

  private async readExisting(
    absolutePath: string,
    expectedType: ProjectArtifactType,
  ): Promise<ProjectArtifact | null> {
    let content: string;
    try {
      content = await readFile(absolutePath, 'utf8');
    } catch (error) {
      if (isNodeError(error, 'ENOENT')) return null;
      throw error;
    }
    let artifact: ProjectArtifact;
    try {
      artifact = JSON.parse(content) as ProjectArtifact;
    } catch {
      return fail('SCHEMA_INVALID', 'existing artifact is not valid JSON');
    }
    if (artifact.artifactType !== expectedType) {
      return fail('REFERENCE_MISMATCH', 'existing canonical path contains another artifact type');
    }
    this.validateArtifact(artifact);
    this.verifyDigest(artifact);
    return artifact;
  }

  private assertWriteAllowed(existing: ProjectArtifact, candidate: ProjectArtifact): void {
    if (existing.contentDigest === candidate.contentDigest) return;
    switch (existing.artifactType) {
      case 'PROJECT_INTENT_PACKAGE':
        if (existing.lifecycle === 'ALIGNED') {
          fail('ALIGNED_PIP_IMMUTABLE', 'an aligned PIP revision cannot be replaced');
        }
        return;
      case 'PROJECT_REALITY_REPORT':
        return fail('PRR_REVISION_IMMUTABLE', 'a persisted PRR revision cannot be replaced');
      case 'INTENT_ALIGNMENT_RECEIPT':
        return fail(
          'ALIGNMENT_RECEIPT_IMMUTABLE',
          'an alignment receipt identity cannot be replaced',
        );
    }
  }

  private assertAlignmentBinding(
    receipt: IntentAlignmentReceiptV1,
    pip:
      | LocalProjectArtifact<'PROJECT_INTENT_PACKAGE'>
      | RemoteVerifiedProjectArtifact<'PROJECT_INTENT_PACKAGE'>,
  ): void {
    const ref = pip.reference;
    if (
      receipt.projectId !== pip.artifact.projectId ||
      receipt.projectId !== ref.projectId ||
      receipt.pipRef.artifactType !== ref.artifactType ||
      receipt.pipRef.schemaVersion !== ref.schemaVersion ||
      receipt.pipRef.revisionId !== ref.revisionId ||
      receipt.pipRef.path !== ref.path ||
      receipt.pipRef.contentDigest !== ref.contentDigest ||
      receipt.pipRef.repository !== ref.repository ||
      receipt.pipRef.commitSha !== ref.commitSha
    ) {
      fail('ALIGNMENT_BINDING_INVALID', 'alignment receipt is not bound to the exact resolved PIP');
    }
    if (
      receipt.decision === 'PASS' &&
      (pip.artifact.lifecycle !== 'ALIGNED' || pip.artifact.alignment.status !== 'ALIGNED')
    ) {
      fail('ALIGNMENT_BINDING_INVALID', 'a PASS receipt requires an exact aligned PIP');
    }
  }

  private localResult<TArtifact extends ProjectArtifact>(
    artifact: TArtifact,
    path: string,
  ): LocalProjectArtifact<TArtifact['artifactType']> {
    const revisionId =
      artifact.artifactType === 'INTENT_ALIGNMENT_RECEIPT'
        ? artifact.receiptId
        : artifact.revisionId;
    return {
      checkpointState: 'LOCAL_UNCHECKPOINTED',
      artifact: artifact as unknown as ArtifactOf<TArtifact['artifactType']>,
      reference: {
        artifactType: artifact.artifactType,
        schemaVersion: artifact.schemaVersion,
        projectId: artifact.projectId,
        revisionId,
        path,
        contentDigest: artifact.contentDigest,
        repository: this.repository,
        commitSha: null,
      },
    };
  }

  private parseAndVerify<TType extends ProjectArtifactType>(
    content: string,
    reference: CanonicalArtifactRef<TType>,
  ): ArtifactOf<TType> {
    let artifact: ProjectArtifact;
    try {
      artifact = JSON.parse(content) as ProjectArtifact;
    } catch {
      return fail('SCHEMA_INVALID', 'artifact is not valid JSON');
    }
    this.validateArtifact(artifact);
    this.verifyDigest(artifact);
    const artifactRevision =
      artifact.artifactType === 'INTENT_ALIGNMENT_RECEIPT'
        ? artifact.receiptId
        : artifact.revisionId;
    if (
      artifact.artifactType !== reference.artifactType ||
      artifact.schemaVersion !== reference.schemaVersion ||
      artifact.projectId !== reference.projectId ||
      artifactRevision !== reference.revisionId ||
      artifact.contentDigest !== reference.contentDigest
    ) {
      return fail('REFERENCE_MISMATCH', 'artifact identity or digest does not match its reference');
    }
    return artifact as ArtifactOf<TType>;
  }

  private validateArtifact(artifact: ProjectArtifact): void {
    const validator = this.validators[artifact.artifactType];
    if (validator === undefined || !validator(artifact)) {
      fail(
        'SCHEMA_INVALID',
        `artifact failed JSON schema validation: ${JSON.stringify(validator?.errors)}`,
      );
    }
  }

  private validateReference(reference: CanonicalArtifactRef<ProjectArtifactType>): void {
    if (!this.referenceValidator(reference)) {
      fail(
        'SCHEMA_INVALID',
        `artifact reference failed JSON schema validation: ${JSON.stringify(this.referenceValidator.errors)}`,
      );
    }
    if (
      reference.repository !== this.repository ||
      reference.path !== canonicalPathForReference(reference)
    ) {
      fail(
        'REFERENCE_MISMATCH',
        'artifact reference does not identify this canonical repository path',
      );
    }
  }

  private verifyDigest(artifact: ProjectArtifact): void {
    const calculated = calculateProjectArtifactDigest(artifact);
    if (artifact.contentDigest !== calculated) {
      fail('DIGEST_MISMATCH', `artifact digest mismatch: expected ${calculated}`);
    }
  }

  private absolutePath(path: string): string {
    const absolute = resolve(this.repositoryRoot, path);
    if (!absolute.startsWith(`${this.repositoryRoot}${sep}`)) {
      return fail('REFERENCE_MISMATCH', 'artifact path escapes the repository root');
    }
    return absolute;
  }

  private async writeAtomically(destination: string, content: string): Promise<void> {
    const directory = dirname(destination);
    const temporary = join(directory, `.${basename(destination)}.${randomUUID()}.tmp`);
    let handle: FileHandle | undefined;
    try {
      handle = await open(temporary, 'wx', 0o600);
      await handle.writeFile(content, 'utf8');
      await handle.sync();
      await handle.close();
      handle = undefined;
      await this.atomicRename(temporary, destination);
      const directoryHandle = await open(directory, 'r');
      try {
        await directoryHandle.sync();
      } finally {
        await directoryHandle.close();
      }
    } finally {
      await handle?.close();
      await unlink(temporary).catch((error: unknown) => {
        if (!isNodeError(error, 'ENOENT')) throw error;
      });
    }
  }
}
