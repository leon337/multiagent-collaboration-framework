import { Controller, Get, Inject } from '@nestjs/common';

import { BootstrapDatabaseService } from './bootstrap-database.service.js';

@Controller('health')
export class BootstrapHealthController {
  constructor(
    @Inject(BootstrapDatabaseService) private readonly database: BootstrapDatabaseService,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok', service: 'mcf-human-authority-bootstrap' };
  }

  @Get('ready')
  async ready() {
    await this.database.ping();
    return { status: 'ready', service: 'mcf-human-authority-bootstrap' };
  }
}
