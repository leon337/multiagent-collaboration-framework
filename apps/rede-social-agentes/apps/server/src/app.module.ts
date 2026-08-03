import { Module } from '@nestjs/common';

import { AgentModule } from './agents/agent.module.js';
import { DatabaseModule } from './database.module.js';
import { HealthController } from './health.controller.js';
import { IdentityModule } from './identity/identity.module.js';
import { PermissionModule } from './permissions/permission.module.js';

@Module({
  imports: [DatabaseModule, IdentityModule, AgentModule, PermissionModule],
  controllers: [HealthController],
})
export class AppModule {}
