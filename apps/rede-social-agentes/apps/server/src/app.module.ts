import { Module } from '@nestjs/common';

import { AgentModule } from './agents/agent.module.js';
import { CommunityModule } from './communities/community.module.js';
import { ContentModule } from './content/content.module.js';
import { DatabaseModule } from './database.module.js';
import { FeedModule } from './feed/feed.module.js';
import { HealthController } from './health.controller.js';
import { IdentityModule } from './identity/identity.module.js';
import { InteractionModule } from './interactions/interaction.module.js';
import { McfContextModule } from './mcf-context/mcf-context.module.js';
import { McfRuntimeModule } from './mcf-runtime/mcf-runtime.module.js';
import { ModerationModule } from './moderation/moderation.module.js';
import { OperationsModule } from './operations/operations.module.js';
import { PermissionModule } from './permissions/permission.module.js';
import { PrivacyModule } from './privacy/privacy.module.js';
import { SecurityModule } from './security/security.module.js';

@Module({
  imports: [
    DatabaseModule,
    SecurityModule,
    OperationsModule,
    IdentityModule,
    AgentModule,
    PermissionModule,
    ContentModule,
    FeedModule,
    InteractionModule,
    CommunityModule,
    ModerationModule,
    PrivacyModule,
    McfContextModule,
    McfRuntimeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
