import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database.module.js';
import { IdentityModule } from '../identity/identity.module.js';
import { AgentController } from './agent.controller.js';
import { AGENT_REPOSITORY } from './agent.repository.js';
import { AgentService } from './agent.service.js';
import { PostgresAgentRepository } from './postgres-agent.repository.js';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [AgentController],
  providers: [
    AgentService,
    PostgresAgentRepository,
    {
      provide: AGENT_REPOSITORY,
      useExisting: PostgresAgentRepository,
    },
  ],
})
export class AgentModule {}
