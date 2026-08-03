import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { InteractionController } from './interaction.controller.js';
import { INTERACTION_REPOSITORY } from './interaction.repository.js';
import { InteractionService } from './interaction.service.js';
import { PostgresInteractionRepository } from './postgres-interaction.repository.js';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [InteractionController],
  providers: [
    InteractionService,
    PostgresInteractionRepository,
    {
      provide: INTERACTION_REPOSITORY,
      useExisting: PostgresInteractionRepository,
    },
  ],
})
export class InteractionModule {}
