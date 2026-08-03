import { Module } from '@nestjs/common';

import { DatabaseModule } from './database.module.js';
import { HealthController } from './health.controller.js';
import { IdentityModule } from './identity/identity.module.js';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [HealthController],
})
export class AppModule {}
