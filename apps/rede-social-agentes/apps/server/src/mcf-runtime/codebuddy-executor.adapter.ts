import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { realpath } from 'node:fs/promises';
import { posix, relative, resolve } from 'node:path';
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
}
export interface CodeBuddyHost {
  inspectWorkspace(workspace: string): Promise<CodeBuddyWorkspaceSnapshot>;
  execute(input: {
    binary: string;
    cwd: string;
    model: string;
    prompt: string;
    timeoutMs: number;
    tools: string[];
  }): Promise<CodeBuddyExecutionResult>;
  collectChanges(workspace: string): Promise<CodeBuddyChangeEvidence>;
  restoreWorkspace(workspace: string): Promise<void>;
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
    const status = await git(resolved, ['status', '--porcelain=v1', '-z']);
    const dirtyPaths = status
      .split('\0')
      .filter(Boolean)
      .map((entry) => entry.slice(3));
    return { realPath: await realpath(top), repository, headSha, dirtyPaths };
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
    try {
      const { stdout, stderr } = await execFileAsync(input.binary, args, {
        cwd: input.cwd,
        encoding: 'utf8',
        timeout: input.timeoutMs,
        maxBuffer: OUTPUT_LIMIT_BYTES,
        env: restrictedEnvironment(process.env),
      });
      return { exitCode: 0, stdout, stderr, durationMs: Date.now() - startedAt, timedOut: false };
    } catch (error) {
      const e = error as NodeJS.ErrnoException & {
        killed?: boolean;
        signal?: string;
        stdout?: string;
        stderr?: string;
        code?: number | string;
      };
      if (e.code === 'ENOENT')
        throw new ExternalActionAdapterError(
          'TARGET_NOT_FOUND',
          'CodeBuddy binary was not found',
          false,
        );
      return {
        exitCode: typeof e.code === 'number' ? e.code : 1,
        stdout: e.stdout ?? '',
        stderr: e.stderr ?? '',
        durationMs: Date.now() - startedAt,
        timedOut: e.killed === true || e.signal === 'SIGTERM',
      };
    }
  }
  async collectChanges(workspace: string): Promise<CodeBuddyChangeEvidence> {
    const status = await git(workspace, ['status', '--porcelain=v1', '-z']);
    const changedFiles = status
      .split('\0')
      .filter(Boolean)
      .map((entry) => entry.slice(3))
      .sort();
    const trackedDiff = await git(workspace, ['diff', '--binary', 'HEAD', '--']);
    const untracked = (await git(workspace, ['ls-files', '--others', '--exclude-standard', '-z']))
      .split('\0')
      .filter(Boolean)
      .sort();
    const untrackedDiffs = await Promise.all(
      untracked.map((path) => gitNoIndexDiff(workspace, path)),
    );
    return { changedFiles, diff: [trackedDiff, ...untrackedDiffs].join('') };
  }
  async restoreWorkspace(workspace: string): Promise<void> {
    await git(workspace, ['reset', '--hard', 'HEAD']);
    await git(workspace, ['clean', '-fd']);
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
      'Acceptance criteria:',
      ...acceptance.map((item) => `- ${item}`),
      'Modify only files required by the approved scope. Do not commit, merge, deploy, publish, or use shell commands.',
    ].join('\n');
    try {
      const execution = await this.host.execute({
        binary: this.config.binary,
        cwd: snapshot.realPath,
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
      const changes = await this.host.collectChanges(snapshot.realPath);
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
      const metadata = {
        adapterId: this.adapterId,
        repository,
        workspaceRelativeToRoot:
          relative(resolve(this.config.workspaceRoot), resolve(snapshot.realPath)) || '.',
        baseCommitSha: snapshot.headSha,
        changedFiles: normalizedChangedFiles,
        changedFileCount: normalizedChangedFiles.length,
        approvedPaths: allowedPaths,
        diffDigest: digest(changes.diff),
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
      };
      return this.evidence.createTrustedReceipt({
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
      try {
        await this.host.restoreWorkspace(snapshot.realPath);
      } catch {
        throw new ExternalActionAdapterError(
          'ADAPTER_FAILURE',
          'CodeBuddy execution failed and workspace restoration could not be verified',
          false,
        );
      }
      throw error;
    }
  }
}
