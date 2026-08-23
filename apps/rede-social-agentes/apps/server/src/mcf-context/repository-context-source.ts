import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
  realpathSync,
} from 'node:fs';
import { isAbsolute, relative, resolve, sep, win32 } from 'node:path';
import { TextDecoder } from 'node:util';

import type { McfProjectRegistryEntry } from '@rsa/contracts';
import { isAlias, isMap, isNode, isPair, isSeq, parseDocument } from 'yaml';

const DEFAULT_MAX_SOURCE_BYTES = 256 * 1024;
const ABSOLUTE_MAX_SOURCE_BYTES = 4 * 1024 * 1024;
const MAX_YAML_DEPTH = 64;
const MAX_YAML_NODES = 10_000;

export type RepositoryContextErrorCode =
  | 'INVALID_SOURCE_REFERENCE'
  | 'PATH_OUTSIDE_REPOSITORY'
  | 'SYMLINK_NOT_ALLOWED'
  | 'SOURCE_NOT_REGULAR_FILE'
  | 'SOURCE_TOO_LARGE'
  | 'SOURCE_CHANGED_DURING_READ'
  | 'INVALID_UTF8'
  | 'INVALID_CONTROL_CHARACTER'
  | 'MALFORMED_YAML'
  | 'UNSAFE_YAML_FEATURE'
  | 'INVALID_DOCUMENT_ROOT'
  | 'NON_JSON_YAML_VALUE'
  | 'SOURCE_NOT_FOUND'
  | 'SOURCE_ROOT_UNAVAILABLE'
  | 'SOURCE_READ_FAILED';

export interface RepositoryContextSourceEvidence {
  source_ref: string;
  source_revision: string;
  resolved_path: string;
}

export interface RepositoryContextLoadError {
  recovery_state: 'INVALID_CONTEXT' | 'SOURCE_UNAVAILABLE';
  code: RepositoryContextErrorCode;
  source_ref: string;
  message: string;
}

export type RepositoryContextLoadResult =
  | {
      ok: true;
      document: Record<string, unknown>;
      source: RepositoryContextSourceEvidence;
    }
  | { ok: false; error: RepositoryContextLoadError };

export interface RepositoryContextSourceOptions {
  repositoryRoot: string;
  maxSourceBytes?: number;
}

function invalidContext(
  sourceRef: string,
  code: RepositoryContextErrorCode,
  message: string,
): RepositoryContextLoadResult {
  return {
    ok: false,
    error: {
      recovery_state: 'INVALID_CONTEXT',
      code,
      source_ref: sourceRef,
      message,
    },
  };
}

function unavailable(
  sourceRef: string,
  code: RepositoryContextErrorCode,
  message = 'context source is unavailable',
): RepositoryContextLoadResult {
  return {
    ok: false,
    error: {
      recovery_state: 'SOURCE_UNAVAILABLE',
      code,
      source_ref: sourceRef,
      message,
    },
  };
}

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}

function containsInvalidControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if ((code <= 0x1f && code !== 0x09 && code !== 0x0a && code !== 0x0d) || code === 0x7f) {
      return true;
    }
  }
  return false;
}

function isContained(root: string, candidate: string): boolean {
  const relativePath = relative(root, candidate);
  return (
    relativePath !== '' &&
    relativePath !== '..' &&
    !relativePath.startsWith(`..${sep}`) &&
    !isAbsolute(relativePath)
  );
}

function validateSourceReference(sourceRef: string): RepositoryContextLoadResult | null {
  const segments = sourceRef.split('/');
  const invalid =
    sourceRef.length === 0 ||
    sourceRef.length > 512 ||
    sourceRef !== sourceRef.trim() ||
    containsInvalidControlCharacter(sourceRef) ||
    sourceRef.includes('\\') ||
    /^[A-Za-z]:/.test(sourceRef) ||
    isAbsolute(sourceRef) ||
    win32.isAbsolute(sourceRef) ||
    segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..');

  return invalid
    ? invalidContext(
        sourceRef,
        'INVALID_SOURCE_REFERENCE',
        'context source reference must be a portable repository-relative path',
      )
    : null;
}

function inspectYamlAst(contents: unknown): boolean {
  const pending: Array<{ value: unknown; depth: number }> = [{ value: contents, depth: 0 }];
  let visitedNodes = 0;

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) break;

    visitedNodes += 1;
    if (visitedNodes > MAX_YAML_NODES || current.depth > MAX_YAML_DEPTH) return false;
    if (current.value === null) continue;
    if (isAlias(current.value)) return false;

    if (isNode(current.value)) {
      if (current.value.anchor !== undefined || current.value.tag !== undefined) return false;
      if (isMap(current.value) || isSeq(current.value)) {
        for (let index = current.value.items.length - 1; index >= 0; index -= 1) {
          pending.push({ value: current.value.items[index], depth: current.depth + 1 });
        }
      }
      continue;
    }

    if (isPair(current.value)) {
      pending.push({ value: current.value.value, depth: current.depth + 1 });
      pending.push({ value: current.value.key, depth: current.depth + 1 });
      continue;
    }

    return false;
  }

  return true;
}

function isBoundedJsonRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;

  const pending: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  const seen = new WeakSet<object>();
  let visitedNodes = 0;

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) break;

    visitedNodes += 1;
    if (visitedNodes > MAX_YAML_NODES || current.depth > MAX_YAML_DEPTH) return false;
    if (
      current.value === null ||
      typeof current.value === 'string' ||
      typeof current.value === 'boolean'
    ) {
      continue;
    }
    if (typeof current.value === 'number') {
      if (
        !Number.isFinite(current.value) ||
        (Number.isInteger(current.value) && !Number.isSafeInteger(current.value))
      ) {
        return false;
      }
      continue;
    }
    if (typeof current.value !== 'object' || seen.has(current.value)) return false;
    seen.add(current.value);

    if (Array.isArray(current.value)) {
      for (let index = current.value.length - 1; index >= 0; index -= 1) {
        pending.push({ value: current.value[index], depth: current.depth + 1 });
      }
      continue;
    }

    const prototype = Object.getPrototypeOf(current.value);
    if (prototype !== Object.prototype && prototype !== null) return false;
    for (const child of Object.values(current.value)) {
      pending.push({ value: child, depth: current.depth + 1 });
    }
  }

  return true;
}

export class RepositoryContextSource {
  private readonly repositoryRoot: string;
  private readonly maxSourceBytes: number;

  constructor(options: RepositoryContextSourceOptions) {
    this.repositoryRoot = resolve(options.repositoryRoot);
    this.maxSourceBytes = options.maxSourceBytes ?? DEFAULT_MAX_SOURCE_BYTES;

    if (
      !Number.isSafeInteger(this.maxSourceBytes) ||
      this.maxSourceBytes <= 0 ||
      this.maxSourceBytes > ABSOLUTE_MAX_SOURCE_BYTES
    ) {
      throw new RangeError(
        `maxSourceBytes must be a positive integer no greater than ${ABSOLUTE_MAX_SOURCE_BYTES}`,
      );
    }
  }

  loadCapsule(
    registry: McfProjectRegistryEntry,
    sourceRevision: string,
  ): RepositoryContextLoadResult {
    return this.loadYaml(registry.context.capsule_path, sourceRevision);
  }

