/* global console, process */

import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run migrations.');
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = join(scriptDirectory, '..', 'migrations');
const advisoryLockId = 7_104_202_608_03;

function checksum(content) {
  return createHash('sha256').update(content).digest('hex');
}

const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query('select pg_advisory_lock($1)', [advisoryLockId]);
  await client.query(`
    create table if not exists "_rsa_migrations" (
      "filename" text primary key,
      "checksum" text not null,
      "applied_at" timestamptz default now() not null
    )
  `);

  const filenames = (await readdir(migrationsDirectory))
    .filter((filename) => filename.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

  for (const filename of filenames) {
    const sql = await readFile(join(migrationsDirectory, filename), 'utf8');
    const currentChecksum = checksum(sql);
    const existing = await client.query(
      'select "checksum" from "_rsa_migrations" where "filename" = $1',
      [filename],
    );

    if (existing.rowCount === 1) {
      if (existing.rows[0].checksum !== currentChecksum) {
        throw new Error(`Migration checksum mismatch: ${filename}`);
      }
      continue;
    }

    await client.query('begin');
    try {
      await client.query(sql);
      await client.query(
        'insert into "_rsa_migrations" ("filename", "checksum") values ($1, $2)',
        [filename, currentChecksum],
      );
      await client.query('commit');
      console.info(JSON.stringify({ event: 'migration_applied', filename }));
    } catch (error) {
      await client.query('rollback');
      throw error;
    }
  }
} finally {
  try {
    await client.query('select pg_advisory_unlock($1)', [advisoryLockId]);
  } catch {
    // The connection may not have been established; cleanup continues safely.
  }
  await client.end();
}
