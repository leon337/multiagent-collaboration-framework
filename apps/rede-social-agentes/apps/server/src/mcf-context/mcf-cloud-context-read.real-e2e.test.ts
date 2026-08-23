import 'reflect-metadata';

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { McfContextModule } from './mcf-context.module.js';
import {
  MCF_CLOUD_CONTEXT_ENABLE_VALUE,
  MCF_CLOUD_CONTEXT_SOURCE_PATHS,
} from './mcf-cloud-context-read.service.js';

const sourceRoot = process.env.MCF_CLOUD_CONTEXT_E2E_SOURCE_ROOT;
const expectedSourceRevision = process.env.MCF_CLOUD_CONTEXT_E2E_SOURCE_REVISION;
const pythonExecutable = realpathSync(
  process.env.MCF_CLOUD_CONTEXT_TEST_PYTHON ?? '/usr/bin/python3',
);
const contextToken = 'mcf-cloud-context-real-e2e-token-20260823';
const mcfRepositoryRoot = fileURLToPath(new URL('../../../../../../', import.meta.url));
const extraProviderPaths = [
  'control_plane/__init__.py',
  'control_plane/g2a/__init__.py',
  'scripts/yaml_strict.py',
] as const;

function digest(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function treeFingerprint(root: string): string {
  const evidence: string[] = [];
  const visit = (directory: string, relativeDirectory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      if (relativeDirectory === '' && entry.name === '.git') continue;
      const relativePath = join(relativeDirectory, entry.name);
      const path = join(directory, entry.name);
      const metadata = lstatSync(path);
      if (entry.isDirectory()) {
        evidence.push(`directory:${relativePath}:${metadata.mode & 0o777}`);
        visit(path, relativePath);
      } else if (entry.isSymbolicLink()) {
        evidence.push(`symlink:${relativePath}:${readlinkSync(path)}`);
      } else if (entry.isFile()) {
        evidence.push(
          `file:${relativePath}:${metadata.mode & 0o777}:${digest(readFileSync(path))}`,
        );
      } else {
        evidence.push(`other:${relativePath}:${metadata.mode}`);
      }
    }
  };
  visit(root, '');
  return digest(evidence.join('\n'));
}

function gitFingerprint(root: string): string {
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root });
  const status = execFileSync(
    'git',
    ['status', '--porcelain=v2', '--branch', '-z', '--untracked-files=all'],
    { cwd: root },
  );
  return digest(Buffer.concat([head, status]));
}

function directChildPids(): string {
  try {
    return readFileSync(`/proc/${process.pid}/task/${process.pid}/children`, 'utf8').trim();
  } catch {
    return 'PROC_NOT_AVAILABLE';
  }
}

function copyProvider(source: string, target: string): void {
  for (const relativePath of [...MCF_CLOUD_CONTEXT_SOURCE_PATHS, ...extraProviderPaths]) {
    const destination = join(target, relativePath);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(source, relativePath), destination);
  }
}

const realE2EEnabled = sourceRoot !== undefined && expectedSourceRevision !== undefined;

