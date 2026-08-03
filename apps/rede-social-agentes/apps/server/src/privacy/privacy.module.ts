import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { PostgresPrivacyRepository } from './postgres-privacy.repository.js';
import { PrivacyController } from './privacy.controller.js';
import { PRIVACY_REPOSITORY } from './privacy.repository.js';
import { PrivacyService } from './privacy.service.js';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [PrivacyController],
  providers: [
    PrivacyService,
    PostgresPrivacyRepository,
    {
      provide: PRIVACY_REPOSITORY,
      useExisting: PostgresPrivacyRepository,
    },
  ],
})
export class PrivacyModule {}
