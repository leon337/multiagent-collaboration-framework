import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database.module.js';
import { IdentityController } from './identity.controller.js';
import { IDENTITY_REPOSITORY } from './identity.repository.js';
import { IdentityService } from './identity.service.js';
import { PasswordService } from './password.service.js';
import { PostgresIdentityRepository } from './postgres-identity.repository.js';
import { SessionTokenService } from './session-token.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [IdentityController],
  providers: [
    IdentityService,
    PasswordService,
    SessionTokenService,
    PostgresIdentityRepository,
    {
      provide: IDENTITY_REPOSITORY,
      useExisting: PostgresIdentityRepository,
    },
  ],
})
export class IdentityModule {}
