import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { ContentController } from './content.controller.js';
import { CONTENT_REPOSITORY } from './content.repository.js';
import { ContentService } from './content.service.js';
import { PostgresContentRepository } from './postgres-content.repository.js';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [ContentController],
  providers: [
    ContentService,
    PostgresContentRepository,
    {
      provide: CONTENT_REPOSITORY,
      useExisting: PostgresContentRepository,
    },
  ],
})
export class ContentModule {}
