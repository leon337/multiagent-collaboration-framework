/* global console, process */

import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import {
  connectionEnvironment,
  parsePostgresConnection,
  pgRestoreArguments,
  verifyBackupManifest,
} from './database-backup.mjs';

function run(command, args, environment, captureOutput = false) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...environment },
      stdio: captureOutput ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'inherit', 'inherit'],
    });
    let stdout = '';
    let stderr = '';
    if (captureOutput) {
      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      child.stdout?.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr?.on('data', (chunk) => {
        stderr += chunk;
      });
    }
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} failed with exit code ${code}: ${stderr.trim()}`));
        return;
      }
      resolveRun(stdout.trim());
    });
  });
}

if (process.env.ALLOW_DESTRUCTIVE_RESTORE !== 'YES') {
  throw new Error('ALLOW_DESTRUCTIVE_RESTORE=YES is required.');
}

const manifestInput = process.env.BACKUP_MANIFEST ?? process.argv[2];
if (!manifestInput) {
  throw new Error('BACKUP_MANIFEST or a manifest path argument is required.');
}

const manifestPath = resolve(manifestInput);
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (typeof manifest.dumpFile !== 'string') {
  throw new Error('Backup manifest does not declare a dump file.');
}
const dumpPath = resolve(dirname(manifestPath), manifest.dumpFile);
const verification = await verifyBackupManifest(manifest, dumpPath);
const connection = parsePostgresConnection(
  process.env.RESTORE_DATABASE_URL,
  'RESTORE_DATABASE_URL',
);
const environment = connectionEnvironment(connection);

await run('pg_restore', pgRestoreArguments(dumpPath), environment);
const migrationCount = await run(
  'psql',
  [
    '--no-psqlrc',
    '--tuples-only',
    '--no-align',
    '--set',
    'ON_ERROR_STOP=1',
    '--command',
    'select count(*) from "_rsa_migrations";',
  ],
  environment,
  true,
);

const appliedMigrations = Number(migrationCount.trim());
if (!Number.isSafeInteger(appliedMigrations) || appliedMigrations < 1) {
  throw new Error('Restored database does not contain a valid migration ledger.');
}

console.info(
  JSON.stringify({
    event: 'database_restore_completed',
    dumpFile: manifest.dumpFile,
    sizeBytes: verification.sizeBytes,
    sha256: verification.sha256,
    appliedMigrations,
  }),
);
