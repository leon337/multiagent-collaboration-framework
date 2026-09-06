import { createHash, randomUUID } from 'node:crypto';
import { execFile, spawn, spawnSync } from 'node:child_process';
import { accessSync, constants, statSync } from 'node:fs';
import { lstat, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, posix, relative, resolve } from 'node:path';
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
  restoreWorkspace(workspace: string, baseSha: string, changedFiles: string[]): Promise<void>;
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

export function probeCodeBuddyExecutorCapability(config: CodeBuddyExecutorConfig): boolean {
  if (
    !config.enabled ||
    !config.binary.trim() ||
    !config.workspaceRoot.trim() ||
    !config.model.trim()
  )
    return false;
  try {
    accessSync(config.binary, constants.X_OK);
    if (!statSync(config.workspaceRoot).isDirectory()) return false;
    const result = spawnSync(config.binary, ['--help'], {
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
    const args = [
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

    return await new Promise<CodeBuddyExecutionResult>((resolveExecution, rejectExecution) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let outputExceeded = false;
      let settled = false;
      const child = spawn(input.binary, args, {
        cwd: input.cwd,
        env: restrictedEnvironment(process.env),
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const killGroup = (signal: NodeJS.Signals): void => {
        if (!child.pid) return;
        try {
          process.kill(-child.pid, signal);
        } catch {
          // The process group may already have terminated.
        }
      };
      const append = (kind: 'stdout' | 'stderr', chunk: Buffer | string): void => {
        const value = chunk.toString();
        if (kind === 'stdout') stdout += value;
        else stderr += value;
        if (Buffer.byteLength(stdout) + Buffer.byteLength(stderr) > OUTPUT_LIMIT_BYTES) {
          outputExceeded = true;
          killGroup('SIGTERM');
        }
      };
      child.stdout?.on('data', (chunk) => append('stdout', chunk));
      child.stderr?.on('data', (chunk) => append('stderr', chunk));
      const timer = setTimeout(() => {
        timedOut = true;
        killGroup('SIGTERM');
        const force = setTimeout(() => killGroup('SIGKILL'), 150);
        force.unref();
      }, input.timeoutMs);
      timer.unref();
      child.once('error', (error: NodeJS.ErrnoException) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error.code === 'ENOENT') {
          rejectExecution(
            new ExternalActionAdapterError(
              'TARGET_NOT_FOUND',
              'CodeBuddy binary was not found',
              false,
            ),
          );
          return;
        }
        resolveExecution({
          exitCode: 1,
          stdout,
          stderr: `${stderr}${error.message}`,
          durationMs: Date.now() - startedAt,
          timedOut: false,
        });
      });
      child.once('close', (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        const finish = (): void =>
          resolveExecution({
            exitCode: outputExceeded ? 1 : (code ?? 1),
            stdout,
            stderr: outputExceeded ? `${stderr}\nOUTPUT_LIMIT_EXCEEDED` : stderr,
            durationMs: Date.now() - startedAt,
            timedOut,
          });
        if (timedOut) setTimeout(finish, 200);
        else finish();
      });
    });
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
    try {
      await writeFile(patchPath, changes.diff, 'utf8');
      await execFileAsync(
        'git',
        ['-C', targetWorkspace, 'apply', '--binary', '--whitespace=nowarn', patchPath],
        { encoding: 'utf8', maxBuffer: OUTPUT_LIMIT_BYTES },
      );
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
      try {
        await this.restoreWorkspace(targetWorkspace, baseSha, changes.changedFiles);
      } catch {
        throw new ExternalActionAdapterError(
          'ADAPTER_FAILURE',
          'CodeBuddy publication failed and authorized workspace restoration failed',
          false,
        );
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
    changedFiles: string[],
  ): Promise<void> {
    await execFileAsync('git', ['-C', workspace, 'reset', '--hard', baseSha], {
      encoding: 'utf8',
      maxBuffer: OUTPUT_LIMIT_BYTES,
    });
    if (changedFiles.length)
      await execFileAsync('git', ['-C', workspace, 'clean', '-fdx', '--', ...changedFiles], {
        encoding: 'utf8',
        maxBuffer: OUTPUT_LIMIT_BYTES,
      });
    const snapshot = await this.inspectWorkspace(workspace);
    if (snapshot.headSha !== baseSha || snapshot.dirtyPaths.length)
      throw new ExternalActionAdapterError(
        'ADAPTER_FAILURE',
        'Authorized workspace restoration could not be verified',
        false,
      );
    for (const path of changedFiles) {
      const residual = (await git(workspace, ['ls-files', '--others', '-z', '--', path]))
        .split('\0')
        .filter(Boolean);
      if (residual.length)
        throw new ExternalActionAdapterError(
          'ADAPTER_FAILURE',
          'Authorized workspace restoration left residual files',
          false,
        );
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
            await this.host.restoreWorkspace(
              snapshot.realPath,
              snapshot.headSha,
              publishedChanges.changedFiles,
            );
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
