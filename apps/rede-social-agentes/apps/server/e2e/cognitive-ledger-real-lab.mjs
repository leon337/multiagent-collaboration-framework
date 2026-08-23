/* global clearTimeout, console, fetch, setTimeout, URL */

import 'reflect-metadata';

import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { connect as connectTcp } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { FastifyAdapter } from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { exportJWK, generateKeyPair, importJWK, SignJWT } from 'jose';

const PROVIDER_REVISION = 'b882d2808af74858a6ba351fb755bb3843e33ab2';
const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mcfRepositoryRoot = resolve(serverRoot, '../../../..');
const providerRootValue = process.env.COGNITIVE_LEDGER_REPOSITORY_ROOT;
if (!providerRootValue) {
  throw new Error('Defina COGNITIVE_LEDGER_REPOSITORY_ROOT para o provider fixo do laboratório.');
}
const providerRoot = resolve(providerRootValue);
const supabaseCli = join(providerRoot, 'tools/lab/node_modules/.bin/supabase');
const mcpEntry = join(providerRoot, 'mcp/src/servidor.mjs');
const providerConfigPath = join(providerRoot, 'supabase/config.toml');
const ownerId = '00000000-0000-0000-0000-000000000001';
const clientId = 'mcf-lab-raw-controlled';
const supabaseBaseUrl = 'http://localhost:54331';
const issuer = `${supabaseBaseUrl}/auth/v1`;
const mcpBaseUrl = 'http://127.0.0.1:33100';
const mcfBaseUrl = 'http://127.0.0.1:33110';
const ingressToken = 'mcf-ledger-real-lab-ingress-token-000000000001';
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
const childEnvironment = { ...process.env };
for (const key of ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY']) {
  delete childEnvironment[key];
}

