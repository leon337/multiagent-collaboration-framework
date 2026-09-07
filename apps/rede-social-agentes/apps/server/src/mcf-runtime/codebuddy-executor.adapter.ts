import { createHash, randomUUID } from 'node:crypto';
import { execFile, spawn, spawnSync } from 'node:child_process';
import { accessSync, constants, realpathSync, statSync } from 'node:fs';
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, posix, relative, resolve } from 'node:path';
import { promisify } from 'node:util';

import type { McfToolReceipt } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';

const execFileAsync = promisify(execFile);
const TOOL_POLICY = ['Read', 'Edit', 'Glob', 'Grep'] as const;
const OUTPUT_LIMIT_BYTES = 1024 * 1024;
const SAFE_ENV_KEYS = [
  'HOME',
  'PATH',
  'USER',
  'LOGNAME',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'TERM',
  'TMPDIR',
  'XDG_CONFIG_HOME',
  'XDG_CACHE_HOME',
  'XDG_DATA_HOME',
  'XDG_RUNTIME_DIR',
  'NO_COLOR',
] as const;

export interface CodeBuddyExecutorConfig {
  enabled: boolean;
  binary: string;
  workspaceRoot: string;
  model: string;
  timeoutMs: number;
}
export interface CodeBuddyWorkspaceSnapshot {
  realPath: string;
  repository: string;
  headSha: string;
  dirtyPaths: string[];
}
export interface CodeBuddyExecutionWorkspace {
  realPath: string;
  cleanupRoot: string;
  baseSha: string;
}
export interface CodeBuddyExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
}
export interface CodeBuddyChangeEvidence {
  changedFiles: string[];
  diff: string;
  headSha: string;
}
export interface CodeBuddyHost {
  inspectWorkspace(workspace: string): Promise<CodeBuddyWorkspaceSnapshot>;
  assertPathsSafe(workspace: string, paths: string[]): Promise<void>;
  createExecutionWorkspace(
    workspace: string,
    baseSha: string,
  ): Promise<CodeBuddyExecutionWorkspace>;
  execute(input: {
    binary: string;
    cwd: string;
    model: string;
    prompt: string;
    timeoutMs: number;
    tools: string[];
  }): Promise<CodeBuddyExecutionResult>;
  collectChanges(
    workspace: string,
    baseSha: string,
    restrictPaths?: string[],
  ): Promise<CodeBuddyChangeEvidence>;
  publishChanges(
    executionWorkspace: string,
    targetWorkspace: string,
    baseSha: string,
    changes: CodeBuddyChangeEvidence,
  ): Promise<void>;
  removeExecutionWorkspace(
    sourceWorkspace: string,
    execution: CodeBuddyExecutionWorkspace,
  ): Promise<void>;
  restoreWorkspace(
    workspace: string,
    baseSha: string,
    changes: CodeBuddyChangeEvidence,
  ): Promise<void>;
}

function canonicalRepository(value: string): string | null {
  const trimmed = value.trim();
  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(trimmed)) return trimmed;
  const https = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/iu.exec(trimmed);
  if (https?.[1] && https[2]) return `${https[1]}/${https[2]}`;
  const ssh = /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/iu.exec(trimmed);
  if (ssh?.[1] && ssh[2]) return `${ssh[1]}/${ssh[2]}`;
  return null;
}
function isInside(root: string, candidate: string): boolean {
  const rel = relative(resolve(root), resolve(candidate));
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith('/'));
}
function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      `${label} must be a non-empty string`,
      false,
    );
  return value.trim();
}
function restrictedEnvironment(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {};
  for (const key of SAFE_ENV_KEYS) {
    const value = source[key];
    if (value !== undefined) environment[key] = value;
  }
  return environment;
}

function resolveExecutablePath(
  binary: string,
  source: NodeJS.ProcessEnv = process.env,
): string | null {
  const value = binary.trim();
  if (!value) return null;
  const candidates = value.includes('/')
    ? [value]
    : (source.PATH ?? '')
        .split(delimiter)
        .filter(Boolean)
        .map((directory) => join(directory, value));
  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK);
      if (!statSync(candidate).isFile()) continue;
      return realpathSync(candidate);
    } catch {
      // Continue searching PATH entries.
    }
  }
  return null;
}

