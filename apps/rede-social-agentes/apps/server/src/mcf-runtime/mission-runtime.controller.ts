import { randomUUID } from 'node:crypto';

import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import type {
  CreateMcfMissionRequest,
  ExecuteMcfPhaseRequest,
  McfCiCallbackRequest,
  McfCiCallbackResponse,
  McfMissionResponse,
  McfMissionTimelineResponse,
  McfPhaseExecutionResponse,
} from '@rsa/contracts';
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { SessionAuthGuard } from '../identity/session-auth.guard.js';
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
import type { AuthenticatedHumanExecutionProof } from './human-authority-proof.js';
import { MissionRuntimeService } from './mission-runtime.service.js';
import { McfRuntimeTokenGuard } from './runtime-token.guard.js';

const stringList = z.array(z.string().trim().min(1).max(256)).max(100);

const missionContractSchema = z.object({
  title: z.string().trim().min(3).max(160),
  objective: z.string().trim().min(10).max(4_000),
  expectedOutcome: z.string().trim().min(5).max(4_000),
  scope: stringList.min(1),
  outOfScope: stringList,
  acceptanceCriteria: stringList.min(1),
  riskClass: z.enum(['A', 'B', 'C']),
  selectedAgents: stringList.min(1),
  selectedSkills: stringList.min(1),
  sourceOfTruth: stringList,
  parentMissionId: z.string().uuid().nullable().optional(),
  returnToAgentId: z.string().trim().min(1).max(128).nullable().optional(),
  returnStatus: z.enum(['NOT_APPLICABLE', 'PENDING', 'COMPLETED']).optional(),
});

const createMissionSchema = z.object({ contract: missionContractSchema });

const receiptSchema = z.object({
  receiptId: z.string().uuid(),
  provider: z.string().trim().min(1).max(64),
  operation: z.string().trim().min(1).max(128),
  resource: z.string().trim().min(1).max(512),
  externalId: z.string().trim().min(1).max(256).nullable(),
  commitSha: z
    .string()
    .regex(/^[a-f0-9]{7,64}$/u)
    .nullable(),
  status: z.enum(['SUCCEEDED', 'FAILED', 'PARTIAL']),
  observedAt: z.string().datetime({ offset: true }),
  payloadDigest: z.string().regex(/^[a-f0-9]{64}$/u),
  signature: z.string().regex(/^[a-f0-9]{64}$/u),
  metadata: z.record(z.string(), z.unknown()),
});

const executePhaseSchema = z.object({
  phaseId: z.string().uuid().optional(),
  skillId: z.string().trim().min(1).max(128),
  agentId: z.string().trim().min(1).max(128),
  inputs: z.record(z.string(), z.unknown()),
  tool: z.object({
    provider: z.string().trim().min(1).max(64),
    operation: z.string().trim().min(1).max(128),
    resource: z.string().trim().min(1).max(512),
    externalReceipt: receiptSchema.optional(),
  }),
  expectedMissionVersion: z.number().int().positive(),
});

const ciCallbackSchema = z.object({
  missionId: z.string().uuid(),
  phaseId: z.string().uuid(),
  workflowName: z.string().trim().min(1).max(256),
  workflowRunId: z.string().trim().min(1).max(128),
  repository: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u),
  commitSha: z.string().regex(/^[a-f0-9]{40,64}$/u),
  conclusion: z.enum(['success', 'failure', 'cancelled', 'timed_out', 'skipped']),
  completedAt: z.string().datetime({ offset: true }),
});

function rethrowRuntimeError(error: unknown, correlationId: string): never {
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

@Controller('v1/mcf/missions')
@UseGuards(SessionAuthGuard)
export class MissionRuntimeController {
  constructor(@Inject(MissionRuntimeService) private readonly runtime: MissionRuntimeService) {}

  @Post()
  @HttpCode(201)
  async createMission(
    @Body() body: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<McfMissionResponse> {
    const input = parseBody<CreateMcfMissionRequest>(createMissionSchema, body, request.id);
    try {
      return await this.runtime.createMission(input);
    } catch (error) {
      rethrowRuntimeError(error, request.id);
    }
  }

  @Get(':missionId')
  async getMission(
    @Param('missionId') missionId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<McfMissionResponse> {
    try {
      return await this.runtime.getMission(missionId);
    } catch (error) {
      rethrowRuntimeError(error, request.id);
    }
  }

  @Post(':missionId/phases/execute')
  @HttpCode(200)
  async executePhase(
    @Param('missionId') missionId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<McfPhaseExecutionResponse> {
    const input = parseBody<ExecuteMcfPhaseRequest>(executePhaseSchema, body, request.id);
    const authenticatedHuman: AuthenticatedHumanExecutionProof = {
      accountId: request.authenticatedHuman.accountId,
      sourceRef: `human-authority:${randomUUID()}`,
    };
    try {
      return await this.runtime.executePhase(missionId, input, authenticatedHuman);
    } catch (error) {
      rethrowRuntimeError(error, request.id);
    }
  }

  @Get(':missionId/timeline')
  async timeline(
    @Param('missionId') missionId: string,
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<McfMissionTimelineResponse> {
    try {
      return await this.runtime.timeline(missionId);
    } catch (error) {
      rethrowRuntimeError(error, request.id);
    }
  }
}

@Controller('v1/mcf/callbacks')
@UseGuards(McfRuntimeTokenGuard)
export class McfCiCallbackController {
  constructor(@Inject(MissionRuntimeService) private readonly runtime: MissionRuntimeService) {}

  @Post('github-actions')
  @HttpCode(202)
  async acceptGithubActions(
    @Body() body: unknown,
    @Req() request: { id: string },
  ): Promise<McfCiCallbackResponse> {
    const input = parseBody<McfCiCallbackRequest>(ciCallbackSchema, body, request.id);
    try {
      return await this.runtime.acceptCiCallback(input);
    } catch (error) {
      rethrowRuntimeError(error, request.id);
    }
  }
}
