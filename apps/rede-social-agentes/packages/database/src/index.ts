import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

import * as schema from './schema.js';

export type DatabaseTransaction = PoolClient;
export type DatabaseRow = QueryResultRow;
export type DatabaseQueryResult<TRow extends DatabaseRow> = QueryResult<TRow>;

export interface DatabaseHandle {
  db: NodePgDatabase<typeof schema>;
  pool: Pool;
}

export function createDatabase(databaseUrl: string): DatabaseHandle {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  return {
    db: drizzle(pool, { schema }),
    pool,
  };
}

export async function query<TRow extends DatabaseRow>(
  handle: DatabaseHandle,
  text: string,
  values: readonly unknown[] = [],
): Promise<DatabaseQueryResult<TRow>> {
  return handle.pool.query<TRow>(text, [...values]);
}

export async function withTransaction<TResult>(
  handle: DatabaseHandle,
  work: (client: DatabaseTransaction) => Promise<TResult>,
): Promise<TResult> {
  const client = await handle.pool.connect();
  try {
    await client.query('begin');
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export { schema };
