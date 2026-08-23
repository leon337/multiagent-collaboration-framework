import path from 'node:path';

import { z } from 'zod';

const absoluteNormalizedPath = z.string().min(1).refine(
  (value) => path.isAbsolute(value) && path.resolve(value) === value && !value.includes('\0'),
  'must be a normalized absolute path',
);

const positiveInteger = z.coerce.number().int().positive();

const workerEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  MCF_CODEX_HOME: absoluteNormalizedPath.default('/var/lib/mcf-codex/codex-home'),
  MCF_WORKTREE_ROOT: absoluteNormalizedPath.default('/var/lib/mcf-codex/worktrees'),
  MCF_ARTIFACT_ROOT: absoluteNormalizedPath.default('/var/lib/mcf-codex/artifacts'),
  MCF_CODEX_EXECUTABLE: absoluteNormalizedPath.default('/usr/local/bin/codex'),
  MCF_GIT_EXECUTABLE: absoluteNormalizedPath.default('/usr/bin/git'),
  MCF_CODEX_TIMEOUT_MS: positiveInteger.default(45 * 60 * 1_000),
  MCF_COMMAND_TIMEOUT_MS: positiveInteger.default(5 * 60 * 1_000),
  MCF_MAX_STDOUT_BYTES: positiveInteger.default(8 * 1_024 * 1_024),
  MCF_MAX_STDERR_BYTES: positiveInteger.default(1 * 1_024 * 1_024),
  MCF_MAX_ARTIFACT_BYTES: positiveInteger.default(16 * 1_024 * 1_024),
});

export interface WorkerConfig {
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
  readonly codexHome: string;
  readonly worktreeRoot: string;
  readonly artifactRoot: string;
  readonly codexExecutable: string;
  readonly gitExecutable: string;
  readonly codexTimeoutMs: number;
  readonly commandTimeoutMs: number;
  readonly maxStdoutBytes: number;
  readonly maxStderrBytes: number;
  readonly maxArtifactBytes: number;
}

function pathsOverlap(left: string, right: string): boolean {
  const leftToRight = path.relative(left, right);
  const rightToLeft = path.relative(right, left);
  return (
    leftToRight === '' ||
    rightToLeft === '' ||
    (!leftToRight.startsWith('..') && !path.isAbsolute(leftToRight)) ||
    (!rightToLeft.startsWith('..') && !path.isAbsolute(rightToLeft))
  );
}

export function loadWorkerConfig(
  environment: NodeJS.ProcessEnv = process.env,
): Readonly<WorkerConfig> {
  const parsed = workerEnvironmentSchema.parse(environment);
  const isolatedRoots = [parsed.MCF_CODEX_HOME, parsed.MCF_WORKTREE_ROOT, parsed.MCF_ARTIFACT_ROOT];

  for (let left = 0; left < isolatedRoots.length; left += 1) {
    for (let right = left + 1; right < isolatedRoots.length; right += 1) {
      const leftPath = isolatedRoots[left];
      const rightPath = isolatedRoots[right];
      if (leftPath !== undefined && rightPath !== undefined && pathsOverlap(leftPath, rightPath)) {
        throw new Error(`worker private roots must not overlap: ${leftPath} and ${rightPath}`);
      }
    }
  }

  return Object.freeze({
    nodeEnv: parsed.NODE_ENV,
    logLevel: parsed.LOG_LEVEL,
    codexHome: parsed.MCF_CODEX_HOME,
    worktreeRoot: parsed.MCF_WORKTREE_ROOT,
    artifactRoot: parsed.MCF_ARTIFACT_ROOT,
    codexExecutable: parsed.MCF_CODEX_EXECUTABLE,
    gitExecutable: parsed.MCF_GIT_EXECUTABLE,
    codexTimeoutMs: parsed.MCF_CODEX_TIMEOUT_MS,
    commandTimeoutMs: parsed.MCF_COMMAND_TIMEOUT_MS,
    maxStdoutBytes: parsed.MCF_MAX_STDOUT_BYTES,
    maxStderrBytes: parsed.MCF_MAX_STDERR_BYTES,
    maxArtifactBytes: parsed.MCF_MAX_ARTIFACT_BYTES,
  });
}

