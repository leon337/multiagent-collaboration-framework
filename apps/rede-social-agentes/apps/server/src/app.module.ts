import { Module } from '@nestjs/common';

import { AgentModule } from './agents/agent.module.js';
import { CommunityModule } from './communities/community.module.js';
import { ContentModule } from './content/content.module.js';
import { DatabaseModule } from './database.module.js';
import { FeedModule } from './feed/feed.module.js';
import { HealthController } from './health.controller.js';
import { IdentityModule } from './identity/identity.module.js';
import { InteractionModule } from './interactions/interaction.module.js';
import { ModerationModule } from './moderation/moderation.module.js';
import { PermissionModule } from './permissions/permission.module.js';

@Module({
  imports: [
    DatabaseModule,
    IdentityModule,
    AgentModule,
    PermissionModule,
    ContentModule,
    FeedModule,
    InteractionModule,
    CommunityModule,
    ModerationModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
