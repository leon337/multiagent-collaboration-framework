import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import {
  createDatabase,
  query,
  withTransaction,
  type DatabaseHandle,
  type DatabaseQueryResult,
  type DatabaseRow,
  type DatabaseTransaction,
} from '@rsa/database';

import { loadRuntimeConfig } from './config.js';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly handle: DatabaseHandle;

  constructor() {
    const config = loadRuntimeConfig();
    this.handle = createDatabase(config.DATABASE_URL);
  }

  async ping(): Promise<void> {
    await this.handle.pool.query('select 1');
  }

  async query<TRow extends DatabaseRow>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<DatabaseQueryResult<TRow>> {
    return query<TRow>(this.handle, text, values);
  }

  async transaction<TResult>(
    work: (client: DatabaseTransaction) => Promise<TResult>,
  ): Promise<TResult> {
    return withTransaction(this.handle, work);
  }

  async onModuleDestroy(): Promise<void> {
    await this.handle.pool.end();
  }
}
