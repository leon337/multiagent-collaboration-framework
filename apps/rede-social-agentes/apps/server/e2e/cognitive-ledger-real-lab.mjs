/* global clearTimeout, console, fetch, Headers, setTimeout, URL */

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { connect as connectTcp } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { exportJWK, generateKeyPair, importJWK, SignJWT } from 'jose';
import pg from 'pg';

const { Client: PostgresClient } = pg;
const PROVIDER_REVISION = 'b882d2808af74858a6ba351fb755bb3843e33ab2';
const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = resolve(serverRoot, '../..');
const mcfRepositoryRoot = resolve(serverRoot, '../../../..');
const providerRootValue = process.env.COGNITIVE_LEDGER_REPOSITORY_ROOT;
const adminDatabaseUrlValue = process.env.MCF_COGNITIVE_LEDGER_MCF_DB_ADMIN_URL;
const pnpmCliValue = process.env.MCF_COGNITIVE_LEDGER_PNPM_CLI ?? process.env.npm_execpath;

if (!providerRootValue) {
  throw new Error('Defina COGNITIVE_LEDGER_REPOSITORY_ROOT para o provider fixo do laboratório.');
}
if (process.env.MCF_COGNITIVE_LEDGER_LAB_CONFIRM !== '1') {
  throw new Error('Defina MCF_COGNITIVE_LEDGER_LAB_CONFIRM=1 para o E2E descartável.');
}
if (process.env.MCF_COGNITIVE_LEDGER_MCF_DB_CONFIRM !== '1') {
  throw new Error(
    'Defina MCF_COGNITIVE_LEDGER_MCF_DB_CONFIRM=1 para criar e apagar só o banco MCF único.',
  );
}
if (!adminDatabaseUrlValue) {
  throw new Error(
    'Defina MCF_COGNITIVE_LEDGER_MCF_DB_ADMIN_URL para o PostgreSQL local compartilhado.',
  );
}
if (!pnpmCliValue || !existsSync(pnpmCliValue) || !pnpmCliValue.endsWith('pnpm.cjs')) {
  throw new Error('Informe o pnpm.cjs confiável em MCF_COGNITIVE_LEDGER_PNPM_CLI.');
}
assert.equal(process.versions.node.split('.')[0], '24', 'O laboratório exige Node.js 24.');

const providerRoot = resolve(providerRootValue);
const pnpmCli = resolve(pnpmCliValue);
const supabaseCli = join(providerRoot, 'tools/lab/node_modules/.bin/supabase');
const mcpEntry = join(providerRoot, 'mcp/src/servidor.mjs');
const providerConfigPath = join(providerRoot, 'supabase/config.toml');
const serverEntry = join(serverRoot, 'dist/main.js');
const migrationEntry = join(workspaceRoot, 'packages/database/scripts/migrate.mjs');
const ownerId = '00000000-0000-0000-0000-000000000001';
const clientId = 'mcf-lab-readonly';
const supabaseBaseUrl = 'http://localhost:54331';
const issuer = `${supabaseBaseUrl}/auth/v1`;
const mcpBaseUrl = 'http://127.0.0.1:33100';
const mcpProxyBaseUrl = 'http://127.0.0.1:33101';
const mcfBaseUrl = 'http://127.0.0.1:33110';
const contextIngressToken = 'mcf-triview-real-lab-ingress-token-000000000001';
const ledgerIngressToken = 'mcf-ledger-real-lab-ingress-token-000000000002';
const rateLimitSecret = 'mcf-ledger-real-lab-rate-limit-secret-000000000003';
const receiptSecret = 'mcf-ledger-real-lab-receipt-secret-000000000004';
const runtimeToken = 'mcf-ledger-real-lab-runtime-token-000000000005';
const mcfDatabaseName = `mcf_ledger_lab_${randomBytes(8).toString('hex')}`;
const excludedServices = [
  'realtime',
  'storage-api',
  'imgproxy',
  'mailpit',
  'postgres-meta',
  'studio',
  'logflare',
  'vector',
  'supavisor',
].join(',');
const inheritedChildKeys = [
  'PATH',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'TZ',
  'DOCKER_HOST',
  'DOCKER_CONTEXT',
  'SSL_CERT_FILE',
  'SSL_CERT_DIR',
  'NODE_EXTRA_CA_CERTS',
];
const requiredMcfTables = [
  'mcf_events',
  'mcf_external_action_attempts',
  'mcf_handoffs',
  'mcf_missions',
  'mcf_phases',
  'mcf_tool_receipts',
];

