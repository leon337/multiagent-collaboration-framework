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
import { ExternalActionLedger } from './external-action-ledger.js';
import { GitHubBranchPullRequestAdapter } from './github-branch-pr.adapter.js';
import { GitHubCiQueryAdapter } from './github-ci-query.adapter.js';
import { GitHubCodeReviewAdapter } from './github-code-review.adapter.js';
import { GitHubActionsStagingDeployAdapter } from './github-staging-deploy.adapter.js';
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
import { McfStagingDeployCallbackController } from './staging-deploy-callback.controller.js';
import { StagingDeployReconciliationService } from './staging-deploy-reconciliation.service.js';
import { SocialTimelineService } from './social-timeline.service.js';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [
    MissionRuntimeController,
    McfCiCallbackController,
    McfStagingDeployCallbackController,
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
      provide: GitHubCiQueryAdapter,
      useFactory: (evidence: EvidenceValidator) => new GitHubCiQueryAdapter(evidence),
      inject: [EvidenceValidator],
    },
    {
      provide: GitHubBranchPullRequestAdapter,
      useFactory: (evidence: EvidenceValidator) => new GitHubBranchPullRequestAdapter(evidence),
      inject: [EvidenceValidator],
    },
    {
      provide: GitHubActionsStagingDeployAdapter,
      useFactory: (evidence: EvidenceValidator) => new GitHubActionsStagingDeployAdapter(evidence),
      inject: [EvidenceValidator],
    },
    {
      provide: AdapterRegistry,
      useFactory: (
        githubReview: GitHubCodeReviewAdapter,
        githubCiQuery: GitHubCiQueryAdapter,
        githubBranchPr: GitHubBranchPullRequestAdapter,
        githubStagingDeploy: GitHubActionsStagingDeployAdapter,
      ) => new AdapterRegistry([githubReview, githubCiQuery, githubBranchPr, githubStagingDeploy]),
      inject: [
        GitHubCodeReviewAdapter,
        GitHubCiQueryAdapter,
        GitHubBranchPullRequestAdapter,
        GitHubActionsStagingDeployAdapter,
      ],
    },
    {
      provide: ExternalActionLedger,
      useFactory: (database: DatabaseService) => new ExternalActionLedger(database),
      inject: [DatabaseService],
    },
    {
      provide: ExternalActionDispatcher,
      useFactory: (registry: AdapterRegistry, ledger: ExternalActionLedger) =>
        new ExternalActionDispatcher(registry, ledger),
      inject: [AdapterRegistry, ExternalActionLedger],
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
      inject: [SkillRegistryLoader, PermissionEngine, EvidenceValidator, ExternalActionDispatcher],
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
    StagingDeployReconciliationService,
    SocialTimelineService,
  ],
  exports: [MissionRuntimeService, ChatRuntimeBridgeService, SocialTimelineService],
})
export class McfRuntimeModule {}
