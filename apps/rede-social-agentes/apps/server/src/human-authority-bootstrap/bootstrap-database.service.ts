import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import {
  createDatabase,
  query,
  withTransaction,
  type DatabaseHandle,
  type DatabaseQueryResult,
  type DatabaseRow,
  type DatabaseTransaction,
} from '@rsa/database';

export const BOOTSTRAP_DATABASE_URL = Symbol('BOOTSTRAP_DATABASE_URL');

@Injectable()
export class BootstrapDatabaseService implements OnModuleDestroy {
  private readonly handle: DatabaseHandle;

  constructor(@Inject(BOOTSTRAP_DATABASE_URL) databaseUrl: string) {
    this.handle = createDatabase(databaseUrl);
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