const adminDatabaseUrl = new URL(adminDatabaseUrlValue);
assert.equal(adminDatabaseUrl.protocol, 'postgresql:', 'Admin DB deve usar postgresql://.');
assert.equal(adminDatabaseUrl.hostname, '127.0.0.1', 'Admin DB deve ser loopback literal.');
assert.equal(adminDatabaseUrl.port, '5432', 'Admin DB deve usar a porta compartilhada 5432.');
assert.equal(adminDatabaseUrl.pathname, '/postgres', 'Admin DB deve apontar para /postgres.');
assert.equal(adminDatabaseUrl.search, '', 'Admin DB não aceita query string.');
assert.equal(adminDatabaseUrl.hash, '', 'Admin DB não aceita fragmento.');
const mcfDatabaseUrl = new URL(adminDatabaseUrl);
mcfDatabaseUrl.pathname = `/${mcfDatabaseName}`;

let laboratoryRoot;
let temporaryDirectory;
let signingKeysPath;
let functionEnvironmentPath;
let childEnvironment;
let initialMcfRevision;
let edgeRuntime;
let mcpRuntime;
let mcfRuntime;
let mcpProxy;
let mcpProxyRequests = 0;
let supabaseOwned = false;
let mcfDatabaseCreated = false;
let cleanupCompleted = false;
let bearerToken;
const sensitiveValues = [
  contextIngressToken,
  ledgerIngressToken,
  rateLimitSecret,
  receiptSecret,
  runtimeToken,
];

function prepareLaboratory() {
  laboratoryRoot = mkdtempSync(join(tmpdir(), 'mcf-cognitive-ledger-lab-'));
  const home = join(laboratoryRoot, 'home');
  const xdgConfig = join(laboratoryRoot, 'xdg-config');
  const xdgCache = join(laboratoryRoot, 'xdg-cache');
  const xdgData = join(laboratoryRoot, 'xdg-data');
  for (const directory of [home, xdgConfig, xdgCache, xdgData]) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
  }
  childEnvironment = {
    HOME: home,
    XDG_CONFIG_HOME: xdgConfig,
    XDG_CACHE_HOME: xdgCache,
    XDG_DATA_HOME: xdgData,
  };
  for (const key of inheritedChildKeys) {
    const value = process.env[key];
    if (value !== undefined) childEnvironment[key] = value;
  }
}

function execute(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? providerRoot,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    timeout: options.timeout ?? 300_000,
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
    env: options.env ?? childEnvironment,
  });
}

function executePnpm(args) {
  return execute(process.execPath, [pnpmCli, '--dir', workspaceRoot, ...args], {
    cwd: workspaceRoot,
    timeout: 300_000,
  });
}

function assertRepositoryState() {
  assert.equal(
    execute('git', ['rev-parse', 'HEAD'], { cwd: providerRoot }).trim(),
    PROVIDER_REVISION,
    'Provider Ledger divergiu do commit fixo.',
  );
  assert.equal(
    execute('git', ['status', '--porcelain'], { cwd: providerRoot }).trim(),
    '',
    'Provider Ledger deve permanecer limpo.',
  );
  assert.equal(
    execute('git', ['rev-parse', 'HEAD'], { cwd: mcfRepositoryRoot }).trim(),
    initialMcfRevision,
    'HEAD MCF mudou durante o laboratório.',
  );
  assert.equal(
    execute('git', ['status', '--porcelain'], { cwd: mcfRepositoryRoot }).trim(),
    '',
    'Worktree MCF deve permanecer limpa.',
  );
}

function prepareDisposableSupabaseProject() {
  const destination = join(laboratoryRoot, 'supabase');
  mkdirSync(destination, { recursive: true, mode: 0o700 });
  const uniqueProjectId = `mcf-ledger-${randomBytes(8).toString('hex')}`;
  const config = readFileSync(providerConfigPath, 'utf8')
    .replace('project_id = "cognitive-ledger-lab"', `project_id = "${uniqueProjectId}"`)
    .replace(
      'jwt_issuer = "http://localhost:54331/auth/v1"',
      [
        'jwt_issuer = "http://localhost:54331/auth/v1"',
        'signing_keys_path = "./.temp/lab-signing-keys.json"',
      ].join('\n'),
    );
  assert.ok(config.includes(`project_id = "${uniqueProjectId}"`));
  assert.ok(!config.includes('project_id = "cognitive-ledger-lab"'));
  writeFileSync(join(destination, 'config.toml'), config, { mode: 0o600 });
  for (const directory of ['functions', 'migrations']) {
    symlinkSync(join(providerRoot, 'supabase', directory), join(destination, directory), 'dir');
  }
  symlinkSync(join(providerRoot, 'supabase/seed.sql'), join(destination, 'seed.sql'), 'file');
  temporaryDirectory = join(destination, '.temp');
  signingKeysPath = join(temporaryDirectory, 'lab-signing-keys.json');
  functionEnvironmentPath = join(temporaryDirectory, 'lab-functions.env');
}

