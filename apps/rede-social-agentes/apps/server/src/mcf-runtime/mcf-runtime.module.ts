import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database.module.js';
import { DatabaseService } from '../database.service.js';
import { IdentityModule } from '../identity/identity.module.js';
import { EvidenceValidator } from './evidence-validator.js';
import { McfCiCallbackController, MissionRuntimeController } from './mission-runtime.controller.js';
import { MissionRuntimeService } from './mission-runtime.service.js';
import { MCF_RUNTIME_REPOSITORY, type McfRuntimeRepository } from './mcf-runtime.repository.js';
import { OrderedMcfRuntimeRepository } from './ordered-mcf-runtime.repository.js';
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
    SkillRegistryLoader,
    PermissionEngine,
    EvidenceValidator,
    McfRuntimeTokenGuard,
    {
      provide: PostgresMcfRuntimeRepository,
      useFactory: (database: DatabaseService) => new PostgresMcfRuntimeRepository(database),
      inject: [DatabaseService],
    },
    {
      provide: OrderedMcfRuntimeRepository,
      useFactory: (database: DatabaseService, delegate: PostgresMcfRuntimeRepository) =>
        new OrderedMcfRuntimeRepository(database, delegate),
      inject: [DatabaseService, PostgresMcfRuntimeRepository],
    },
    {
      provide: MCF_RUNTIME_REPOSITORY,
      useExisting: OrderedMcfRuntimeRepository,
    },
    {
      provide: SkillExecutor,
      useFactory: (
        registry: SkillRegistryLoader,
        permissions: PermissionEngine,
        evidence: EvidenceValidator,
      ) => new SkillExecutor(registry, permissions, evidence),
      inject: [SkillRegistryLoader, PermissionEngine, EvidenceValidator],
    },
    {
      provide: MissionRuntimeService,
      useFactory: (
        repository: McfRuntimeRepository,
        executor: SkillExecutor,
        registry: SkillRegistryLoader,
        evidence: EvidenceValidator,
      ) => new MissionRuntimeService(repository, executor, registry, evidence),
      inject: [MCF_RUNTIME_REPOSITORY, SkillExecutor, SkillRegistryLoader, EvidenceValidator],
    },
    SocialTimelineService,
  ],
  exports: [MissionRuntimeService, SocialTimelineService],
})
export class McfRuntimeModule {}