async function findCodeBuddyPackageRoot(binary: string): Promise<string | null> {
  let current = dirname(binary);
  for (let depth = 0; depth < 12; depth += 1) {
    try {
      const packageJson = JSON.parse(await readFile(join(current, 'package.json'), 'utf8')) as {
        name?: unknown;
      };
      if (packageJson.name === '@tencent-ai/codebuddy-code') return current;
    } catch {
      // Not the CodeBuddy package root; continue upward.
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

async function writeSandboxModelConfig(
  configRoot: string,
  model: string,
  requireConfiguredModel: boolean,
): Promise<void> {
  await mkdir(configRoot, { recursive: true, mode: 0o700 });
  let selected: Record<string, unknown> | undefined;
  const sourceConfigRoot =
    process.env.CODEBUDDY_CONFIG_DIR?.trim() ||
    (process.env.HOME?.trim() ? join(process.env.HOME, '.codebuddy') : null);
  if (sourceConfigRoot) {
    try {
      const source = JSON.parse(await readFile(join(sourceConfigRoot, 'models.json'), 'utf8')) as {
        models?: unknown;
      };
      if (Array.isArray(source.models)) {
        selected = source.models.find(
          (candidate): candidate is Record<string, unknown> =>
            typeof candidate === 'object' &&
            candidate !== null &&
            !Array.isArray(candidate) &&
            candidate.id === model,
        );
      }
    } catch {
      // A fake/test executable does not require a CodeBuddy model configuration.
    }
  }
  if (requireConfiguredModel && !selected)
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'Configured CodeBuddy model is unavailable for isolated execution',
      false,
    );
  await writeFile(
    join(configRoot, 'models.json'),
    `${JSON.stringify({ models: selected ? [selected] : [] })}\n`,
    { mode: 0o600 },
  );
}

function addReadOnlyMountIfPresent(args: string[], source: string, target = source): void {
  try {
    statSync(source);
    args.push('--ro-bind', source, target);
  } catch {
    // Optional runtime path is absent on this host.
  }
}

export function probeCodeBuddyExecutorCapability(config: CodeBuddyExecutorConfig): boolean {
  if (
    !config.enabled ||
    !config.binary.trim() ||
    !config.workspaceRoot.trim() ||
    !config.model.trim()
  )
    return false;
  try {
    const binary = resolveExecutablePath(config.binary);
    const bubblewrap = resolveExecutablePath('bwrap');
    if (!binary || !bubblewrap || !statSync(config.workspaceRoot).isDirectory()) return false;
    const result = spawnSync(binary, ['--help'], {
      encoding: 'utf8',
      timeout: 3000,
      env: restrictedEnvironment(process.env),
    });
    if (result.error || result.status !== 0) return false;
    const output = `${result.stdout ?? ''}
${result.stderr ?? ''}`;
    return output.includes('--agent') && output.includes('--model');
  } catch {
    return false;
  }
}
function canonicalRepositoryPath(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new ExternalActionAdapterError('INVALID_CONTEXT', `${label} must contain paths`, false);
  const trimmed = value.trim();
  if (trimmed.includes('\0') || trimmed.includes('\\') || trimmed.startsWith('/'))
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      `${label} contains an unsafe path`,
      false,
    );
  const normalized = posix.normalize(trimmed).replace(/\/$/u, '');
  if (
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../')
  )
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      `${label} contains an unsafe path`,
      false,
    );
  return normalized;
}
function approvedPaths(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0)
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'allowed_paths must be a non-empty array of repository-relative paths',
      false,
    );
  const paths = value.map((item) => canonicalRepositoryPath(item, 'allowed_paths'));
  if (new Set(paths).size !== paths.length)
    throw new ExternalActionAdapterError('INVALID_CONTEXT', 'allowed_paths must be unique', false);
  return paths;
}
function pathIsAllowed(path: string, allowed: string[]): boolean {
  const normalized = canonicalRepositoryPath(path, 'changedFiles');
  return allowed.some((scope) => normalized === scope || normalized.startsWith(`${scope}/`));
}
function criteria(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  if (Array.isArray(value)) {
    const items = value
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim())
      .filter(Boolean);
    if (items.length === value.length && items.length) return items;
  }
  throw new ExternalActionAdapterError(
    'INVALID_CONTEXT',
    'acceptance_criteria must be a non-empty string or string array',
    false,
  );
}
function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
async function git(workspace: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', ['-C', workspace, ...args], {
      encoding: 'utf8',
      maxBuffer: OUTPUT_LIMIT_BYTES,
    });
    return stdout;
  } catch {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'Workspace Git inspection failed',
      false,
    );
  }
}
async function gitNoIndexDiff(workspace: string, path: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['-C', workspace, 'diff', '--no-index', '--binary', '--', '/dev/null', path],
      { encoding: 'utf8', maxBuffer: OUTPUT_LIMIT_BYTES },
    );
    return stdout;
  } catch (error) {
    const candidate = error as { code?: number | string; stdout?: string };
    if (candidate.code === 1 && typeof candidate.stdout === 'string') return candidate.stdout;
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      'Workspace Git diff inspection failed',
      false,
    );
  }
}

