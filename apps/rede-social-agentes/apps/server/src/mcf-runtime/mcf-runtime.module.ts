import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database.module.js';
import { DatabaseService } from '../database.service.js';
import { IdentityModule } from '../identity/identity.module.js';
import { AdapterRegistry } from './adapter-registry.js';
import { ChatMissionPlanner } from './chat-mission-planner.js';
import { ChatRuntimeBridgeController } from './chat-runtime-bridge.controller.js';
import { ChatRuntimeBridgeService } from './chat-runtime-bridge.service.js';
import { EvidenceValidator } from './evidence-validator.js';
import { ExternalActionDispatcher } from './external-action-dispatcher.js';
import { GitHubCodeReviewAdapter } from './github-code-review.adapter.js';
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
  controllers: [
    MissionRuntimeController,
    McfCiCallbackController,
    ChatRuntimeBridgeController,
    SocialTimelineController,
  ],
  providers: [
    SkillRegistryLoader,
    PermissionEngine,
    EvidenceValidator,
    McfRuntimeTokenGuard,
    ChatMissionPlanner,
    {
      provide: GitHubCodeReviewAdapter,
      useFactory: (evidence: EvidenceValidator) => new GitHubCodeReviewAdapter(evidence),
      inject: [EvidenceValidator],
    },
    {
      provide: AdapterRegistry,
      useFactory: (githubReview: GitHubCodeReviewAdapter) =>
        new AdapterRegistry([githubReview]),
      inject: [GitHubCodeReviewAdapter],
    },
    {
      provide: ExternalActionDispatcher,
      useFactory: (registry: AdapterRegistry) => new ExternalActionDispatcher(registry),
      inject: [AdapterRegistry],
    },
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
        externalActions: ExternalActionDispatcher,
      ) => new SkillExecutor(registry, permissions, evidence, externalActions),
      inject: [
        SkillRegistryLoader,
        PermissionEngine,
        EvidenceValidator,
        ExternalActionDispatcher,
      ],
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
    {
      provide: ChatRuntimeBridgeService,
      useFactory: (runtime: MissionRuntimeService, planner: ChatMissionPlanner) =>
        new ChatRuntimeBridgeService(runtime, planner),
      inject: [MissionRuntimeService, ChatMissionPlanner],
    },
    SocialTimelineService,
  ],
  exports: [MissionRuntimeService, ChatRuntimeBridgeService, SocialTimelineService],
})
export class McfRuntimeModule {}