  loadYaml(sourceRef: string, sourceRevision: string): RepositoryContextLoadResult {
    const invalidReference = validateSourceReference(sourceRef);
    if (invalidReference) return invalidReference;
    if (
      sourceRevision.length === 0 ||
      sourceRevision.length > 256 ||
      sourceRevision.trim().length === 0 ||
      containsInvalidControlCharacter(sourceRevision)
    ) {
      return invalidContext(
        sourceRef,
        'INVALID_SOURCE_REFERENCE',
        'source revision must be a non-empty bounded string',
      );
    }

    let realRoot: string;
    try {
      realRoot = realpathSync(this.repositoryRoot);
      if (!lstatSync(realRoot).isDirectory()) {
        return unavailable(sourceRef, 'SOURCE_ROOT_UNAVAILABLE');
      }
    } catch {
      return unavailable(sourceRef, 'SOURCE_ROOT_UNAVAILABLE');
    }

    const sourcePath = resolve(realRoot, ...sourceRef.split('/'));
    if (!isContained(realRoot, sourcePath)) {
      return invalidContext(
        sourceRef,
        'PATH_OUTSIDE_REPOSITORY',
        'context source resolves outside the repository root',
      );
    }

    let currentPath = realRoot;
    const segments = sourceRef.split('/');
    for (let index = 0; index < segments.length; index += 1) {
      currentPath = resolve(currentPath, segments[index] ?? '');
      try {
        const metadata = lstatSync(currentPath);
        if (metadata.isSymbolicLink()) {
          return invalidContext(
            sourceRef,
            'SYMLINK_NOT_ALLOWED',
            'context sources may not traverse symbolic links',
          );
        }
        const isFinalSegment = index === segments.length - 1;
        if (
          (!isFinalSegment && !metadata.isDirectory()) ||
          (isFinalSegment && !metadata.isFile())
        ) {
          return invalidContext(
            sourceRef,
            'SOURCE_NOT_REGULAR_FILE',
            'context source must resolve to a regular file',
          );
        }
      } catch (error) {
        if (hasErrorCode(error, 'ENOENT') || hasErrorCode(error, 'ENOTDIR')) {
          return unavailable(sourceRef, 'SOURCE_NOT_FOUND');
        }
        return unavailable(sourceRef, 'SOURCE_READ_FAILED');
      }
    }

    try {
      const realSourcePath = realpathSync(sourcePath);
      if (!isContained(realRoot, realSourcePath)) {
        return invalidContext(
          sourceRef,
          'PATH_OUTSIDE_REPOSITORY',
          'context source resolves outside the repository root',
        );
      }
    } catch {
      return unavailable(sourceRef, 'SOURCE_READ_FAILED');
    }

    let bytes: Buffer;
    let descriptor: number | undefined;
    try {
      descriptor = openSync(sourcePath, constants.O_RDONLY | constants.O_NOFOLLOW);
      const metadata = fstatSync(descriptor);
      if (!metadata.isFile()) {
        return invalidContext(
          sourceRef,
          'SOURCE_NOT_REGULAR_FILE',
          'context source must resolve to a regular file',
        );
      }
      if (metadata.size > this.maxSourceBytes) {
        return invalidContext(
          sourceRef,
          'SOURCE_TOO_LARGE',
          'context source exceeds the configured byte limit',
        );
      }

      const openedPath = realpathSync(`/proc/self/fd/${descriptor}`);
      const currentMetadata = lstatSync(sourcePath);
      if (
        !isContained(realRoot, openedPath) ||
        currentMetadata.dev !== metadata.dev ||
        currentMetadata.ino !== metadata.ino
      ) {
        return invalidContext(
          sourceRef,
          'PATH_OUTSIDE_REPOSITORY',
          'opened context source does not match the validated repository path',
        );
      }

      const boundedBuffer = Buffer.allocUnsafe(this.maxSourceBytes + 1);
      let bytesRead = 0;
      while (bytesRead < boundedBuffer.byteLength) {
        const count = readSync(
          descriptor,
          boundedBuffer,
          bytesRead,
          boundedBuffer.byteLength - bytesRead,
          null,
        );
        if (count === 0) break;
        bytesRead += count;
      }
      if (bytesRead > this.maxSourceBytes) {
        return invalidContext(
          sourceRef,
          'SOURCE_TOO_LARGE',
          'context source exceeds the configured byte limit',
        );
      }

      const finalMetadata = fstatSync(descriptor);
      if (
        finalMetadata.size !== metadata.size ||
        finalMetadata.mtimeMs !== metadata.mtimeMs ||
        finalMetadata.ctimeMs !== metadata.ctimeMs
      ) {
        return invalidContext(
          sourceRef,
          'SOURCE_CHANGED_DURING_READ',
          'context source changed while it was being read',
        );
      }
      bytes = boundedBuffer.subarray(0, bytesRead);
    } catch (error) {
      if (hasErrorCode(error, 'ELOOP')) {
        return invalidContext(
          sourceRef,
          'SYMLINK_NOT_ALLOWED',
          'context sources may not traverse symbolic links',
        );
      }
      if (hasErrorCode(error, 'ENOENT') || hasErrorCode(error, 'ENOTDIR')) {
        return unavailable(sourceRef, 'SOURCE_NOT_FOUND');
      }
      return unavailable(sourceRef, 'SOURCE_READ_FAILED');
    } finally {
      if (descriptor !== undefined) closeSync(descriptor);
    }

    let sourceText: string;
    try {
      sourceText = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      return invalidContext(sourceRef, 'INVALID_UTF8', 'context source must contain valid UTF-8');
    }
    if (containsInvalidControlCharacter(sourceText)) {
      return invalidContext(
        sourceRef,
        'INVALID_CONTROL_CHARACTER',
        'context source contains a disallowed control character',
      );
    }

    try {
      const yamlDocument = parseDocument(sourceText, {
        version: '1.2',
        schema: 'core',
        merge: false,
        resolveKnownTags: false,
        strict: true,
        stringKeys: true,
        uniqueKeys: true,
        prettyErrors: false,
      });
      if (yamlDocument.errors.length > 0) {
        return invalidContext(sourceRef, 'MALFORMED_YAML', 'context source is not valid YAML');
      }
      if (!isMap(yamlDocument.contents)) {
        return invalidContext(
          sourceRef,
          'INVALID_DOCUMENT_ROOT',
          'context source root must be a mapping',
        );
      }
      if (!inspectYamlAst(yamlDocument.contents)) {
        return invalidContext(
          sourceRef,
          'UNSAFE_YAML_FEATURE',
          'context source uses aliases, anchors, tags, or excessive nesting',
        );
      }
      if (yamlDocument.warnings.length > 0) {
        return invalidContext(sourceRef, 'MALFORMED_YAML', 'context source is not valid YAML');
      }

      const document = yamlDocument.toJS({ mapAsMap: false, maxAliasCount: 1 });
      if (!isBoundedJsonRecord(document)) {
        return invalidContext(
          sourceRef,
          'NON_JSON_YAML_VALUE',
          'context source must decode to a bounded JSON object',
        );
      }

      return {
        ok: true,
        document,
        source: {
          source_ref: sourceRef,
          source_revision: sourceRevision,
          resolved_path: sourcePath,
        },
      };
    } catch {
      return invalidContext(sourceRef, 'MALFORMED_YAML', 'context source is not valid YAML');
    }
  }
}
