import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { ModerationController } from './moderation.controller.js';
import { MODERATION_REPOSITORY } from './moderation.repository.js';
import { ModerationService } from './moderation.service.js';
import { PostgresModerationRepository } from './postgres-moderation.repository.js';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [ModerationController],
  providers: [
    ModerationService,
    PostgresModerationRepository,
    {
      provide: MODERATION_REPOSITORY,
      useExisting: PostgresModerationRepository,
    },
  ],
})
export class ModerationModule {}
