import { Module } from '@nestjs/common';

import { DatabaseService } from '../database.service.js';
import { IdentityController } from './identity.controller.js';
import { IDENTITY_REPOSITORY } from './identity.repository.js';
import { IdentityService } from './identity.service.js';
import { PasswordService } from './password.service.js';
import { PostgresIdentityRepository } from './postgres-identity.repository.js';
import { SessionTokenService } from './session-token.service.js';

@Module({
  controllers: [IdentityController],
  providers: [
    DatabaseService,
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
