import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@rsa/contracts';

@Controller('health')
export class HealthController {
  @Get('live')
  live(): HealthResponse {
    return this.response();
  }

  @Get('ready')
  ready(): HealthResponse {
    return this.response();
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