if (process.env.MCF_COGNITIVE_LEDGER_LAB_CONFIRM !== '1') {
  throw new Error('Defina MCF_COGNITIVE_LEDGER_LAB_CONFIRM=1 para executar o E2E descartável.');
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

const observedProviderRevision = execute('git', ['rev-parse', 'HEAD']).trim();
assert.equal(
  observedProviderRevision,
  PROVIDER_REVISION,
  'Provider Ledger divergiu do commit fixo.',
);
assert.equal(
  execute('git', ['status', '--porcelain']).trim(),
  '',
  'Provider Ledger deve estar limpo.',
);
const initialMcfRevision = execute('git', ['rev-parse', 'HEAD'], {
  cwd: mcfRepositoryRoot,
}).trim();
assert.equal(
  execute('git', ['status', '--porcelain'], { cwd: mcfRepositoryRoot }).trim(),
  '',
  'Worktree MCF deve estar limpo antes do laboratório.',
);
assert.ok(
  readFileSync(providerConfigPath, 'utf8').includes('project_id = "cognitive-ledger-lab"'),
  'Projeto Supabase exclusivamente lab não encontrado.',
);

let laboratoryRoot;
let temporaryDirectory;
let signingKeysPath;
let functionEnvironmentPath;
let edgeRuntime;
let mcpRuntime;
let mcfApplication;

function prepareDisposableSupabaseProject() {
  laboratoryRoot = mkdtempSync(join(tmpdir(), 'mcf-cognitive-ledger-lab-'));
  const destination = join(laboratoryRoot, 'supabase');
  mkdirSync(destination, { recursive: true, mode: 0o700 });
  const config = readFileSync(providerConfigPath, 'utf8').replace(
    'jwt_issuer = "http://localhost:54331/auth/v1"',
    [
      'jwt_issuer = "http://localhost:54331/auth/v1"',
      'signing_keys_path = "./.temp/lab-signing-keys.json"',
    ].join('\n'),
  );
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

function stopSupabase() {
  if (!laboratoryRoot) return;
  try {
    executeSupabase(['stop', '--no-backup'], { timeout: 120_000 });
  } catch {
    // The initial cleanup has no disposable stack yet.
  }
}

async function createLabSigningKey() {
  mkdirSync(temporaryDirectory, { recursive: true, mode: 0o700 });
  const { privateKey } = await generateKeyPair('ES256', { extractable: true });
  const jwk = await exportJWK(privateKey);
  const kid = randomUUID();
  const key = {
    ...jwk,
    kid,
    use: 'sig',
    key_ops: ['sign'],
    alg: 'ES256',
    ext: true,
  };
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
      // Expected while a local disposable service is starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Timeout aguardando serviço local em ${new URL(url).origin}.`);
}

async function stopProcess(processHandle) {
  if (!processHandle || processHandle.exitCode !== null || processHandle.signalCode !== null) {
    return;
  }
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
      rejectOpen(new Error(`Timeout verificando encerramento da porta local ${port}.`));
    }, 2_000);
    socket.once('connect', () => {
      clearTimeout(timeout);
      socket.destroy();
      rejectOpen(new Error(`Porta local ${port} permaneceu aberta após o laboratório.`));
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

async function stopAndVerifyLocalServices() {
  await mcfApplication?.close();
  mcfApplication = undefined;
  await stopProcess(mcpRuntime?.processHandle);
  await stopProcess(edgeRuntime?.processHandle);
  stopSupabase();
  assertProcessStopped(mcpRuntime, 'MCP Ledger');
  assertProcessStopped(edgeRuntime, 'Edge Function Ledger');
  for (const port of [33110, 33100, 54331, 54332]) {
    await assertTcpPortClosed(port);
  }
}

function queryDatabase(databaseUrl, sql) {
  return execute('psql', [databaseUrl, '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    timeout: 30_000,
  }).trim();
}

function eventsFingerprint(databaseUrl) {
  return queryDatabase(
    databaseUrl,
    "select md5(string_agg(row_to_json(e)::text, '|' order by e.id)) from public.eventos_cognitivos e",
  );
}

function databaseCounts(databaseUrl) {
  const row = queryDatabase(
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

function auditRows(databaseUrl) {
  const json = queryDatabase(
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

async function startMcfApplication(token) {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    MCF_CONTEXT_READ_TOKEN: ingressToken,
    MCF_COGNITIVE_LEDGER_MCP_URL: `${mcpBaseUrl}/mcp`,
    MCF_COGNITIVE_LEDGER_BEARER_TOKEN: token,
    MCF_COGNITIVE_LEDGER_TIMEOUT_MS: '15000',
    MCF_COGNITIVE_LEDGER_INPUT_LIMIT_BYTES: '32768',
    MCF_COGNITIVE_LEDGER_RESPONSE_LIMIT_BYTES: '262144',
  });
  delete process.env.OPENAI_API_KEY;
  const modulePath = pathToFileURL(join(serverRoot, 'dist/mcf-context/mcf-context.module.js')).href;
  const { McfContextModule } = await import(modulePath);
  const app = await NestFactory.create(McfContextModule, new FastifyAdapter(), {
    logger: false,
  });
  await app.listen(33110, '127.0.0.1');
  return app;
}

async function callMcf(operation, input) {
  const response = await fetch(`${mcfBaseUrl}/v1/mcf/context/ledger/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-mcf-context-token': ingressToken,
    },
    body: JSON.stringify({ operation, input }),
  });
  assert.equal(response.status, 200, `Boundary MCF falhou para ${operation}.`);
  assert.equal(response.headers.get('cache-control'), 'no-store, private');
  const body = await response.json();
  assert.deepEqual(
    {
      schema_version: body.schema_version,
      provider_project_id: body.provider_project_id,
      operation: body.operation,
      read_only: body.read_only,
      persisted_by_mcf: body.persisted_by_mcf,
    },
    {
      schema_version: 1,
      provider_project_id: 'cognitive-ledger',
      operation,
      read_only: true,
      persisted_by_mcf: false,
    },
  );
  return body.result;
}

try {
  prepareDisposableSupabaseProject();
  await createLabSigningKey();
  stopSupabase();
  const { key, kid } = await createLabSigningKey();
  executeSupabase(['start', '-x', excludedServices], { timeout: 300_000 });
  const status = supabaseStatus();
  assert.equal(status.API_URL, 'http://127.0.0.1:54331');
  assert.equal(status.DB_URL, 'postgresql://postgres:postgres@127.0.0.1:54332/postgres');

  await createSyntheticUser(status);
  const token = await issueSyntheticJwt(key, kid);
  await verifyJwtAtLocalAuth(status, token);
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

  const fingerprintBefore = eventsFingerprint(status.DB_URL);
  assert.deepEqual(databaseCounts(status.DB_URL), [3, 0, 0]);

  const mcpEnvironment = { ...childEnvironment };
  Object.assign(mcpEnvironment, {
    SUPABASE_URL: supabaseBaseUrl,
    SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
    COGNITIVE_LEDGER_API_URL: apiUrl.replace('127.0.0.1', 'localhost'),
    PUBLIC_BASE_URL: mcpBaseUrl,
    HOST: '127.0.0.1',
    PORT: '33100',
  });
  mcpRuntime = startProcess(process.execPath, [mcpEntry], { env: mcpEnvironment });
  await waitForHttp(
    `${mcpBaseUrl}/health`,
    (response) => response.status === 200,
    mcpRuntime.processHandle,
  );

  mcfApplication = await startMcfApplication(token);
  const unauthorized = await fetch(`${mcfBaseUrl}/v1/mcf/context/ledger/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation: 'ler_diario', input: { limite: 1 } }),
  });
  assert.equal(unauthorized.status, 401);

  const diary = await callMcf('ler_diario', { limite: 2 });
  const search = await callMcf('buscar_eventos', {
    texto: 'busca textual gratuita',
    limite: 2,
  });
  const context = await callMcf('recuperar_contexto', {
    objetivo: 'retomar integração com busca textual gratuita',
    limite: 2,
  });
  const source = await callMcf('ler_fonte_bruta', {
    evento_id: 'ec-lab-001',
    justificativa: 'E2E MCF real com fixture exclusivamente sintética',
  });
  assert.equal(diary.degradado, false);
  assert.equal(search.degradado, true);
  assert.equal(context.degradado, true);
  assert.match(source.fonte.conteudo_bruto, /exclusivamente sintético/u);

  const fingerprintAfter = eventsFingerprint(status.DB_URL);
  assert.equal(fingerprintAfter, fingerprintBefore);
  assert.deepEqual(databaseCounts(status.DB_URL), [3, 0, 4]);
  const audits = auditRows(status.DB_URL);
  assert.deepEqual(
    audits.map(({ operacao }) => operacao),
    ['ler_diario', 'buscar_eventos', 'recuperar_contexto', 'ler_fonte_bruta'],
  );
  assert.ok(audits.every(({ client_id }) => client_id === clientId));
  assert.equal(audits.filter(({ fonte_bruta_acessada }) => fonte_bruta_acessada).length, 1);
  assert.equal(audits.filter(({ degradado }) => degradado).length, 2);

  await stopAndVerifyLocalServices();
  assert.equal(execute('git', ['rev-parse', 'HEAD']).trim(), PROVIDER_REVISION);
  assert.equal(
    execute('git', ['status', '--porcelain']).trim(),
    '',
    'Provider Ledger foi alterado pelo laboratório.',
  );
  assert.equal(
    execute('git', ['rev-parse', 'HEAD'], { cwd: mcfRepositoryRoot }).trim(),
    initialMcfRevision,
  );
  assert.equal(
    execute('git', ['status', '--porcelain'], { cwd: mcfRepositoryRoot }).trim(),
    '',
    'Worktree MCF foi alterado pelo laboratório.',
  );

  console.log(
    JSON.stringify(
      {
        resultado: 'PASS',
        cadeia:
          'MCF HTTP -> MCP Streamable HTTP -> Edge/Auth -> PostgREST -> PostgreSQL 17/pgvector',
        provider_revision: PROVIDER_REVISION,
        ferramentas: ['ler_diario', 'buscar_eventos', 'recuperar_contexto', 'ler_fonte_bruta'],
        eventos_antes_depois: [3, 3],
        embeddings: 0,
        auditorias: 4,
        chamadas_pagas: 0,
        fingerprint_eventos: fingerprintAfter,
        persistencia_mcf: false,
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
        erro: error instanceof Error ? error.stack || error.message : 'falha desconhecida',
        edge_runtime: edgeRuntime?.output() || '',
        mcp_runtime: mcpRuntime?.output() || '',
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await mcfApplication?.close().catch(() => undefined);
  await stopProcess(mcpRuntime?.processHandle);
  await stopProcess(edgeRuntime?.processHandle);
  stopSupabase();
  if (functionEnvironmentPath) rmSync(functionEnvironmentPath, { force: true });
  if (signingKeysPath) rmSync(signingKeysPath, { force: true });
  if (laboratoryRoot) rmSync(laboratoryRoot, { force: true, recursive: true });
}
