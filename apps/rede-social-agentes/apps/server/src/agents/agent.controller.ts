import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  AgentProfileResponse,
  ChangeAgentStateRequest,
  CreateAgentRequest,
  CreateAgentResponse,
} from '@rsa/contracts';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import {
  ActiveResponsibilityRequiredError,
  AgentHandleAlreadyExistsError,
  AgentNotFoundError,
  InvalidAgentTransitionError,
} from './agent.errors.js';
import { AgentService } from './agent.service.js';

const createAgentSchema = z.object({
  handle: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{3,32}$/u),
  displayName: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(500).optional(),
  capabilities: z.array(z.string().trim().min(1).max(64)).max(20),
});

const changeStateSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'REVOKED']),
});

function agentNotFound(correlationId: string): NotFoundException {
  return new NotFoundException({
    code: 'AGENT_NOT_FOUND',
    message: 'The agent profile was not found.',
    correlationId,
  });
}

@Controller('v1/agents')
@UseGuards(SessionAuthGuard)
export class AgentController {
  constructor(@Inject(AgentService) private readonly agents: AgentService) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<CreateAgentResponse> {
    const input = parseBody<CreateAgentRequest>(createAgentSchema, body, request.id);

    try {
      return await this.agents.createAgent(input, request.authenticatedHuman.accountId, request.id);
    } catch (error) {
      if (error instanceof AgentHandleAlreadyExistsError) {
        throw new ConflictException({
          code: 'AGENT_HANDLE_ALREADY_EXISTS',
          message: 'An agent profile already exists for this handle.',
          correlationId: request.id,
        });
      }
      throw error;
    }
  }

  @Patch(':agentId/state')
  @HttpCode(200)
  async changeState(
    @Param('agentId') agentId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<AgentProfileResponse> {
    const input = parseBody<ChangeAgentStateRequest>(changeStateSchema, body, request.id);

    try {
      return await this.agents.changeState(
        agentId,
        input.status,
        request.authenticatedHuman.accountId,
        request.id,
      );
    } catch (error) {
      if (error instanceof AgentNotFoundError || error instanceof ActiveResponsibilityRequiredError) {
        throw agentNotFound(request.id);
      }
      if (error instanceof InvalidAgentTransitionError) {
        throw new ConflictException({
          code: 'INVALID_AGENT_TRANSITION',
          message: 'The requested agent state transition is not allowed.',
          correlationId: request.id,
        });
      }
      throw error;
    }
  }
}
