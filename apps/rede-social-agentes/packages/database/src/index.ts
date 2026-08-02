import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema.js';

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

export { schema };