function executeSupabase(args, options = {}) {
  return execute(supabaseCli, ['--workdir', laboratoryRoot, ...args], options);
}

async function createLabSigningKey() {
  mkdirSync(temporaryDirectory, { recursive: true, mode: 0o700 });
  const { privateKey } = await generateKeyPair('ES256', { extractable: true });
  const jwk = await exportJWK(privateKey);
  const kid = randomUUID();
  const key = { ...jwk, kid, use: 'sig', key_ops: ['sign'], alg: 'ES256', ext: true };
  writeFileSync(signingKeysPath, `${JSON.stringify([key])}\n`, { mode: 0o600 });
  return { key, kid };
}

function supabaseStatus() {
  return JSON.parse(executeSupabase(['status', '-o', 'json']));
}

async function createSyntheticUser(status) {
  const response = await fetch(`${status.API_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${status.SERVICE_ROLE_KEY}`,
      apikey: status.ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: ownerId,
      email: 'owner-lab@cognitive-ledger.invalid',
      password: randomBytes(24).toString('base64url'),
      email_confirm: true,
      user_metadata: { sintetico: true },
      app_metadata: { provider: 'email', providers: ['email'], sintetico: true },
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200, 'Falha ao criar identidade sintética no Auth local.');
  assert.equal(body.id, ownerId);
}