export class LocalCodeBuddyHost implements CodeBuddyHost {
  async inspectWorkspace(workspace: string): Promise<CodeBuddyWorkspaceSnapshot> {
    let resolved: string;
    try {
      resolved = await realpath(workspace);
    } catch {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'Workspace path is unavailable',
        false,
      );
    }
    const top = (await git(resolved, ['rev-parse', '--show-toplevel'])).trim();
    const headSha = (await git(resolved, ['rev-parse', 'HEAD'])).trim().toLowerCase();
    const origin = (await git(resolved, ['remote', 'get-url', 'origin'])).trim();
    const repository = canonicalRepository(origin);
    if (!repository || !/^[a-f0-9]{40}$/u.test(headSha))
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'Workspace repository metadata is invalid',
        false,
      );
    const tracked = (
      await git(resolved, ['diff', '--name-only', '-z', '--no-renames', 'HEAD', '--'])
    )
      .split('\0')
      .filter(Boolean);
    const untracked = (await git(resolved, ['ls-files', '--others', '--exclude-standard', '-z']))
      .split('\0')
      .filter(Boolean);
    const dirtyPaths = [...new Set([...tracked, ...untracked])].sort();
    return { realPath: await realpath(top), repository, headSha, dirtyPaths };
  }

  async assertPathsSafe(workspace: string, paths: string[]): Promise<void> {
    const root = await realpath(workspace);
    for (const input of paths) {
      const path = canonicalRepositoryPath(input, 'allowed_paths');
      if (path === '.git' || path.startsWith('.git/'))
        throw new ExternalActionAdapterError(
          'INVALID_CONTEXT',
          'CodeBuddy paths cannot target Git metadata',
          false,
        );
      const segments = path.split('/');
      let current = root;
      for (let index = 0; index < segments.length; index += 1) {
        current = join(current, segments[index] ?? '');
        try {
          const stat = await lstat(current);
          if (stat.isSymbolicLink())
            throw new ExternalActionAdapterError(
              'INVALID_CONTEXT',
              'CodeBuddy paths cannot traverse symbolic links',
              false,
            );
          if (index < segments.length - 1 && !stat.isDirectory())
            throw new ExternalActionAdapterError(
              'INVALID_CONTEXT',
              'CodeBuddy path ancestors must be directories',
              false,
            );
          if (index === segments.length - 1 && !stat.isDirectory() && !stat.isFile())
            throw new ExternalActionAdapterError(
              'INVALID_CONTEXT',
              'CodeBuddy paths must resolve to regular files or directories',
              false,
            );
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') break;
          throw error;
        }
      }
    }
  }

  async createExecutionWorkspace(
    workspace: string,
    baseSha: string,
  ): Promise<CodeBuddyExecutionWorkspace> {
    const cleanupRoot = await mkdtemp(join(tmpdir(), 'mcf-codebuddy-run-'));
    const executionPath = join(cleanupRoot, 'worktree');
    try {
      await execFileAsync(
        'git',
        ['-C', workspace, 'worktree', 'add', '--detach', executionPath, baseSha],
        { encoding: 'utf8', maxBuffer: OUTPUT_LIMIT_BYTES },
      );
      return {
        realPath: await realpath(executionPath),
        cleanupRoot,
        baseSha,
      };
    } catch {
      await rm(cleanupRoot, { recursive: true, force: true });
      throw new ExternalActionAdapterError(
        'ADAPTER_FAILURE',
        'CodeBuddy execution worktree could not be created',
        false,
      );
    }
  }

  async execute(input: {
    binary: string;
    cwd: string;
    model: string;
    prompt: string;
    timeoutMs: number;
    tools: string[];
  }): Promise<CodeBuddyExecutionResult> {
    const startedAt = Date.now();
    const binary = resolveExecutablePath(input.binary);
    const bubblewrap = resolveExecutablePath('bwrap');
    if (!binary)
      throw new ExternalActionAdapterError(
        'TARGET_NOT_FOUND',
        'CodeBuddy binary was not found',
        false,
      );
    if (!bubblewrap)
      throw new ExternalActionAdapterError(
        'TARGET_NOT_FOUND',
        'Bubblewrap sandbox runtime was not found',
        false,
      );

    const sandboxRoot = await mkdtemp(join(tmpdir(), 'mcf-codebuddy-sandbox-'));
    const sandboxConfig = join(sandboxRoot, 'config');
    const packageRoot = await findCodeBuddyPackageRoot(binary);
    try {
      await writeSandboxModelConfig(sandboxConfig, input.model, packageRoot !== null);
      const uid = typeof process.getuid === 'function' ? process.getuid() : 1000;
      const gid = typeof process.getgid === 'function' ? process.getgid() : 1000;
      const sandboxPasswd = join(sandboxRoot, 'passwd');
      const sandboxGroup = join(sandboxRoot, 'group');
      await writeFile(
        sandboxPasswd,
        `mcf:x:${uid}:${gid}:MCF Sandbox:/home/mcf:/usr/sbin/nologin\n`,
        { mode: 0o644 },
      );
      await writeFile(sandboxGroup, `mcf:x:${gid}:\n`, { mode: 0o644 });
      const codeBuddyArgs = [
        '-p',
        input.prompt,
        '--no-session-persistence',
        '--agent',
        'cli',
        '--tools',
        input.tools.join(','),
        '--permission-mode',
        'acceptEdits',
        '--model',
        input.model,
        '--output-format',
        'json',
      ];
      const sandboxArgs = [
        '--unshare-user',
        '--unshare-pid',
        '--die-with-parent',
        '--new-session',
        '--cap-drop',
        'ALL',
        '--proc',
        '/proc',
        '--dev',
        '/dev',
        '--tmpfs',
        '/tmp',
        '--dir',
        '/etc',
        '--dir',
        '/home',
        '--dir',
        '/home/mcf',
        '--dir',
        '/mcf',
        '--dir',
        '/mcf/bin',
        '--dir',
        '/mcf/xdg-config',
        '--dir',
        '/mcf/xdg-cache',
        '--dir',
        '/mcf/xdg-data',
        '--dir',
        '/mcf/xdg-runtime',
      ];
      addReadOnlyMountIfPresent(sandboxArgs, '/usr');
      addReadOnlyMountIfPresent(sandboxArgs, '/bin');
      addReadOnlyMountIfPresent(sandboxArgs, '/lib');
      addReadOnlyMountIfPresent(sandboxArgs, '/lib64');
      addReadOnlyMountIfPresent(sandboxArgs, '/etc/ld.so.cache');
      addReadOnlyMountIfPresent(sandboxArgs, '/etc/nsswitch.conf');
      addReadOnlyMountIfPresent(sandboxArgs, '/etc/hosts');
      addReadOnlyMountIfPresent(sandboxArgs, '/etc/resolv.conf');
      sandboxArgs.push(
        '--ro-bind',
        sandboxPasswd,
        '/etc/passwd',
        '--ro-bind',
        sandboxGroup,
        '/etc/group',
        '--bind',
        input.cwd,
        '/workspace',
        '--bind',
        sandboxConfig,
        '/mcf/config',
      );

      let sandboxCommand: string;
      if (packageRoot) {
        sandboxArgs.push(
          '--ro-bind',
          packageRoot,
          '/opt/codebuddy',
          '--ro-bind',
          process.execPath,
          '/mcf/bin/node',
        );
        sandboxCommand = '/mcf/bin/node';
        codeBuddyArgs.unshift('/opt/codebuddy/bin/codebuddy');
      } else {
        sandboxArgs.push('--ro-bind', binary, '/mcf/bin/codebuddy');
        sandboxCommand = '/mcf/bin/codebuddy';
      }

      sandboxArgs.push(
        '--clearenv',
        '--setenv',
        'HOME',
        '/home/mcf',
        '--setenv',
        'USER',
        'mcf',
        '--setenv',
        'LOGNAME',
        'mcf',
        '--setenv',
        'PATH',
        '/mcf/bin:/usr/bin:/bin',
        '--setenv',
        'TMPDIR',
        '/tmp',
        '--setenv',
        'XDG_CONFIG_HOME',
        '/mcf/xdg-config',
        '--setenv',
        'XDG_CACHE_HOME',
        '/mcf/xdg-cache',
        '--setenv',
        'XDG_DATA_HOME',
        '/mcf/xdg-data',
        '--setenv',
        'XDG_RUNTIME_DIR',
        '/mcf/xdg-runtime',
        '--setenv',
        'CODEBUDDY_CONFIG_DIR',
        '/mcf/config',
        '--setenv',
        'NO_COLOR',
        '1',
        '--chdir',
        '/workspace',
        '--',
        sandboxCommand,
        ...codeBuddyArgs,
      );

      return await new Promise<CodeBuddyExecutionResult>((resolveExecution, rejectExecution) => {
        let stdout = '';
        let stderr = '';
        let capturedBytes = 0;
        let timedOut = false;
        let outputExceeded = false;
        let settled = false;
        let forceTimer: NodeJS.Timeout | null = null;
        let settlementTimer: NodeJS.Timeout | null = null;
        const child = spawn(bubblewrap, sandboxArgs, {
          cwd: input.cwd,
          env: { PATH: process.env.PATH ?? '/usr/bin:/bin' },
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        const clearTimers = (): void => {
          clearTimeout(timer);
          if (forceTimer) clearTimeout(forceTimer);
          if (settlementTimer) clearTimeout(settlementTimer);
        };
        const killGroup = (signal: NodeJS.Signals): void => {
          if (!child.pid) return;
          try {
            process.kill(-child.pid, signal);
          } catch {
            // The sandbox process group may already have terminated.
          }
        };
        const finish = (code: number | null): void => {
          if (settled) return;
          settled = true;
          clearTimers();
          child.stdout?.removeAllListeners('data');
          child.stderr?.removeAllListeners('data');
          resolveExecution({
            exitCode: outputExceeded ? 1 : (code ?? 1),
            stdout,
            stderr,
            durationMs: Date.now() - startedAt,
            timedOut,
          });
        };
        const terminate = (): void => {
          killGroup('SIGTERM');
          if (!forceTimer) {
            forceTimer = setTimeout(() => killGroup('SIGKILL'), 150);
            forceTimer.unref();
          }
          if (!settlementTimer) {
            settlementTimer = setTimeout(() => finish(1), 1200);
            settlementTimer.unref();
          }
        };
        const append = (kind: 'stdout' | 'stderr', chunk: Buffer | string): void => {
          const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          const remaining = Math.max(0, OUTPUT_LIMIT_BYTES - capturedBytes);
          if (remaining > 0) {
            const retained = bytes.subarray(0, remaining);
            if (kind === 'stdout') stdout += retained.toString('utf8');
            else stderr += retained.toString('utf8');
            capturedBytes += retained.byteLength;
          }
          if (bytes.byteLength > remaining && !outputExceeded) {
            outputExceeded = true;
            terminate();
          }
        };
        child.stdout?.on('data', (chunk) => append('stdout', chunk));
        child.stderr?.on('data', (chunk) => append('stderr', chunk));
        const timer = setTimeout(() => {
          timedOut = true;
          terminate();
        }, input.timeoutMs);
        timer.unref();
        child.once('error', (error: NodeJS.ErrnoException) => {
          if (settled) return;
          clearTimers();
          settled = true;
          if (error.code === 'ENOENT') {
            rejectExecution(
              new ExternalActionAdapterError(
                'TARGET_NOT_FOUND',
                'Bubblewrap sandbox runtime was not found',
                false,
              ),
            );
            return;
          }
          resolveExecution({
            exitCode: 1,
            stdout,
            stderr: `${stderr}${error.message}`.slice(0, OUTPUT_LIMIT_BYTES),
            durationMs: Date.now() - startedAt,
            timedOut: false,
          });
        });
        child.once('close', (code) => finish(code));
      });
    } finally {
      await rm(sandboxRoot, { recursive: true, force: true });
    }
  }

  async collectChanges(
    workspace: string,
    baseSha: string,
    restrictPaths?: string[],
  ): Promise<CodeBuddyChangeEvidence> {
    const headSha = (await git(workspace, ['rev-parse', 'HEAD'])).trim().toLowerCase();
    const pathspec = restrictPaths?.length ? ['--', ...restrictPaths] : ['--'];
    const tracked = (
      await git(workspace, ['diff', '--name-only', '-z', '--no-renames', baseSha, ...pathspec])
    )
      .split('\0')
      .filter(Boolean);
    const untrackedArgs = ['ls-files', '--others', '-z'];
    if (restrictPaths?.length) untrackedArgs.push('--', ...restrictPaths);
    const untracked = (await git(workspace, untrackedArgs)).split('\0').filter(Boolean);
    const changedFiles = [...new Set([...tracked, ...untracked])].sort();
    const trackedDiff = await git(workspace, [
      'diff',
      '--binary',
      '--no-renames',
      baseSha,
      ...pathspec,
    ]);
    const untrackedDiffs = await Promise.all(
      [...new Set(untracked)].sort().map((path) => gitNoIndexDiff(workspace, path)),
    );
    return { changedFiles, diff: [trackedDiff, ...untrackedDiffs].join(''), headSha };
  }

  async publishChanges(
    executionWorkspace: string,
    targetWorkspace: string,
    baseSha: string,
    changes: CodeBuddyChangeEvidence,
  ): Promise<void> {
    const before = await this.inspectWorkspace(targetWorkspace);
    if (before.headSha !== baseSha || before.dirtyPaths.length)
      throw new ExternalActionAdapterError(
        'RESERVATION_CONFLICT',
        'Authorized workspace changed before CodeBuddy publication',
        true,
      );
    await this.assertPathsSafe(targetWorkspace, changes.changedFiles);
    const patchRoot = await mkdtemp(join(tmpdir(), 'mcf-codebuddy-patch-'));
    const patchPath = join(patchRoot, 'change.patch');
    let patchApplied = false;
    try {
      await writeFile(patchPath, changes.diff, 'utf8');
      await execFileAsync(
        'git',
        ['-C', targetWorkspace, 'apply', '--binary', '--whitespace=nowarn', patchPath],
        { encoding: 'utf8', maxBuffer: OUTPUT_LIMIT_BYTES },
      );
      patchApplied = true;
      const actual = await this.collectChanges(targetWorkspace, baseSha, changes.changedFiles);
      if (
        actual.headSha !== baseSha ||
        JSON.stringify(actual.changedFiles) !== JSON.stringify(changes.changedFiles) ||
        actual.diff !== changes.diff
      )
        throw new ExternalActionAdapterError(
          'ADAPTER_FAILURE',
          'Published CodeBuddy patch does not match validated evidence',
          false,
        );
      await this.assertPathsSafe(targetWorkspace, changes.changedFiles);
      for (const path of changes.changedFiles) {
        const source = join(executionWorkspace, path);
        const target = join(targetWorkspace, path);
        let sourceBytes: Buffer | null = null;
        try {
          const sourceStat = await lstat(source);
          if (!sourceStat.isFile())
            throw new ExternalActionAdapterError(
              'INVALID_RESPONSE',
              'CodeBuddy produced a non-regular changed path',
              false,
            );
          sourceBytes = await readFile(source);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
        if (sourceBytes === null) {
          try {
            await lstat(target);
            throw new ExternalActionAdapterError(
              'ADAPTER_FAILURE',
              'Deleted CodeBuddy path remained after publication',
              false,
            );
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
          }
        } else {
          const targetStat = await lstat(target);
          if (!targetStat.isFile() || !sourceBytes.equals(await readFile(target)))
            throw new ExternalActionAdapterError(
              'ADAPTER_FAILURE',
              'Published CodeBuddy file content does not match validated source',
              false,
            );
        }
      }
    } catch (error) {
      if (patchApplied) {
        try {
          await this.restoreWorkspace(targetWorkspace, baseSha, changes);
        } catch {
          throw new ExternalActionAdapterError(
            'ADAPTER_FAILURE',
            'CodeBuddy publication failed and transactional restoration failed',
            false,
          );
        }
      }
      if (error instanceof ExternalActionAdapterError) throw error;
      throw new ExternalActionAdapterError(
        'ADAPTER_FAILURE',
        'Validated CodeBuddy patch publication failed',
        false,
      );
    } finally {
      await rm(patchRoot, { recursive: true, force: true });
    }
  }

  async removeExecutionWorkspace(
    sourceWorkspace: string,
    execution: CodeBuddyExecutionWorkspace,
  ): Promise<void> {
    try {
      await execFileAsync(
        'git',
        ['-C', sourceWorkspace, 'worktree', 'remove', '--force', execution.realPath],
        { encoding: 'utf8', maxBuffer: OUTPUT_LIMIT_BYTES },
      );
    } catch {
      await rm(execution.realPath, { recursive: true, force: true });
      await execFileAsync('git', ['-C', sourceWorkspace, 'worktree', 'prune'], {
        encoding: 'utf8',
        maxBuffer: OUTPUT_LIMIT_BYTES,
      });
    } finally {
      await rm(execution.cleanupRoot, { recursive: true, force: true });
    }
  }

  async restoreWorkspace(
    workspace: string,
    baseSha: string,
    changes: CodeBuddyChangeEvidence,
  ): Promise<void> {
    const headSha = (await git(workspace, ['rev-parse', 'HEAD'])).trim().toLowerCase();
    if (headSha !== baseSha)
      throw new ExternalActionAdapterError(
        'RESERVATION_CONFLICT',
        'Authorized workspace HEAD changed before transactional restoration',
        true,
      );
    const patchRoot = await mkdtemp(join(tmpdir(), 'mcf-codebuddy-rollback-'));
    const patchPath = join(patchRoot, 'change.patch');
    try {
      await writeFile(patchPath, changes.diff, 'utf8');
      await execFileAsync(
        'git',
        ['-C', workspace, 'apply', '--reverse', '--binary', '--whitespace=nowarn', patchPath],
        { encoding: 'utf8', maxBuffer: OUTPUT_LIMIT_BYTES },
      );
      const residual = await this.collectChanges(workspace, baseSha, changes.changedFiles);
      if (residual.headSha !== baseSha || residual.changedFiles.length || residual.diff)
        throw new ExternalActionAdapterError(
          'ADAPTER_FAILURE',
          'Transactional CodeBuddy restoration could not be verified',
          false,
        );
    } catch (error) {
      if (error instanceof ExternalActionAdapterError) throw error;
      throw new ExternalActionAdapterError(
        'ADAPTER_FAILURE',
        'Transactional CodeBuddy restoration failed without destructive reset',
        false,
      );
    } finally {
      await rm(patchRoot, { recursive: true, force: true });
    }
  }
}

export class CodeBuddyExecutorAdapter implements ExternalActionAdapter {
  readonly adapterId = 'codebuddy-implement-change-local-v1';
  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly config: CodeBuddyExecutorConfig,
    private readonly host: CodeBuddyHost = new LocalCodeBuddyHost(),
  ) {}
  supports(request: ExternalActionRequest): boolean {
    return (
      this.config.enabled &&
      request.skill.skillId === 'MCF-IMPLEMENT-CHANGE' &&
      canonicalizeProvider(request.tool.provider) === 'codebuddy' &&
      canonicalizeToolValue(request.tool.operation) === 'implement-change'
    );
  }
  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    const scope = requireNonEmptyString(request.inputs.approved_scope, 'approved_scope');
    const acceptance = criteria(request.inputs.acceptance_criteria);
    const repository = requireNonEmptyString(request.inputs.repository, 'repository');
    const workspace = requireNonEmptyString(request.inputs.workspace, 'workspace');
    const allowedPaths = approvedPaths(request.inputs.allowed_paths);
    if (canonicalRepository(repository)?.toLowerCase() !== request.tool.resource.toLowerCase())
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'Repository input must match the declared resource',
        false,
      );
    const snapshot = await this.host.inspectWorkspace(workspace);
    if (!isInside(this.config.workspaceRoot, snapshot.realPath))
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'Workspace is outside the authorized root',
        false,
      );
    if (snapshot.repository.toLowerCase() !== repository.toLowerCase())
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'Workspace origin does not match the requested repository',
        false,
      );
    if (snapshot.dirtyPaths.length)
      throw new ExternalActionAdapterError(
        'RESERVATION_CONFLICT',
        'Workspace must be clean before CodeBuddy execution',
        true,
      );
    await this.host.assertPathsSafe(snapshot.realPath, allowedPaths);
    const model =
      request.inputs.model === undefined
        ? this.config.model
        : requireNonEmptyString(request.inputs.model, 'model');
    if (model !== this.config.model)
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'Requested CodeBuddy model is outside the configured allowlist',
        false,
      );
    const prompt = [
      `MCF mission: ${request.context?.missionId ?? 'unbound'}`,
      `MCF phase: ${request.context?.phaseId ?? 'unbound'}`,
      `Repository: ${repository}`,
      `Approved scope: ${scope}`,
      'Allowed repository paths:',
      ...allowedPaths.map((path) => `- ${path}`),
      'Acceptance criteria:',
      ...acceptance.map((item) => `- ${item}`),
      'Modify only the listed allowed repository paths. Do not commit, merge, deploy, publish, or use shell commands.',
    ].join('\n');

    let executionWorkspace: CodeBuddyExecutionWorkspace | null = null;
    let publishedChanges: CodeBuddyChangeEvidence | null = null;
    let receipt: McfToolReceipt | null = null;
    let executionError: unknown = null;
    try {
      executionWorkspace = await this.host.createExecutionWorkspace(
        snapshot.realPath,
        snapshot.headSha,
      );
      await this.host.assertPathsSafe(executionWorkspace.realPath, allowedPaths);
      const execution = await this.host.execute({
        binary: this.config.binary,
        cwd: executionWorkspace.realPath,
        model,
        prompt,
        timeoutMs: this.config.timeoutMs,
        tools: [...TOOL_POLICY],
      });
      if (execution.timedOut)
        throw new ExternalActionAdapterError(
          'ADAPTER_TIMEOUT',
          'CodeBuddy execution exceeded its deadline',
          true,
        );
      if (execution.exitCode !== 0)
        throw new ExternalActionAdapterError(
          'ADAPTER_FAILURE',
          'CodeBuddy execution failed',
          false,
        );
      const changes = await this.host.collectChanges(executionWorkspace.realPath, snapshot.headSha);
      if (changes.headSha !== snapshot.headSha)
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'CodeBuddy changed the execution worktree HEAD',
          false,
        );
      if (!changes.changedFiles.length)
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'CodeBuddy completed without filesystem changes',
          false,
        );
      const normalizedChangedFiles = changes.changedFiles.map((path) =>
        canonicalRepositoryPath(path, 'changedFiles'),
      );
      if (new Set(normalizedChangedFiles).size !== normalizedChangedFiles.length)
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'CodeBuddy reported duplicate changed files',
          false,
        );
      if (normalizedChangedFiles.some((path) => !pathIsAllowed(path, allowedPaths)))
        throw new ExternalActionAdapterError(
          'INVALID_RESPONSE',
          'CodeBuddy changed files outside allowed_paths',
          false,
        );
      await this.host.assertPathsSafe(executionWorkspace.realPath, normalizedChangedFiles);
      await this.host.publishChanges(
        executionWorkspace.realPath,
        snapshot.realPath,
        snapshot.headSha,
        changes,
      );
      publishedChanges = changes;
      const diffBytes = Buffer.from(changes.diff, 'utf8');
      const diffDigest = digest(changes.diff);
      const metadata = {
        adapterId: this.adapterId,
        repository,
        workspaceRelativeToRoot:
          relative(resolve(this.config.workspaceRoot), resolve(snapshot.realPath)) || '.',
        baseCommitSha: snapshot.headSha,
        changedFiles: normalizedChangedFiles,
        changedFileCount: normalizedChangedFiles.length,
        approvedPaths: allowedPaths,
        diffDigest,
        diffArtifact: {
          encoding: 'base64',
          data: diffBytes.toString('base64'),
          byteLength: diffBytes.byteLength,
        },
        model,
        testHandoff: {
          skillId: 'MCF-RUN-TESTS',
          status: 'PENDING',
          reason: 'CODEBUDDY_TOOL_POLICY_EXCLUDES_TEST_EXECUTION',
        },
        toolPolicy: [...TOOL_POLICY],
        exitCode: execution.exitCode,
        durationMs: execution.durationMs,
        stdoutDigest: digest(execution.stdout),
        localOnly: true,
        committed: false,
        executionIsolation: 'DISPOSABLE_GIT_WORKTREE',
        filesystemIsolation: 'BUBBLEWRAP_MINIMAL_FS',
        processIsolation: 'BUBBLEWRAP_PID_NAMESPACE',
        configIsolation: 'EPHEMERAL_CODEBUDDY_CONFIG',
      };
      receipt = this.evidence.createTrustedReceipt({
        provider: 'codebuddy',
        operation: 'implement-change',
        resource: request.tool.resource,
        externalId: randomUUID(),
        commitSha: snapshot.headSha,
        status: 'SUCCEEDED',
        observedAt: new Date().toISOString(),
        metadata,
      });
    } catch (error) {
      executionError = error;
    }

    if (executionWorkspace) {
      try {
        await this.host.removeExecutionWorkspace(snapshot.realPath, executionWorkspace);
      } catch {
        if (publishedChanges) {
          try {
            await this.host.restoreWorkspace(snapshot.realPath, snapshot.headSha, publishedChanges);
          } catch {
            // Cleanup failure remains authoritative; the workspace is not claimed safe.
          }
        }
        throw new ExternalActionAdapterError(
          'ADAPTER_FAILURE',
          'CodeBuddy execution workspace cleanup failed',
          false,
        );
      }
    }
    if (executionError) throw executionError;
    if (!receipt)
      throw new ExternalActionAdapterError(
        'ADAPTER_FAILURE',
        'CodeBuddy execution completed without a receipt',
        false,
      );
    return receipt;
  }
}
