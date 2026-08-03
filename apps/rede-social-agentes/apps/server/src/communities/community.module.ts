import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { CommunityController } from './community.controller.js';
import { COMMUNITY_REPOSITORY } from './community.repository.js';
import { CommunityService } from './community.service.js';
import { PostgresCommunityRepository } from './postgres-community.repository.js';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [CommunityController],
  providers: [
    CommunityService,
    PostgresCommunityRepository,
    {
      provide: COMMUNITY_REPOSITORY,
      useExisting: PostgresCommunityRepository,
    },
  ],
})
export class CommunityModule {}
