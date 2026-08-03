/* global console, process */

import { spawn } from 'node:child_process';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  backupBaseName,
  connectionEnvironment,
  createBackupManifest,
  parsePostgresConnection,
  pgDumpArguments,
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

const connection = parsePostgresConnection(process.env.DATABASE_URL, 'DATABASE_URL');
const directory = resolve(process.env.BACKUP_DIRECTORY ?? './var/backups');
const createdAt = new Date();
const baseName = backupBaseName(createdAt);
const dumpPath = resolve(directory, `${baseName}.dump`);
const manifestPath = resolve(directory, `${baseName}.manifest.json`);
const temporaryDumpPath = `${dumpPath}.tmp`;
const temporaryManifestPath = `${manifestPath}.tmp`;
const environment = connectionEnvironment(connection);

await mkdir(directory, { recursive: true, mode: 0o700 });

try {
  const toolVersion = await run('pg_dump', ['--version'], environment, true);
  await run('pg_dump', pgDumpArguments(temporaryDumpPath), environment);
  const manifest = await createBackupManifest({
    dumpPath: temporaryDumpPath,
    createdAt,
    connection,
    toolVersion,
  });
  const finalManifest = { ...manifest, dumpFile: `${baseName}.dump` };
  await writeFile(temporaryManifestPath, `${JSON.stringify(finalManifest, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  await rename(temporaryDumpPath, dumpPath);
  await rename(temporaryManifestPath, manifestPath);

  console.info(
    JSON.stringify({
      event: 'database_backup_completed',
      dumpFile: `${baseName}.dump`,
      manifestFile: `${baseName}.manifest.json`,
      sizeBytes: finalManifest.sizeBytes,
      sha256: finalManifest.sha256,
    }),
  );
} catch (error) {
  await Promise.all([
    rm(temporaryDumpPath, { force: true }),
    rm(temporaryManifestPath, { force: true }),
  ]);
  throw error;
}
