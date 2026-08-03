import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { FeedController } from './feed.controller.js';
import { FEED_REPOSITORY } from './feed.repository.js';
import { FeedService } from './feed.service.js';
import { PostgresFeedRepository } from './postgres-feed.repository.js';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [FeedController],
  providers: [
    FeedService,
    PostgresFeedRepository,
    {
      provide: FEED_REPOSITORY,
      useExisting: PostgresFeedRepository,
    },
  ],
})
export class FeedModule {}
