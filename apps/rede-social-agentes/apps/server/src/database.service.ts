import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { createDatabase, type DatabaseHandle } from '@rsa/database';

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

  async onModuleDestroy(): Promise<void> {
    await this.handle.pool.end();
  }
}
