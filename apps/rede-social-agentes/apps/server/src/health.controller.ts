import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import type { HealthResponse, VersionResponse } from '@rsa/contracts';

import { DatabaseService } from './database.service.js';

const commitPattern = /^[a-f0-9]{40}$/u;
const branchPattern = /^[a-zA-Z0-9._/-]{1,128}$/u;

function safeCommit(value: string | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? '';
  return commitPattern.test(normalized) ? normalized : null;
}

function safeBranch(value: string | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return branchPattern.test(normalized) ? normalized : null;
}

@Controller('health')
export class HealthController {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

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

  @Get('version')
  version(): VersionResponse {
    return {
      service: 'rede-social-agentes',
      component: 'server',
      commitSha: safeCommit(process.env.RENDER_GIT_COMMIT),
      branch: safeBranch(process.env.RENDER_GIT_BRANCH),
      runtime: process.env.RENDER === 'true' ? 'render' : 'local',
    };
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
