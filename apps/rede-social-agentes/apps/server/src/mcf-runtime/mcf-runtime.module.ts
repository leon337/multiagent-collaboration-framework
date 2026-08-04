import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { EvidenceValidator } from './evidence-validator.js';
import {
  McfCiCallbackController,
  MissionRuntimeController,
} from './mission-runtime.controller.js';
import { MissionRuntimeService } from './mission-runtime.service.js';
import { MCF_RUNTIME_REPOSITORY } from './mcf-runtime.repository.js';
import { PermissionEngine } from './permission-engine.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';
import { McfRuntimeTokenGuard } from './runtime-token.guard.js';
import { SkillExecutor } from './skill-executor.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [MissionRuntimeController, McfCiCallbackController],
  providers: [
    MissionRuntimeService,
    SkillRegistryLoader,
    PermissionEngine,
    EvidenceValidator,
    SkillExecutor,
    McfRuntimeTokenGuard,
    PostgresMcfRuntimeRepository,
    {
      provide: MCF_RUNTIME_REPOSITORY,
      useExisting: PostgresMcfRuntimeRepository,
    },
  ],
  exports: [MissionRuntimeService],
})
export class McfRuntimeModule {}
