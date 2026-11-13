import { Body, Controller, HttpCode, Inject, Post, Req, UseGuards } from '@nestjs/common';
import type { McfChatDispatchRequest } from '@rsa/contracts';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
import {
  ChatRuntimeBridgeService,
  type McfChatRuntimeDispatchResult,
} from './chat-runtime-bridge.service.js';
import { rethrowRuntimeError } from './mcf-runtime.http-error.js';

const sourceList = z.array(z.string().trim().min(1).max(512)).max(100);
const executableSkill = z.enum([
  'MCF-START-MISSION',
  'MCF-SELECT-AGENTS',
  'MCF-IMPLEMENT-CHANGE',
  'MCF-REVIEW-CODE',
  'MCF-RUN-TESTS',
  'MCF-GIT-PR-RELEASE',
  'MCF-DEPLOY-VALIDATE',
  'MCF-OPERATE-DUAL-BROWSER',
  'MCF-AUTONOMOUS-BROWSER-RESEARCH',
  'MCF-TRACE-MISSION',
]);

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
  requestedSkills: z.array(executableSkill).min(1).max(8).optional(),
});

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
  ): Promise<McfChatRuntimeDispatchResult> {
    const input = parseBody<McfChatDispatchRequest>(chatDispatchSchema, body, request.id);
    try {
      return await this.bridge.dispatch(input, {
        authenticatedAccountId: request.authenticatedHuman.accountId,
      });
    } catch (error) {
      rethrowRuntimeError(error, request.id);
    }
  }
}
