import 'reflect-metadata';

import { execFileSync } from 'node:child_process';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { request as httpRequest } from 'node:http';
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
  type Stats,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { createDatabase, type DatabaseHandle, type DatabaseRow } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  MCF_CLOUD_CONTEXT_ENABLE_VALUE,
  MCF_CLOUD_CONTEXT_EXECUTION_DEPENDENCY_PATHS,
  MCF_CLOUD_CONTEXT_SOURCE_PATHS,
  MCF_CLOUD_CONTEXT_VERIFIED_PATHS,
} from './mcf-cloud-context-read.service.js';

const sourceRoot = process.env.MCF_CLOUD_CONTEXT_E2E_SOURCE_ROOT;
const expectedSourceRevision = process.env.MCF_CLOUD_CONTEXT_E2E_SOURCE_REVISION;
const adminDatabaseUrl = process.env.MCF_CLOUD_CONTEXT_E2E_ADMIN_DATABASE_URL;
const configuredPythonExecutable = process.env.MCF_CLOUD_CONTEXT_TEST_PYTHON;
const sharedContextToken = 'mcf-context-token-delivered-to-triview-e2e-20260823';
const cloudIngressToken = 'mcf-cloud-context-dedicated-ingress-e2e-20260823';
const ledgerIngressToken = 'mcf-ledger-dedicated-ingress-e2e-20260823';
const ledgerBearerToken = 'mcf-ledger-provider-bearer-e2e-20260823';
const rateLimitSecret = 'mcf-cloud-context-rate-limit-hmac-e2e-20260823';
const mcfRepositoryRoot = fileURLToPath(new URL('../../../../../../', import.meta.url));

