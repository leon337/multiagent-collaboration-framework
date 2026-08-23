import { lstat, realpath } from 'node:fs/promises';
import path from 'node:path';

import { CommandRunner, type CommandResult } from './command-runner.js';
import { parseCodexJsonl, type ParsedCodexOutput } from './codex-output.js';
import { isPathInside } from './policy.js';

export interface CodexRunnerOptions {
  readonly codexExecutable: string;
  readonly flockExecutable?: string;
  readonly codexHome: string;
  readonly authorizedWorktreeRoot: string;
  readonly outputSchemaPath: string;
  readonly requireRootOwnedSchema?: boolean;
  readonly timeoutMs: number;
  readonly maximumStdoutBytes: number;
  readonly maximumStderrBytes: number;
  readonly pathEnvironment?: string;
}

export interface CodexRunRequest {
  readonly worktreePath: string;
  readonly prompt: string;
  readonly redactionSecrets?: readonly string[];
  readonly signal?: AbortSignal;
}

export interface CodexRunResult {
  readonly command: CommandResult;
  readonly output: ParsedCodexOutput;
}

const AUTH_FILE_NAME = 'auth.json';
const AUTH_LOCK_FILE_NAME = '.mcf-worker-auth.flock';

function assertOwnerOnlyMode(mode: number, label: string): void {
  if ((mode & 0o077) !== 0) {
    throw new Error(`${label} must have no group or other permissions`);
  }
}

async function assertRealPathWithin(root: string, candidate: string, label: string): Promise<void> {
  if (
    !path.isAbsolute(candidate) ||
    path.resolve(candidate) !== candidate ||
    !isPathInside(root, candidate)
  ) {
    throw new Error(`${label} is outside its authorized root`);
  }
  const metadata = await lstat(candidate);
  if (metadata.isSymbolicLink()) throw new Error(`${label} must not be a symbolic link`);
  if ((await realpath(candidate)) !== candidate) {
    throw new Error(`${label} must not traverse symbolic links`);
  }
}

export class CodexRunner {
  readonly #options: CodexRunnerOptions;

  constructor(options: CodexRunnerOptions) {
    for (const [label, value] of Object.entries({
      codexExecutable: options.codexExecutable,
      flockExecutable: options.flockExecutable ?? '/usr/bin/flock',
      codexHome: options.codexHome,
      authorizedWorktreeRoot: options.authorizedWorktreeRoot,
      outputSchemaPath: options.outputSchemaPath,
    })) {
      if (!path.isAbsolute(value) || path.resolve(value) !== value) {
        throw new Error(`${label} must be a normalized absolute path`);
      }
    }
    this.#options = options;
  }

  async run(request: CodexRunRequest): Promise<CodexRunResult> {
    await this.#assertCredentialStorage();
    await assertRealPathWithin(
      this.#options.authorizedWorktreeRoot,
      request.worktreePath,
      'Codex worktree',
    );
    if (!path.isAbsolute(this.#options.outputSchemaPath) || path.resolve(this.#options.outputSchemaPath) !== this.#options.outputSchemaPath) {
      throw new Error('output schema path must be normalized and absolute');
    }
    const worktreeMetadata = await lstat(request.worktreePath);
    const schemaMetadata = await lstat(this.#options.outputSchemaPath);
    if (!worktreeMetadata.isDirectory()) throw new Error('Codex worktree must be a directory');
    if (!schemaMetadata.isFile()) throw new Error('Codex output schema must be a file');
    if (schemaMetadata.isSymbolicLink() || (await realpath(this.#options.outputSchemaPath)) !== this.#options.outputSchemaPath) {
      throw new Error('Codex output schema must be a real file');
    }
    if ((this.#options.requireRootOwnedSchema ?? true) && schemaMetadata.uid !== 0) {
      throw new Error('Codex output schema must be root-owned');
    }
    if ((schemaMetadata.mode & 0o022) !== 0) {
      throw new Error('Codex output schema must not be group- or world-writable');
    }
    if (Buffer.byteLength(request.prompt) > 1 * 1_024 * 1_024) {
      throw new Error('Codex prompt exceeds the worker limit');
    }

    const codexArgv = [
      '-a',
      'never',
      'exec',
      '--ephemeral',
      '--ignore-user-config',
      '--ignore-rules',
      '--json',
      '--sandbox',
      'workspace-write',
      '-C',
      request.worktreePath,
      '--output-schema',
      this.#options.outputSchemaPath,
      '-',
    ] as const;
    const lockPath = path.join(this.#options.codexHome, AUTH_LOCK_FILE_NAME);
    const argv = [
      '--nonblock',
      '--no-fork',
      lockPath,
      '--',
      this.#options.codexExecutable,
      ...codexArgv,
    ] as const;
    const environment = Object.freeze({
      CODEX_HOME: this.#options.codexHome,
      HOME: this.#options.codexHome,
      PATH: this.#options.pathEnvironment ?? '/usr/local/bin:/usr/bin:/bin',
      LANG: 'C.UTF-8',
      LC_ALL: 'C.UTF-8',
      NO_COLOR: '1',
      GIT_TERMINAL_PROMPT: '0',
    });
    const runner = new CommandRunner({
      defaultTimeoutMs: this.#options.timeoutMs,
      defaultMaxStdoutBytes: this.#options.maximumStdoutBytes,
      defaultMaxStderrBytes: this.#options.maximumStderrBytes,
      maximumStdinBytes: 1 * 1_024 * 1_024,
      allowlist: [
        {
          id: 'codex-exec-worker-flock',
          executable: this.#options.flockExecutable ?? '/usr/bin/flock',
          cwdRoots: [this.#options.authorizedWorktreeRoot],
          allowedEnvironmentKeys: Object.keys(environment),
          validateArgv: (candidate) =>
            candidate.length === argv.length &&
            candidate.every((argument, index) => argument === argv[index]),
        },
      ],
    });

    const command = await runner.run({
        policyId: 'codex-exec-worker-flock',
        executable: this.#options.flockExecutable ?? '/usr/bin/flock',
        argv,
        cwd: request.worktreePath,
        environment,
        stdin: request.prompt,
        ...(request.redactionSecrets === undefined
          ? {}
          : { redactionSecrets: request.redactionSecrets }),
        ...(request.signal === undefined ? {} : { signal: request.signal }),
      });

    return {
      command,
      output: parseCodexJsonl(
        command.stdout,
        request.redactionSecrets === undefined
          ? {}
          : { redactionSecrets: request.redactionSecrets },
      ),
    };
  }

  async #assertCredentialStorage(): Promise<void> {
    const homeMetadata = await lstat(this.#options.codexHome);
    if (!homeMetadata.isDirectory() || homeMetadata.isSymbolicLink()) {
      throw new Error('CODEX_HOME must be a real directory');
    }
    assertOwnerOnlyMode(homeMetadata.mode, 'CODEX_HOME');
    if ((await realpath(this.#options.codexHome)) !== this.#options.codexHome) {
      throw new Error('CODEX_HOME must not traverse symbolic links');
    }

    const authPath = path.join(this.#options.codexHome, AUTH_FILE_NAME);
    const authMetadata = await lstat(authPath);
    if (!authMetadata.isFile() || authMetadata.isSymbolicLink()) {
      throw new Error('Codex auth cache must be a real file');
    }
    assertOwnerOnlyMode(authMetadata.mode, 'Codex auth cache');
    if ((await realpath(authPath)) !== authPath) {
      throw new Error('Codex auth cache must not traverse symbolic links');
    }
  }

}
