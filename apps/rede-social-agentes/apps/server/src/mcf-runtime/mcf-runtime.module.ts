import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { EvidenceValidator } from './evidence-validator.js';
import { McfCiCallbackController, MissionRuntimeController } from './mission-runtime.controller.js';
import { MissionRuntimeService } from './mission-runtime.service.js';
import { MCF_RUNTIME_REPOSITORY } from './mcf-runtime.repository.js';
import { PermissionEngine } from './permission-engine.js';
import { PostgresMcfRuntimeRepository } from './postgres-mcf-runtime.repository.js';
import { McfRuntimeTokenGuard } from './runtime-token.guard.js';
import { SkillExecutor } from './skill-executor.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';
import { SocialTimelineController } from './social-timeline.controller.js';
import { SocialTimelineService } from './social-timeline.service.js';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [MissionRuntimeController, McfCiCallbackController, SocialTimelineController],
  providers: [
    MissionRuntimeService,
    SocialTimelineService,
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
  exports: [MissionRuntimeService, SocialTimelineService],
})
export class McfRuntimeModule {}
