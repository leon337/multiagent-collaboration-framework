import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  backupBaseName,
  connectionEnvironment,
  createBackupManifest,
  parsePostgresConnection,
  pgDumpArguments,
  pgRestoreArguments,
  verifyBackupManifest,
} from './database-backup.mjs';

test('keeps PostgreSQL credentials out of command arguments', () => {
  const connection = parsePostgresConnection(
    'postgresql://operator:super-secret@db.internal:5544/rsa?sslmode=require',
    'DATABASE_URL',
  );
  const environment = connectionEnvironment(connection);
  const dumpArguments = pgDumpArguments('/tmp/backup.dump');
  const restoreArguments = pgRestoreArguments('/tmp/backup.dump', connection.database);

  assert.equal(environment.PGPASSWORD, 'super-secret');
  assert.equal(environment.PGHOST, 'db.internal');
  assert.equal(environment.PGPORT, '5544');
  assert.equal(environment.PGDATABASE, 'rsa');
  assert.equal(environment.PGSSLMODE, 'require');
  assert.equal(dumpArguments.join(' ').includes('super-secret'), false);
  assert.equal(restoreArguments.join(' ').includes('super-secret'), false);
  assert.deepEqual(restoreArguments.slice(-3), ['--dbname', 'rsa', '/tmp/backup.dump']);
  assert.throws(() => pgRestoreArguments('/tmp/backup.dump'), /Restore database name is required/u);
});

test('creates deterministic UTC backup names', () => {
  assert.equal(backupBaseName(new Date('2026-08-03T07:40:12.000Z')), 'rsa-20260803T074012Z');
});

test('verifies size and checksum and rejects tampering', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'rsa-backup-test-'));
  const dumpPath = join(directory, 'rsa-test.dump');
  try {
    await writeFile(dumpPath, 'verified-backup', 'utf8');
    const connection = parsePostgresConnection(
      'postgresql://operator:secret@localhost:5432/rsa',
      'DATABASE_URL',
    );
    const manifest = await createBackupManifest({
      dumpPath,
      createdAt: new Date('2026-08-03T07:40:12.000Z'),
      connection,
      toolVersion: 'pg_dump (PostgreSQL) 18.4',
    });

    await assert.doesNotReject(() => verifyBackupManifest(manifest, dumpPath));
    await writeFile(dumpPath, 'tampered-backup', 'utf8');
    await assert.rejects(
      () => verifyBackupManifest(manifest, dumpPath),
      /Backup (size|checksum) does not match/u,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