function digest(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function assertRuntimeTreeEntry(path: string, metadata: Stats): void {
  const currentUserId = typeof process.getuid === 'function' ? process.getuid() : undefined;
  if (currentUserId !== undefined && metadata.uid !== currentUserId) {
    throw new Error(`Python runtime entry is not owned by the E2E user: ${path}`);
  }
  if ((metadata.isDirectory() || metadata.isFile()) && (metadata.mode & 0o022) !== 0) {
    throw new Error(`Python runtime entry is group/world writable: ${path}`);
  }
}

function treeFingerprint(root: string, requireOwnedNonWritableTree = false): string {
  const evidence: string[] = [];
  const rootMetadata = lstatSync(root);
  if (requireOwnedNonWritableTree) assertRuntimeTreeEntry(root, rootMetadata);
  evidence.push(`root:${rootMetadata.mode & 0o777}:${rootMetadata.uid}`);
  const visit = (directory: string, relativeDirectory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      if (relativeDirectory === '' && entry.name === '.git') continue;
      const relativePath = join(relativeDirectory, entry.name);
      const path = join(directory, entry.name);
      const metadata = lstatSync(path);
      if (requireOwnedNonWritableTree) assertRuntimeTreeEntry(path, metadata);
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

function requestWithRawHeaders(
  url: string,
  rawHeaders: readonly string[],
): Promise<{ body: string; status: number }> {
  return new Promise((resolveRequest, rejectRequest) => {
    const request = httpRequest(url, { headers: rawHeaders }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.once('error', rejectRequest);
      response.once('end', () => {
        resolveRequest({
          body: Buffer.concat(chunks).toString('utf8'),
          status: response.statusCode ?? 0,
        });
      });
    });
    request.once('error', rejectRequest);
    request.end();
  });
}

function copyProvider(source: string, target: string): void {
  for (const relativePath of MCF_CLOUD_CONTEXT_VERIFIED_PATHS) {
    const destination = join(target, relativePath);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(source, relativePath), destination);
  }
}

function quoteIdentifier(value: string): string {
  if (!/^[a-z0-9_]{1,63}$/u.test(value)) throw new Error('unsafe database identifier');
  return `"${value}"`;
}

async function databaseSnapshot(database: DatabaseHandle): Promise<Record<string, unknown>> {
  const tables = await database.pool.query<{ table_name: string }>(`
    select "table_name"
    from "information_schema"."tables"
    where "table_schema" = 'public'
      and "table_type" = 'BASE TABLE'
      and "table_name" <> 'abuse_rate_limits'
    order by "table_name"
  `);
  const snapshot: Record<string, unknown> = {};
  for (const { table_name: tableName } of tables.rows) {
    const rows = await database.pool.query<{ snapshot: unknown }>(`
      select coalesce(
        jsonb_agg(to_jsonb(row_value) order by to_jsonb(row_value)::text),
        '[]'::jsonb
      ) as "snapshot"
      from ${quoteIdentifier(tableName)} as row_value
    `);
    snapshot[tableName] = rows.rows[0]?.snapshot ?? null;
  }
  return snapshot;
}

interface AbuseCounterRow extends DatabaseRow {
  key_hash: string;
  policy: string;
  request_count: number;
  window_started_at: Date;
  updated_at: Date;
}

const realE2EEnabled =
  sourceRoot !== undefined &&
  expectedSourceRevision !== undefined &&
  adminDatabaseUrl !== undefined &&
  configuredPythonExecutable !== undefined;

describe.skipIf(!realE2EEnabled).sequential('MCF HTTP to real Cloud G2-A local adapter', () => {
  let app: NestFastifyApplication | undefined;
  let baseUrl = '';
  let disposableRoot = '';
  let temporaryRoot = '';
  let sourceFilesystemBefore = '';
  let sourceGitBefore = '';
  let mcfGitBefore = '';
  let disposableBefore = '';
  let pythonExecutable = '';
  let pythonRuntimeRoot = '';
  let pythonRuntimeBefore = '';
  let childrenBefore: string | undefined;
  let adminDatabase: DatabaseHandle | undefined;
  let evidenceDatabase: DatabaseHandle | undefined;
  let databaseName = '';
  let databaseCreated = false;
  let nonAbuseDatabaseBefore: Record<string, unknown> = {};
  const runtimeLogs: string[] = [];
  let infoSpy: ReturnType<typeof vi.spyOn> | undefined;
  let warnSpy: ReturnType<typeof vi.spyOn> | undefined;
  let errorSpy: ReturnType<typeof vi.spyOn> | undefined;
  const priorEnvironment: NodeJS.ProcessEnv = {};
  let environmentIsolated = false;

  beforeAll(async () => {
    expect(process.versions.node).toBe('24.18.0');
    if (
      !sourceRoot ||
      !expectedSourceRevision ||
      !adminDatabaseUrl ||
      !configuredPythonExecutable
    ) {
      throw new Error('real E2E configuration missing');
    }
    pythonExecutable = realpathSync(configuredPythonExecutable);
    pythonRuntimeRoot = dirname(dirname(pythonExecutable));
    const pythonRuntimeConfiguration = join(pythonRuntimeRoot, 'pyvenv.cfg');
    expect(readFileSync(pythonRuntimeConfiguration, 'utf8')).toContain('home =');
    for (const trustedRuntimePath of [
      pythonRuntimeRoot,
      pythonRuntimeConfiguration,
      pythonExecutable,
    ]) {
      assertRuntimeTreeEntry(trustedRuntimePath, lstatSync(trustedRuntimePath));
    }
    pythonRuntimeBefore = treeFingerprint(pythonRuntimeRoot, true);
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
    expect(MCF_CLOUD_CONTEXT_SOURCE_PATHS).toHaveLength(13);
    expect(MCF_CLOUD_CONTEXT_EXECUTION_DEPENDENCY_PATHS).toHaveLength(3);
    expect(MCF_CLOUD_CONTEXT_VERIFIED_PATHS).toHaveLength(16);
    disposableBefore = treeFingerprint(disposableRoot);
    childrenBefore = directChildPids();

    adminDatabase = createDatabase(adminDatabaseUrl);
    await adminDatabase.pool.query('select 1');
    databaseName = `mcf_cloud_e2e_${process.pid}_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
    const preflight = await adminDatabase.pool.query<{ exists: boolean }>(
      'select exists(select 1 from "pg_database" where "datname" = $1) as "exists"',
      [databaseName],
    );
    expect(preflight.rows[0]?.exists).toBe(false);
    await adminDatabase.pool.query(`create database ${quoteIdentifier(databaseName)}`);
    databaseCreated = true;
    const databaseUrl = new URL(adminDatabaseUrl);
    databaseUrl.pathname = `/${databaseName}`;
    const disposableDatabaseUrl = databaseUrl.toString();
    execFileSync(
      process.execPath,
      [join(mcfRepositoryRoot, 'apps/rede-social-agentes/packages/database/scripts/migrate.mjs')],
      {
        cwd: join(mcfRepositoryRoot, 'apps/rede-social-agentes'),
        env: {
          DATABASE_URL: disposableDatabaseUrl,
          MIGRATION_DATABASE_URL: disposableDatabaseUrl,
        },
        stdio: 'pipe',
      },
    );
    evidenceDatabase = createDatabase(disposableDatabaseUrl);
    await evidenceDatabase.pool.query('select 1');

    const expectedVerifiedFileSha256 = Object.fromEntries(
      MCF_CLOUD_CONTEXT_VERIFIED_PATHS.map((relativePath) => [
        relativePath,
        digest(readFileSync(join(disposableRoot, relativePath))),
      ]),
    );
    Object.assign(priorEnvironment, process.env);
    for (const name of Object.keys(process.env)) {
      delete process.env[name];
    }
    const isolatedHome = join(temporaryRoot, 'isolated-home');
    mkdirSync(isolatedHome, { recursive: true });
    Object.assign(process.env, {
      ALLOWED_ORIGINS: 'http://127.0.0.1:5173',
      DATABASE_URL: disposableDatabaseUrl,
      HOME: isolatedHome,
      MCF_CLOUD_CONTEXT_INGRESS_TOKEN: cloudIngressToken,
      MCF_CLOUD_CONTEXT_READ_CONFIG_JSON: JSON.stringify({
        enable: MCF_CLOUD_CONTEXT_ENABLE_VALUE,
        repository_root: disposableRoot,
        python_executable: pythonExecutable,
        python_executable_sha256: digest(readFileSync(pythonExecutable)),
        expected_verified_file_sha256: expectedVerifiedFileSha256,
      }),
      MCF_COGNITIVE_LEDGER_BEARER_TOKEN: ledgerBearerToken,
      MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: ledgerIngressToken,
      MCF_CONTEXT_CONFIG_JSON: '',
      MCF_CONTEXT_READ_TOKEN: sharedContextToken,
      MCF_RECEIPT_SECRET: 'mcf-cloud-context-receipt-secret-e2e-20260823',
      MCF_RUNTIME_TOKEN: 'mcf-cloud-context-runtime-token-e2e-20260823',
      NODE_ENV: 'test',
      RATE_LIMIT_KEY_SECRET: rateLimitSecret,
    });
    environmentIsolated = true;
    expect(Object.keys(process.env).sort()).toEqual(
      [
        'ALLOWED_ORIGINS',
        'DATABASE_URL',
        'HOME',
        'MCF_CLOUD_CONTEXT_INGRESS_TOKEN',
        'MCF_CLOUD_CONTEXT_READ_CONFIG_JSON',
        'MCF_COGNITIVE_LEDGER_BEARER_TOKEN',
        'MCF_COGNITIVE_LEDGER_INGRESS_TOKEN',
        'MCF_CONTEXT_CONFIG_JSON',
        'MCF_CONTEXT_READ_TOKEN',
        'MCF_RECEIPT_SECRET',
        'MCF_RUNTIME_TOKEN',
        'NODE_ENV',
        'RATE_LIMIT_KEY_SECRET',
      ].sort(),
    );
    const captureLog = (...values: unknown[]): void => {
      runtimeLogs.push(
        values
          .map((value) => (typeof value === 'string' ? value : JSON.stringify(value)))
          .join(' '),
      );
    };
    infoSpy = vi.spyOn(console, 'info').mockImplementation(captureLog);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(captureLog);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(captureLog);
    const { AppModule } = await import('../app.module.js');

    app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({ logger: false }),
      { logger: false },
    );
    await app.listen({ host: '127.0.0.1', port: 0 });
    const address = app.getHttpServer().address();
    if (address === null || typeof address === 'string') throw new Error('E2E port unavailable');
    baseUrl = `http://127.0.0.1:${address.port}`;
    nonAbuseDatabaseBefore = await databaseSnapshot(evidenceDatabase);
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
      if (pythonRuntimeRoot !== '') {
        expect(treeFingerprint(pythonRuntimeRoot, true)).toBe(pythonRuntimeBefore);
      }
      if (childrenBefore !== undefined) expect(directChildPids()).toBe(childrenBefore);
    } finally {
      try {
        if (evidenceDatabase !== undefined) await evidenceDatabase.pool.end();
      } finally {
        try {
          if (databaseCreated && adminDatabase !== undefined) {
            try {
              await adminDatabase.pool.query(`drop database ${quoteIdentifier(databaseName)}`);
            } catch {
              await adminDatabase.pool.query(
                `select pg_terminate_backend("pid")
                 from "pg_stat_activity"
                 where "datname" = $1 and "pid" <> pg_backend_pid()`,
                [databaseName],
              );
              await adminDatabase.pool.query(`drop database ${quoteIdentifier(databaseName)}`);
            }
            const postflight = await adminDatabase.pool.query<{ exists: boolean }>(
              'select exists(select 1 from "pg_database" where "datname" = $1) as "exists"',
              [databaseName],
            );
            expect(postflight.rows[0]?.exists).toBe(false);
          }
        } finally {
          try {
            if (adminDatabase !== undefined) await adminDatabase.pool.end();
          } finally {
            infoSpy?.mockRestore();
            warnSpy?.mockRestore();
            errorSpy?.mockRestore();
            if (environmentIsolated) {
              for (const name of Object.keys(process.env)) delete process.env[name];
              Object.assign(process.env, priorEnvironment);
            }
            if (temporaryRoot !== '') rmSync(temporaryRoot, { recursive: true, force: true });
          }
        }
      }
    }
  }, 60_000);

  it('fails closed for authentication, query/path injection and non-GET methods', async () => {
    const url = `${baseUrl}/v1/mcf/context/cloud/g2a`;
    const unauthenticated = await fetch(url);
    expect(unauthenticated.status).toBe(401);

    const triViewTokenAtItsOwnHeader = await fetch(url, {
      headers: { 'x-mcf-context-token': sharedContextToken },
    });
    expect(triViewTokenAtItsOwnHeader.status).toBe(401);
    const triViewTokenAtCloudHeader = await fetch(url, {
      headers: { 'x-mcf-cloud-context-token': sharedContextToken },
    });
    expect(triViewTokenAtCloudHeader.status).toBe(401);

    for (const ledgerToken of [ledgerIngressToken, ledgerBearerToken]) {
      const ledgerTokenAtCloudHeader = await fetch(url, {
        headers: { 'x-mcf-cloud-context-token': ledgerToken },
      });
      expect(ledgerTokenAtCloudHeader.status).toBe(401);
    }

    const duplicatedCloudHeader = await requestWithRawHeaders(url, [
      'x-mcf-cloud-context-token',
      cloudIngressToken,
      'x-mcf-cloud-context-token',
      cloudIngressToken,
    ]);
    expect([400, 401], duplicatedCloudHeader.body).toContain(duplicatedCloudHeader.status);

    const injected = await fetch(
      `${url}?repository_root=${encodeURIComponent('/etc')}&operation=workspace.read`,
      { headers: { 'x-mcf-cloud-context-token': cloudIngressToken } },
    );
    expect(injected.status).toBe(400);
    expect(await injected.text()).not.toContain('/etc');

    const wrongMethod = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mcf-cloud-context-token': cloudIngressToken,
      },
      body: JSON.stringify({ repository_root: '/etc', command: 'sh' }),
    });
    expect(wrongMethod.status).toBe(404);
    expect(directChildPids()).toBe(childrenBefore);
  });

  it('performs the real read and exposes no configuration, path or secret', async () => {
    const response = await fetch(`${baseUrl}/v1/mcf/context/cloud/g2a`, {
      headers: {
        'x-mcf-cloud-context-token': cloudIngressToken,
        'x-mcf-cloud-root': '/etc',
        'x-mcf-cloud-command': 'arbitrary-command',
      },
    });
    const responseBody = await response.text();
    expect(response.status, responseBody).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-ratelimit-limit')).toBe('10');
    expect(response.headers.get('x-ratelimit-remaining')).toBe('3');
    const body = JSON.parse(responseBody) as Record<string, unknown>;
    expect(body).toMatchObject({
      schema_version: 1,
      read_only: true,
      material_action: false,
      provider_payload_persisted_by_mcf: false,
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
      process.env.HOME,
      sharedContextToken,
      cloudIngressToken,
      ledgerIngressToken,
      ledgerBearerToken,
      '/home/',
      'arbitrary-command',
    ]) {
      if (forbidden !== undefined) expect(rendered).not.toContain(forbidden);
    }
    expect(treeFingerprint(disposableRoot)).toBe(disposableBefore);
    expect(directChildPids()).toBe(childrenBefore);
  }, 60_000);

  it('persists only the opaque AppModule abuse counter, never the provider payload', async () => {
    if (evidenceDatabase === undefined) throw new Error('evidence database unavailable');
    expect(await databaseSnapshot(evidenceDatabase)).toEqual(nonAbuseDatabaseBefore);

    const columns = await evidenceDatabase.pool.query<{ column_name: string }>(`
      select "column_name"
      from "information_schema"."columns"
      where "table_schema" = 'public' and "table_name" = 'abuse_rate_limits'
      order by "ordinal_position"
    `);
    expect(columns.rows.map(({ column_name: columnName }) => columnName)).toEqual([
      'key_hash',
      'policy',
      'window_started_at',
      'request_count',
      'updated_at',
    ]);

    const counters = await evidenceDatabase.pool.query<AbuseCounterRow>(`
      select "key_hash", "policy", "window_started_at", "request_count", "updated_at"
      from "abuse_rate_limits"
      order by "policy", "window_started_at"
    `);
    expect(counters.rows).toHaveLength(1);
    expect(counters.rows[0]).toMatchObject({
      key_hash: createHmac('sha256', rateLimitSecret).update('ip:127.0.0.1').digest('hex'),
      policy: 'mcf-cloud-context-local-read',
      request_count: 7,
    });
    const renderedCounters = JSON.stringify(counters.rows);
    const renderedLogs = runtimeLogs.join('\n');
    for (const forbidden of [
      sharedContextToken,
      cloudIngressToken,
      ledgerIngressToken,
      ledgerBearerToken,
      disposableRoot,
      sourceRoot,
      '/etc',
      'context.get',
      'provider_response',
      'arbitrary-command',
    ]) {
      if (forbidden !== undefined) {
        expect(renderedCounters).not.toContain(forbidden);
        expect(renderedLogs).not.toContain(forbidden);
      }
    }
  });
});