describe.skipIf(!realE2EEnabled).sequential('MCF HTTP to real Cloud G2-A local adapter', () => {
  let app: NestFastifyApplication | undefined;
  let baseUrl = '';
  let disposableRoot = '';
  let temporaryRoot = '';
  let sourceFilesystemBefore = '';
  let sourceGitBefore = '';
  let mcfGitBefore = '';
  let disposableBefore = '';
  let childrenBefore = '';
  const priorEnvironment: Record<string, string | undefined> = {};

  beforeAll(async () => {
    if (!sourceRoot || !expectedSourceRevision) throw new Error('real E2E configuration missing');
    const canonicalSourceRoot = realpathSync(sourceRoot);
    const actualRevision = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: canonicalSourceRoot,
      encoding: 'utf8',
    }).trim();
    expect(actualRevision).toBe(expectedSourceRevision);

    sourceFilesystemBefore = treeFingerprint(canonicalSourceRoot);
    sourceGitBefore = gitFingerprint(canonicalSourceRoot);
    mcfGitBefore = gitFingerprint(mcfRepositoryRoot);
    temporaryRoot = mkdtempSync(join(tmpdir(), 'mcf-cloud-real-e2e-'));
    disposableRoot = join(temporaryRoot, 'workspaces/leon337/g2a-smoke/dev');
    copyProvider(canonicalSourceRoot, disposableRoot);
    disposableBefore = treeFingerprint(disposableRoot);
    childrenBefore = directChildPids();

    const expectedSourceSha256 = Object.fromEntries(
      MCF_CLOUD_CONTEXT_SOURCE_PATHS.map((relativePath) => [
        relativePath,
        digest(readFileSync(join(disposableRoot, relativePath))),
      ]),
    );
    for (const name of ['MCF_CONTEXT_READ_TOKEN', 'MCF_CLOUD_CONTEXT_READ_CONFIG_JSON']) {
      priorEnvironment[name] = process.env[name];
    }
    process.env.MCF_CONTEXT_READ_TOKEN = contextToken;
    process.env.MCF_CLOUD_CONTEXT_READ_CONFIG_JSON = JSON.stringify({
      enable: MCF_CLOUD_CONTEXT_ENABLE_VALUE,
      repository_root: disposableRoot,
      python_executable: pythonExecutable,
      python_executable_sha256: digest(readFileSync(pythonExecutable)),
      expected_source_sha256: expectedSourceSha256,
    });

    app = await NestFactory.create<NestFastifyApplication>(
      McfContextModule,
      new FastifyAdapter({ logger: false }),
      { logger: false },
    );
    await app.listen({ host: '127.0.0.1', port: 0 });
    const address = app.getHttpServer().address();
    if (address === null || typeof address === 'string') throw new Error('E2E port unavailable');
    baseUrl = `http://127.0.0.1:${address.port}`;
  }, 60_000);

  afterAll(async () => {
    try {
      const url = `${baseUrl}/v1/mcf/context/cloud/g2a`;
      if (app !== undefined) await app.close();
      if (baseUrl !== '') await expect(fetch(url)).rejects.toThrow();

      if (sourceRoot && sourceFilesystemBefore !== '') {
        const canonicalSourceRoot = realpathSync(sourceRoot);
        expect(treeFingerprint(canonicalSourceRoot)).toBe(sourceFilesystemBefore);
        expect(gitFingerprint(canonicalSourceRoot)).toBe(sourceGitBefore);
      }
      if (mcfGitBefore !== '') expect(gitFingerprint(mcfRepositoryRoot)).toBe(mcfGitBefore);
      if (disposableRoot !== '') expect(treeFingerprint(disposableRoot)).toBe(disposableBefore);
      if (childrenBefore !== '') expect(directChildPids()).toBe(childrenBefore);
    } finally {
      for (const [name, value] of Object.entries(priorEnvironment)) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
      if (temporaryRoot !== '') rmSync(temporaryRoot, { recursive: true, force: true });
    }
  }, 60_000);

  it('fails closed for authentication, query/path injection and non-GET methods', async () => {
    const url = `${baseUrl}/v1/mcf/context/cloud/g2a`;
    const unauthenticated = await fetch(url);
    expect(unauthenticated.status).toBe(401);

    const injected = await fetch(
      `${url}?repository_root=${encodeURIComponent('/etc')}&operation=workspace.read`,
      { headers: { 'x-mcf-context-token': contextToken } },
    );
    expect(injected.status).toBe(400);
    expect(await injected.text()).not.toContain('/etc');

    const wrongMethod = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mcf-context-token': contextToken,
      },
      body: JSON.stringify({ repository_root: '/etc', command: 'sh' }),
    });
    expect(wrongMethod.status).toBe(404);
    expect(directChildPids()).toBe(childrenBefore);
  });

  it('performs the real read and exposes no configuration, path or secret', async () => {
    const response = await fetch(`${baseUrl}/v1/mcf/context/cloud/g2a`, {
      headers: {
        'x-mcf-context-token': contextToken,
        'x-mcf-cloud-root': '/etc',
        'x-mcf-cloud-command': 'arbitrary-command',
      },
    });
    const responseBody = await response.text();
    expect(response.status, responseBody).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const body = JSON.parse(responseBody) as Record<string, unknown>;
    expect(body).toMatchObject({
      schema_version: 1,
      read_only: true,
      material_action: false,
      persisted_by_mcf: false,
      evidence_only: true,
      provider_response: {
        protocol: 'MCF_CLOUD_CONTEXT_READ_RESULT_V1',
        project_id: 'cloud-infrastructure',
        operation: 'context.get',
        status: 'PASS',
        freshness: {
          operational_state: 'LIVE_REQUIRED',
          workspace_observation: 'LIVE_LOCAL_DISPOSABLE',
          source_mode: 'READ_AT_REQUEST_TIME',
        },
      },
    });
    const rendered = JSON.stringify(body);
    for (const forbidden of [
      disposableRoot,
      sourceRoot,
      pythonExecutable,
      contextToken,
      '/home/',
      'arbitrary-command',
    ]) {
      if (forbidden !== undefined) expect(rendered).not.toContain(forbidden);
    }
    expect(treeFingerprint(disposableRoot)).toBe(disposableBefore);
    expect(directChildPids()).toBe(childrenBefore);
  }, 60_000);
});
