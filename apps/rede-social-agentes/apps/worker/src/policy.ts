import path from 'node:path';

import { z } from 'zod';

const safeIdentifierPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;
const fullCommitShaPattern = /^[0-9a-f]{40}$/;

const normalizedAbsolutePathSchema = z.string().refine(
  (value) => path.isAbsolute(value) && path.resolve(value) === value && !value.includes('\0'),
  'must be a normalized absolute path',
);

const validationCommandSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
  executable: normalizedAbsolutePathSchema,
  argv: z.array(z.string().max(1_024).refine((value) => !value.includes('\0'))).max(64),
  timeoutMs: z.number().int().positive().max(30 * 60 * 1_000),
});

const repositoryPolicySchema = z.object({
  repositoryKey: z.string().regex(safeIdentifierPattern),
  repositoryPath: normalizedAbsolutePathSchema,
  worktreeRoot: normalizedAbsolutePathSchema,
  allowedBaseCommitShas: z.array(z.string().regex(fullCommitShaPattern)).min(1),
  writablePaths: z.array(z.string().min(1)).min(1),
  validationCommands: z.array(validationCommandSchema).max(32),
  maximumAutonomousRisk: z.enum(['A', 'B']).default('A'),
});

export interface ValidationCommandPolicy {
  readonly id: string;
  readonly executable: string;
  readonly argv: readonly string[];
  readonly timeoutMs: number;
}

export interface RepositoryPolicy {
  readonly repositoryKey: string;
  readonly repositoryPath: string;
  readonly worktreeRoot: string;
  readonly allowedBaseCommitShas: ReadonlySet<string>;
  readonly writablePaths: readonly string[];
  readonly validationCommands: readonly ValidationCommandPolicy[];
  readonly maximumAutonomousRisk: 'A' | 'B';
}

export type RepositoryPolicyInput = z.input<typeof repositoryPolicySchema>;

export function assertSafeIdentifier(value: string, label = 'identifier'): string {
  if (!safeIdentifierPattern.test(value) || value === '.' || value === '..') {
    throw new Error(`${label} is not a safe identifier`);
  }
  return value;
}

export function assertFullCommitSha(value: string): string {
  if (!fullCommitShaPattern.test(value)) {
    throw new Error('base ref must be a lowercase, full 40-character commit SHA');
  }
  return value;
}

export function isPathInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export function resolveInside(root: string, ...segments: string[]): string {
  const candidate = path.resolve(root, ...segments);
  if (!isPathInside(root, candidate)) {
    throw new Error(`resolved path escapes authorized root: ${candidate}`);
  }
  return candidate;
}

export function normalizeRelativeWorkspacePath(value: string): string {
  if (value.includes('\0') || path.isAbsolute(value)) {
    throw new Error('workspace path must be relative');
  }

  const normalized = path.posix.normalize(value.replaceAll('\\', '/'));
  if (
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized === '.git' ||
    normalized.startsWith('.git/')
  ) {
    throw new Error('workspace path is outside the writable workspace policy');
  }

  return normalized.replace(/^\.\//, '');
}

export function createRepositoryPolicy(input: RepositoryPolicyInput): Readonly<RepositoryPolicy> {
  const parsed = repositoryPolicySchema.parse(input);
  const writablePaths = parsed.writablePaths.map(normalizeRelativeWorkspacePath);

  return Object.freeze({
    repositoryKey: parsed.repositoryKey,
    repositoryPath: parsed.repositoryPath,
    worktreeRoot: parsed.worktreeRoot,
    allowedBaseCommitShas: new Set(parsed.allowedBaseCommitShas),
    writablePaths: Object.freeze(writablePaths),
    validationCommands: Object.freeze(
      parsed.validationCommands.map((command) =>
        Object.freeze({
          ...command,
          argv: Object.freeze([...command.argv]),
        }),
      ),
    ),
    maximumAutonomousRisk: parsed.maximumAutonomousRisk,
  });
}

export class RepositoryPolicyRegistry {
  readonly #policies: ReadonlyMap<string, Readonly<RepositoryPolicy>>;

  constructor(policies: readonly Readonly<RepositoryPolicy>[]) {
    const byKey = new Map<string, Readonly<RepositoryPolicy>>();
    for (const policy of policies) {
      if (byKey.has(policy.repositoryKey)) {
        throw new Error(`duplicate repository policy: ${policy.repositoryKey}`);
      }
      byKey.set(policy.repositoryKey, policy);
    }
    this.#policies = byKey;
  }

  get(repositoryKey: string): Readonly<RepositoryPolicy> {
    assertSafeIdentifier(repositoryKey, 'repository key');
    const policy = this.#policies.get(repositoryKey);
    if (policy === undefined) {
      throw new Error(`repository is not allowlisted: ${repositoryKey}`);
    }
    return policy;
  }
}

export function assertBaseCommitAllowed(policy: RepositoryPolicy, baseCommitSha: string): string {
  const sha = assertFullCommitSha(baseCommitSha);
  if (!policy.allowedBaseCommitShas.has(sha)) {
    throw new Error(`base commit is not allowlisted for ${policy.repositoryKey}`);
  }
  return sha;
}