async function issueSyntheticJwt(key, kid) {
  const privateKey = await importJWK(key, 'ES256');
  return new SignJWT({
    role: 'authenticated',
    email: 'owner-lab@cognitive-ledger.invalid',
    client_id: clientId,
  })
    .setProtectedHeader({ alg: 'ES256', kid, typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(issuer)
    .setAudience('authenticated')
    .setSubject(ownerId)
    .setExpirationTime('30m')
    .sign(privateKey);
}

async function verifyJwtAtLocalAuth(status, token) {
  const response = await fetch(`${status.API_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: status.ANON_KEY },
  });
  const body = await response.json();
  assert.equal(response.status, 200, 'JWT sintético foi recusado pelo Auth local.');
  assert.equal(body.id, ownerId);
}

function startProcess(command, args, options = {}) {
  const processHandle = spawn(command, args, {
    cwd: options.cwd ?? providerRoot,
    env: options.env ?? childEnvironment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  for (const stream of [processHandle.stdout, processHandle.stderr]) {
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
      output = `${output}${chunk}`.slice(-16_384);
    });
  }
  return { processHandle, output: () => output };
}

async function waitForHttp(url, accept, processHandle, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (processHandle?.exitCode !== null) {
      throw new Error(`Processo local encerrou antes de ficar pronto: ${processHandle.exitCode}`);
    }
    try {
      const response = await fetch(url);
      if (accept(response)) return;
    } catch {
      // Expected while an owned local service is starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Timeout aguardando serviço local em ${new URL(url).origin}.`);
}

async function stopProcess(processHandle) {
  if (!processHandle || processHandle.exitCode !== null || processHandle.signalCode !== null)
    return;
  processHandle.kill('SIGTERM');
  await Promise.race([
    new Promise((resolveExit) => processHandle.once('exit', resolveExit)),
    new Promise((resolveDelay) => setTimeout(resolveDelay, 5_000)),
  ]);
  if (processHandle.exitCode === null && processHandle.signalCode === null) {
    processHandle.kill('SIGKILL');
    await Promise.race([
      new Promise((resolveExit) => processHandle.once('exit', resolveExit)),
      new Promise((resolveDelay) => setTimeout(resolveDelay, 5_000)),
    ]);
  }
}

async function assertTcpPortClosed(port) {
  await new Promise((resolveClosed, rejectOpen) => {
    const socket = connectTcp({ host: '127.0.0.1', port });
    const timeout = setTimeout(() => {
      socket.destroy();
      rejectOpen(new Error(`Timeout verificando a porta local ${port}.`));
    }, 2_000);
    socket.once('connect', () => {
      clearTimeout(timeout);
      socket.destroy();
      rejectOpen(new Error(`Porta local ${port} está ocupada.`));
    });
    socket.once('error', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolveClosed();
    });
  });
}

function assertProcessStopped(runtime, name) {
  assert.ok(
    runtime &&
      (runtime.processHandle.exitCode !== null || runtime.processHandle.signalCode !== null),
    `${name} permaneceu ativo após o laboratório.`,
  );
}

async function createMcfDatabase() {
  const client = new PostgresClient({ connectionString: adminDatabaseUrl.href });
  await client.connect();
  try {
    const existing = await client.query('select 1 from pg_database where datname = $1', [
      mcfDatabaseName,
    ]);
    assert.equal(existing.rowCount, 0, 'O banco MCF único já existia antes do laboratório.');
    await client.query(`create database "${mcfDatabaseName}"`);
    mcfDatabaseCreated = true;
  } finally {
    await client.end();
  }
}

async function dropMcfDatabase() {
  if (!mcfDatabaseCreated) return;
  const client = new PostgresClient({ connectionString: adminDatabaseUrl.href });
  await client.connect();
  try {
    await client.query(
      'select pg_terminate_backend(pid) from pg_stat_activity where datname = $1 and pid <> pg_backend_pid()',
      [mcfDatabaseName],
    );
    await client.query(`drop database "${mcfDatabaseName}"`);
    const remaining = await client.query('select 1 from pg_database where datname = $1', [
      mcfDatabaseName,
    ]);
    assert.equal(remaining.rowCount, 0, 'O banco MCF único não foi apagado.');
    mcfDatabaseCreated = false;
  } finally {
    await client.end();
  }
}

function quotedIdentifier(value) {
  assert.match(value, /^[a-z_][a-z0-9_]*$/u);
  return `"${value}"`;
}

async function withMcfDatabase(work) {
  const client = new PostgresClient({ connectionString: mcfDatabaseUrl.href });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

async function mcfDataSnapshot() {
  return withMcfDatabase(async (client) => {
    const tablesResult = await client.query(
      "select tablename from pg_tables where schemaname = 'public' order by tablename",
    );
    const tables = tablesResult.rows.map(({ tablename }) => tablename);
    for (const required of requiredMcfTables)
      assert.ok(tables.includes(required), `${required} ausente.`);
    const snapshot = {};
    for (const table of tables.filter(
      (name) => name !== '_rsa_migrations' && name !== 'abuse_rate_limits',
    )) {
      const identifier = quotedIdentifier(table);
      const result = await client.query(`
        select count(*)::integer as count,
          md5(coalesce(string_agg(row_to_json(t)::text, '|' order by row_to_json(t)::text), ''))
            as fingerprint
        from public.${identifier} t
      `);
      snapshot[table] = result.rows[0];
    }
    return snapshot;
  });
}

async function assertMcfDatabaseContainsNo(values) {
  await withMcfDatabase(async (client) => {
    const tables = (
      await client.query("select tablename from pg_tables where schemaname = 'public'")
    ).rows.map(({ tablename }) => tablename);
    for (const table of tables) {
      const identifier = quotedIdentifier(table);
      for (const value of values) {
        if (!value) continue;
        const result = await client.query(
          `select count(*)::integer as matches
             from public.${identifier} t
            where position($1 in row_to_json(t)::text) > 0`,
          [value],
        );
        assert.equal(result.rows[0].matches, 0, `Valor efêmero persistiu em ${table}.`);
      }
    }
  });
}

function queryLedgerDatabase(databaseUrl, sql) {
  return execute('psql', [databaseUrl, '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    timeout: 30_000,
  }).trim();
}

function eventsFingerprint(databaseUrl) {
  return queryLedgerDatabase(
    databaseUrl,
    "select md5(string_agg(row_to_json(e)::text, '|' order by e.id)) from public.eventos_cognitivos e",
  );
}

function ledgerDatabaseCounts(databaseUrl) {
  const row = queryLedgerDatabase(
    databaseUrl,
    [
      'select count(*)',
      "  || ',' || count(*) filter (where embedding is not null)",
      "  || ',' || (select count(*) from public.auditoria_acessos)",
      'from public.eventos_cognitivos',
    ].join('\n'),
  );
  return row.split(',').map(Number);
}

function ledgerAuditRows(databaseUrl) {
  const json = queryLedgerDatabase(
    databaseUrl,
    `
      select coalesce(json_agg(json_build_object(
        'operacao', operacao,
        'client_id', client_id,
        'fonte_bruta_acessada', fonte_bruta_acessada,
        'degradado', degradado
      ) order by criado_em, id), '[]'::json)::text
      from public.auditoria_acessos
    `,
  );
  return JSON.parse(json);
}

async function startMcpCountingProxy() {
  mcpProxy = createServer(async (request, response) => {
    mcpProxyRequests += 1;
    try {
      if (request.method !== 'POST' || request.url !== '/mcp') {
        response.writeHead(404, { 'content-type': 'application/json' });
        response.end('{"error":"not_found"}');
        return;
      }
      const chunks = [];
      let total = 0;
      for await (const chunk of request) {
        total += chunk.length;
        if (total > 128 * 1024) throw new Error('proxy_request_too_large');
        chunks.push(chunk);
      }
      const headers = new Headers();
      for (const [name, value] of Object.entries(request.headers)) {
        if (value === undefined || ['host', 'content-length', 'connection'].includes(name))
          continue;
        headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      }
      const upstream = await fetch(`${mcpBaseUrl}/mcp`, {
        method: 'POST',
        headers,
        body: Buffer.concat(chunks).toString('utf8'),
        redirect: 'error',
      });
      const body = Buffer.from(await upstream.arrayBuffer());
      const responseHeaders = {};
      for (const [name, value] of upstream.headers) {
        if (
          !['content-length', 'content-encoding', 'transfer-encoding', 'connection'].includes(name)
        ) {
          responseHeaders[name] = value;
        }
      }
      response.writeHead(upstream.status, responseHeaders);
      response.end(body);
    } catch {
      response.writeHead(502, { 'content-type': 'application/json' });
      response.end('{"error":"provider_unavailable"}');
    }
  });
  mcpProxy.on('clientError', (_error, socket) => socket.destroy());
  await new Promise((resolveListen, rejectListen) => {
    mcpProxy.once('error', rejectListen);
    mcpProxy.listen(33101, '127.0.0.1', resolveListen);
  });
}

async function closeMcpProxy() {
  if (!mcpProxy?.listening) return;
  mcpProxy.closeAllConnections();
  await Promise.race([
    new Promise((resolveClose, rejectClose) =>
      mcpProxy.close((error) => (error ? rejectClose(error) : resolveClose())),
    ),
    new Promise((_, rejectTimeout) =>
      setTimeout(() => rejectTimeout(new Error('Timeout encerrando proxy MCP.')), 5_000),
    ),
  ]);
}

function mcfChildEnvironment(token) {
  return {
    ...childEnvironment,
    NODE_ENV: 'test',
    HOST: '127.0.0.1',
    PORT: '33110',
    DATABASE_URL: mcfDatabaseUrl.href,
    LOG_LEVEL: 'error',
    TRUST_PROXY: 'false',
    BODY_LIMIT_BYTES: '262144',
    RATE_LIMIT_KEY_SECRET: rateLimitSecret,
    MCF_RECEIPT_SECRET: receiptSecret,
    MCF_RUNTIME_TOKEN: runtimeToken,
    ALLOWED_ORIGINS: 'http://127.0.0.1:5173',
    REGISTRATION_ALLOWLIST: '',
    MCF_CONTEXT_READ_TOKEN: contextIngressToken,
    MCF_COGNITIVE_LEDGER_INGRESS_TOKEN: ledgerIngressToken,
    MCF_COGNITIVE_LEDGER_MCP_URL: `${mcpProxyBaseUrl}/mcp`,
    MCF_COGNITIVE_LEDGER_BEARER_TOKEN: token,
    MCF_COGNITIVE_LEDGER_TIMEOUT_MS: '15000',
    MCF_COGNITIVE_LEDGER_INPUT_LIMIT_BYTES: '32768',
    MCF_COGNITIVE_LEDGER_RESPONSE_LIMIT_BYTES: '262144',
    MCF_COGNITIVE_LEDGER_MAX_CONCURRENT_QUERIES: '2',
  };
}

async function jsonMcfRequest(headers, query) {
  const response = await fetch(`${mcfBaseUrl}/v1/mcf/context/ledger/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(query),
  });
  const text = await response.text();
  return { status: response.status, headers: response.headers, text, body: JSON.parse(text) };
}

async function duplicatedLedgerHeaderRequest(query) {
  const body = JSON.stringify(query);
  return new Promise((resolveRequest, rejectRequest) => {
    const request = httpRequest(
      {
        host: '127.0.0.1',
        port: 33110,
        path: '/v1/mcf/context/ledger/query',
        method: 'POST',
        headers: [
          'Host',
          '127.0.0.1:33110',
          'Content-Type',
          'application/json',
          'Content-Length',
          String(Buffer.byteLength(body, 'utf8')),
          'x-mcf-ledger-read-token',
          ledgerIngressToken,
          'x-mcf-ledger-read-token',
          ledgerIngressToken,
        ],
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.once('end', () =>
          resolveRequest({
            status: response.statusCode,
            text: Buffer.concat(chunks).toString('utf8'),
          }),
        );
      },
    );
    request.once('error', rejectRequest);
    request.end(body);
  });
}

async function callMcf(operation, input, ephemeralValues) {
  const query = { operation, input };
  const response = await jsonMcfRequest({ 'x-mcf-ledger-read-token': ledgerIngressToken }, query);
  assert.equal(response.status, 200, `Boundary MCF falhou para ${operation}.`);
  assert.equal(response.headers.get('cache-control'), 'no-store, private');
  assert.deepEqual(
    {
      schema_version: response.body.schema_version,
      provider_project_id: response.body.provider_project_id,
      operation: response.body.operation,
      read_only: response.body.read_only,
      memory_payload_persisted_by_mcf: response.body.memory_payload_persisted_by_mcf,
    },
    {
      schema_version: 1,
      provider_project_id: 'cognitive-ledger',
      operation,
      read_only: true,
      memory_payload_persisted_by_mcf: false,
    },
  );
  ephemeralValues.push(JSON.stringify(query), response.text);
  return response.body.result;
}

function redact(value) {
  let redacted = String(value);
  for (const secret of sensitiveValues) redacted = redacted.replaceAll(secret, '[REDACTED]');
  return redacted;
}

async function cleanupOwnedResources(strict) {
  if (cleanupCompleted) return;
  const failures = [];
  const attempt = async (work) => {
    try {
      await work();
    } catch (error) {
      failures.push(error);
    }
  };
  await attempt(() => stopProcess(mcfRuntime?.processHandle));
  await attempt(closeMcpProxy);
  await attempt(() => stopProcess(mcpRuntime?.processHandle));
  await attempt(() => stopProcess(edgeRuntime?.processHandle));
  if (supabaseOwned) {
    await attempt(async () => {
      executeSupabase(['stop', '--no-backup'], { timeout: 120_000 });
      supabaseOwned = false;
    });
  }
  await attempt(dropMcfDatabase);
  if (failures.length === 0 && laboratoryRoot) {
    rmSync(laboratoryRoot, { force: true, recursive: true });
  }
  cleanupCompleted = failures.length === 0;
  if (strict && failures.length > 0) throw failures[0];
}

try {
  prepareLaboratory();
  initialMcfRevision = execute('git', ['rev-parse', 'HEAD'], { cwd: mcfRepositoryRoot }).trim();
  assertRepositoryState();
  for (const port of [33110, 33101, 33100, 54331, 54332]) await assertTcpPortClosed(port);

  executePnpm(['build:packages']);
  executePnpm(['--filter', '@rsa/server', 'build']);
  assert.ok(existsSync(serverEntry), 'Build do AppModule real não gerou dist/main.js.');
  assertRepositoryState();

  await createMcfDatabase();
  execute(process.execPath, [migrationEntry], {
    cwd: workspaceRoot,
    env: { ...childEnvironment, DATABASE_URL: mcfDatabaseUrl.href },
  });
  const mcfSnapshotBefore = await mcfDataSnapshot();
  assert.ok(Object.values(mcfSnapshotBefore).every(({ count }) => count === 0));

  prepareDisposableSupabaseProject();
  const { key, kid } = await createLabSigningKey();
  supabaseOwned = true;
  executeSupabase(['start', '-x', excludedServices], { timeout: 300_000 });
  const status = supabaseStatus();
  assert.equal(status.API_URL, 'http://127.0.0.1:54331');
  assert.equal(status.DB_URL, 'postgresql://postgres:postgres@127.0.0.1:54332/postgres');
  sensitiveValues.push(status.PUBLISHABLE_KEY, status.ANON_KEY, status.SERVICE_ROLE_KEY);

  await createSyntheticUser(status);
  bearerToken = await issueSyntheticJwt(key, kid);
  sensitiveValues.push(bearerToken);
  await verifyJwtAtLocalAuth(status, bearerToken);
  writeFileSync(
    functionEnvironmentPath,
    [
      `COGNITIVE_LEDGER_OWNER_ID=${ownerId}`,
      'COGNITIVE_LEDGER_EMBEDDING_PROVIDER=disabled',
      `COGNITIVE_LEDGER_OAUTH_ISSUER=${issuer}`,
      '',
    ].join('\n'),
    { mode: 0o600 },
  );

  edgeRuntime = startProcess(supabaseCli, [
    '--workdir',
    laboratoryRoot,
    'functions',
    'serve',
    'cognitive-ledger-api',
    '--env-file',
    functionEnvironmentPath,
    '--no-verify-jwt',
  ]);
  const apiUrl = `${status.FUNCTIONS_URL}/cognitive-ledger-api`;
  await waitForHttp(
    `${apiUrl}/v1/diario`,
    (response) => response.status === 401,
    edgeRuntime.processHandle,
    60_000,
  );

  const providerFingerprintBefore = eventsFingerprint(status.DB_URL);
  assert.deepEqual(ledgerDatabaseCounts(status.DB_URL), [3, 0, 0]);
  mcpRuntime = startProcess(process.execPath, [mcpEntry], {
    env: {
      ...childEnvironment,
      SUPABASE_URL: supabaseBaseUrl,
      SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
      COGNITIVE_LEDGER_API_URL: apiUrl.replace('127.0.0.1', 'localhost'),
      PUBLIC_BASE_URL: mcpBaseUrl,
      HOST: '127.0.0.1',
      PORT: '33100',
    },
  });
  await waitForHttp(
    `${mcpBaseUrl}/health`,
    (response) => response.status === 200,
    mcpRuntime.processHandle,
  );
  await startMcpCountingProxy();

  mcfRuntime = startProcess(process.execPath, [serverEntry], {
    cwd: serverRoot,
    env: mcfChildEnvironment(bearerToken),
  });
  await waitForHttp(
    `${mcfBaseUrl}/health/live`,
    (response) => response.status === 200,
    mcfRuntime.processHandle,
  );

  const safeQuery = { operation: 'ler_diario', input: { limite: 1 } };
  let requestCountBefore = mcpProxyRequests;
  const missing = await jsonMcfRequest({}, safeQuery);
  assert.equal(missing.status, 401);
  assert.equal(mcpProxyRequests, requestCountBefore, 'Credencial ausente alcançou o MCP.');
  assert.ok(!missing.text.includes(ledgerIngressToken));

  requestCountBefore = mcpProxyRequests;
  const triview = await jsonMcfRequest(
    { 'x-mcf-ledger-read-token': contextIngressToken },
    safeQuery,
  );
  assert.equal(triview.status, 401);
  assert.equal(mcpProxyRequests, requestCountBefore, 'Token TriView alcançou o MCP.');
  assert.ok(!triview.text.includes(contextIngressToken));

  requestCountBefore = mcpProxyRequests;
  const duplicate = await duplicatedLedgerHeaderRequest(safeQuery);
  assert.equal(duplicate.status, 401);
  assert.equal(mcpProxyRequests, requestCountBefore, 'Header Ledger duplicado alcançou o MCP.');
  assert.ok(!duplicate.text.includes(ledgerIngressToken));

  requestCountBefore = mcpProxyRequests;
  const rawQuery = {
    operation: 'ler_fonte_bruta',
    input: { evento_id: 'ec-lab-001', justificativa: 'deve ser recusada no MCF' },
  };
  const raw = await jsonMcfRequest({ 'x-mcf-ledger-read-token': ledgerIngressToken }, rawQuery);
  assert.equal(raw.status, 400);
  assert.equal(mcpProxyRequests, requestCountBefore, 'Fonte bruta abriu conexão MCP.');

  const ephemeralValues = [JSON.stringify(safeQuery), JSON.stringify(rawQuery)];
  const diary = await callMcf('ler_diario', { limite: 2 }, ephemeralValues);
  const search = await callMcf(
    'buscar_eventos',
    { texto: 'busca textual gratuita e efêmera', limite: 2 },
    ephemeralValues,
  );
  const context = await callMcf(
    'recuperar_contexto',
    { objetivo: 'retomar integração gratuita sem persistir memória', limite: 2 },
    ephemeralValues,
  );
  assert.equal(diary.degradado, false);
  assert.equal(search.degradado, true);
  assert.equal(context.degradado, true);
  assert.ok(mcpProxyRequests > requestCountBefore, 'As leituras válidas não alcançaram o MCP.');

  const providerFingerprintAfter = eventsFingerprint(status.DB_URL);
  assert.equal(providerFingerprintAfter, providerFingerprintBefore);
  assert.deepEqual(ledgerDatabaseCounts(status.DB_URL), [3, 0, 3]);
  const audits = ledgerAuditRows(status.DB_URL);
  assert.deepEqual(
    audits.map(({ operacao }) => operacao),
    ['ler_diario', 'buscar_eventos', 'recuperar_contexto'],
  );
  assert.ok(audits.every(({ client_id }) => client_id === clientId));
  assert.equal(audits.filter(({ fonte_bruta_acessada }) => fonte_bruta_acessada).length, 0);
  assert.equal(audits.filter(({ degradado }) => degradado).length, 2);

  const mcfSnapshotAfter = await mcfDataSnapshot();
  assert.deepEqual(mcfSnapshotAfter, mcfSnapshotBefore, 'Uma tabela MCF de dados foi alterada.');
  const abuseRows = await withMcfDatabase(
    async (client) =>
      (
        await client.query(
          'select key_hash, policy, request_count from abuse_rate_limits order by policy, key_hash',
        )
      ).rows,
  );
  assert.deepEqual(
    abuseRows.map(({ policy, request_count: requestCount }) => ({ policy, requestCount })),
    [{ policy: 'mcf-ledger-read-query', requestCount: 7 }],
  );
  assert.ok(abuseRows.every(({ key_hash: keyHash }) => /^[a-f0-9]{64}$/u.test(keyHash)));
  await assertMcfDatabaseContainsNo([...sensitiveValues, ...ephemeralValues]);

  await cleanupOwnedResources(true);
  assertProcessStopped(mcfRuntime, 'AppModule MCF');
  assertProcessStopped(mcpRuntime, 'MCP Ledger');
  assertProcessStopped(edgeRuntime, 'Edge Function Ledger');
  for (const port of [33110, 33101, 33100, 54331, 54332]) await assertTcpPortClosed(port);
  const sharedDatabaseCheck = new PostgresClient({ connectionString: adminDatabaseUrl.href });
  await sharedDatabaseCheck.connect();
  assert.equal((await sharedDatabaseCheck.query('select 1 as ok')).rows[0].ok, 1);
  await sharedDatabaseCheck.end();
  assertRepositoryState();

  console.log(
    JSON.stringify(
      {
        resultado: 'PASS',
        cadeia: 'AppModule MCF -> MCP -> Edge/Auth -> PostgREST -> PostgreSQL 17/pgvector',
        mcf_revision: initialMcfRevision,
        provider_revision: PROVIDER_REVISION,
        ferramentas_provider: [
          'ler_diario',
          'buscar_eventos',
          'recuperar_contexto',
          'ler_fonte_bruta',
        ],
        operacoes_mcf: ['ler_diario', 'buscar_eventos', 'recuperar_contexto'],
        fonte_bruta_mcf: 'PROHIBITED_BEFORE_MCP',
        eventos_antes_depois: [3, 3],
        embeddings: 0,
        auditorias: 3,
        chamadas_pagas: 0,
        fingerprint_eventos: providerFingerprintAfter,
        persistencia_memoria_mcf: false,
        unica_mutacao_mcf: 'abuse_rate_limits:HMAC:mcf-ledger-read-query:7',
        banco_mcf_unico_removido: true,
        postgres_compartilhado_preservado: true,
        repositorios_imutaveis: true,
        processos_e_portas_encerrados: true,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        erro: redact(error instanceof Error ? error.stack || error.message : 'falha desconhecida'),
        edge_runtime: redact(edgeRuntime?.output() || ''),
        mcp_runtime: redact(mcpRuntime?.output() || ''),
        mcf_runtime: redact(mcfRuntime?.output() || ''),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await cleanupOwnedResources(false);
}
