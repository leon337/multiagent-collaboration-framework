import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  Inject,
  NotFoundException,
  Post,
  Req,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import type { McfChatDispatchRequest, McfChatDispatchResponse } from '@rsa/contracts';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import { ChatRuntimeBridgeService } from './chat-runtime-bridge.service.js';
import {
  McfEvidenceRejectedError,
  McfMissionNotFoundError,
  McfMissionVersionConflictError,
  McfPermissionDeniedError,
  McfPhaseNotFoundError,
  McfSkillInputError,
  McfSkillNotExecutableError,
  McfSkillNotFoundError,
} from './mcf-runtime.errors.js';

const sourceList = z.array(z.string().trim().min(1).max(512)).max(100);
const executableSkill = z.enum(['MCF-START-MISSION', 'MCF-IMPLEMENT-CHANGE', 'MCF-RUN-TESTS']);

const chatDispatchSchema = z.object({
  objective: z.string().trim().min(10).max(4_000),
  expectedOutcome: z.string().trim().min(5).max(4_000).optional(),
  repository: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u)
    .optional(),
  sourceOfTruth: sourceList.optional(),
  requestedRiskClass: z.enum(['A', 'B', 'C']).optional(),
  requestedSkills: z.array(executableSkill).min(1).max(3).optional(),
});

function rethrowBridgeError(error: unknown, correlationId: string): never {
  if (error instanceof McfMissionNotFoundError || error instanceof McfPhaseNotFoundError) {
    throw new NotFoundException({
      code: 'MCF_RESOURCE_NOT_FOUND',
      message: error.message,
      correlationId,
    });
  }
  if (error instanceof McfMissionVersionConflictError) {
    throw new ConflictException({
      code: 'MCF_VERSION_CONFLICT',
      message: error.message,
      correlationId,
    });
  }
  if (error instanceof McfPermissionDeniedError) {
    throw new ForbiddenException({
      code: 'MCF_PERMISSION_DENIED',
      message: error.message,
      correlationId,
    });
  }
  if (
    error instanceof McfSkillInputError ||
    error instanceof McfSkillNotFoundError ||
    error instanceof McfSkillNotExecutableError ||
    error instanceof McfEvidenceRejectedError
  ) {
    throw new UnprocessableEntityException({
      code: 'MCF_EXECUTION_REJECTED',
      message: error.message,
      correlationId,
    });
  }
  throw error;
}

@Controller('v1/mcf/chat')
@UseGuards(SessionAuthGuard)
export class ChatRuntimeBridgeController {
  constructor(
    @Inject(ChatRuntimeBridgeService) private readonly bridge: ChatRuntimeBridgeService,
  ) {}

  @Post('dispatch')
  @HttpCode(201)
  async dispatch(
    @Body() body: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<McfChatDispatchResponse> {
    const input = parseBody<McfChatDispatchRequest>(chatDispatchSchema, body, request.id);
    try {
      return await this.bridge.dispatch(input);
    } catch (error) {
      rethrowBridgeError(error, request.id);
    }
  }
}
