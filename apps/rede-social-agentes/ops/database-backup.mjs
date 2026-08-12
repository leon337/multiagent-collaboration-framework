import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { basename } from 'node:path';
import { URL } from 'node:url';

const supportedProtocols = new Set(['postgres:', 'postgresql:']);

export function parsePostgresConnection(value, variableName) {
  if (!value) {
    throw new Error(`${variableName} is required.`);
  }

  const url = new URL(value);
  if (!supportedProtocols.has(url.protocol)) {
    throw new Error(`${variableName} must use the PostgreSQL protocol.`);
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//u, ''));
  if (!url.hostname || !url.username || !database) {
    throw new Error(`${variableName} must include host, user and database.`);
  }

  return {
    host: url.hostname,
    port: url.port || '5432',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    sslMode: url.searchParams.get('sslmode') ?? undefined,
  };
}

export function connectionEnvironment(connection) {
  const environment = {
    PGHOST: connection.host,
    PGPORT: connection.port,
    PGUSER: connection.user,
    PGPASSWORD: connection.password,
    PGDATABASE: connection.database,
    PGAPPNAME: 'rsa-operations',
  };

  if (connection.sslMode) {
    environment.PGSSLMODE = connection.sslMode;
  }
  return environment;
}

export function safeConnectionIdentity(connection) {
  return {
    host: connection.host,
    port: connection.port,
    user: connection.user,
    database: connection.database,
    sslMode: connection.sslMode ?? null,
  };
}

export function backupBaseName(now = new Date()) {
  const timestamp = now.toISOString().replaceAll(':', '').replaceAll('-', '').replace('.000', '');
  return `rsa-${timestamp}`;
}

export function pgDumpArguments(outputPath) {
  return ['--format=custom', '--compress=6', '--no-owner', '--no-privileges', '--file', outputPath];
}

export function pgRestoreArguments(inputPath, database) {
  if (!database) {
    throw new Error('Restore database name is required.');
  }
  return [
    '--clean',
    '--if-exists',
    '--no-owner',
    '--no-privileges',
    '--exit-on-error',
    '--dbname',
    database,
    inputPath,
  ];
}

export async function sha256File(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}

export async function createBackupManifest({ dumpPath, createdAt, connection, toolVersion }) {
  const metadata = await stat(dumpPath);
  return {
    schemaVersion: 1,
    createdAt: createdAt.toISOString(),
    dumpFile: basename(dumpPath),
    sizeBytes: metadata.size,
    sha256: await sha256File(dumpPath),
    format: 'POSTGRESQL_CUSTOM',
    database: safeConnectionIdentity(connection),
    toolVersion,
  };
}

export async function verifyBackupManifest(manifest, dumpPath) {
  if (
    typeof manifest !== 'object' ||
    manifest === null ||
    manifest.schemaVersion !== 1 ||
    manifest.format !== 'POSTGRESQL_CUSTOM' ||
    manifest.dumpFile !== basename(dumpPath) ||
    !Number.isSafeInteger(manifest.sizeBytes) ||
    typeof manifest.sha256 !== 'string'
  ) {
    throw new Error('Backup manifest is invalid.');
  }

  const metadata = await stat(dumpPath);
  if (metadata.size !== manifest.sizeBytes) {
    throw new Error('Backup size does not match the manifest.');
  }

  const actualHash = await sha256File(dumpPath);
  if (actualHash !== manifest.sha256) {
    throw new Error('Backup checksum does not match the manifest.');
  }

  return {
    sizeBytes: metadata.size,
    sha256: actualHash,
  };
}
