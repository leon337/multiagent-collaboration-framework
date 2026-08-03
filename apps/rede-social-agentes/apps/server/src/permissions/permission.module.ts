import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { PermissionController } from './permission.controller.js';
import { PERMISSION_REPOSITORY } from './permission.repository.js';
import { PermissionService } from './permission.service.js';
import { PostgresPermissionRepository } from './postgres-permission.repository.js';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [PermissionController],
  providers: [
    PermissionService,
    PostgresPermissionRepository,
    {
      provide: PERMISSION_REPOSITORY,
      useExisting: PostgresPermissionRepository,
    },
  ],
})
export class PermissionModule {}
