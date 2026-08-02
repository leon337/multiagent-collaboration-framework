import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import type { HealthResponse } from '@rsa/contracts';

import { DatabaseService } from './database.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get('live')
  live(): HealthResponse {
    return this.response();
  }

  @Get('ready')
  async ready(): Promise<HealthResponse> {
    try {
      await this.database.ping();
      return this.response();
    } catch {
      throw new ServiceUnavailableException({
        code: 'DATABASE_NOT_READY',
        message: 'The database dependency is not ready.',
      });
    }
  }

  private response(): HealthResponse {
    return {
      status: 'ok',
      service: 'rede-social-agentes',
      component: 'server',
      timestamp: new Date().toISOString(),
    };
  }
}
