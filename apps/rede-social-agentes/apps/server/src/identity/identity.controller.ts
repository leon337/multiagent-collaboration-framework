import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  HttpCode,
  Inject,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  HumanAccountResponse,
  RegisterHumanAccountRequest,
  RevokeSessionResponse,
} from '@rsa/contracts';
import type { FastifyRequest } from 'fastify';
import { z, type ZodType } from 'zod';

import type { AuthenticatedHumanRequest } from './authenticated-request.js';
import {
  AccountUnavailableError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
} from './identity.errors.js';
import { IdentityService } from './identity.service.js';
import { SessionAuthGuard } from './session-auth.guard.js';

const registerSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(2).max(80),
});

const sessionSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
});

function parseBody<TValue>(schema: ZodType<TValue>, body: unknown, correlationId: string): TValue {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException({
      code: 'INVALID_REQUEST',
      message: 'The request body is invalid.',
      correlationId,
      details: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  return result.data;
}

@Controller('v1')
export class IdentityController {
  constructor(@Inject(IdentityService) private readonly identity: IdentityService) {}

  @Post('accounts')
  @HttpCode(201)
  async register(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
  ): Promise<HumanAccountResponse> {
    const input = parseBody<RegisterHumanAccountRequest>(registerSchema, body, request.id);

    try {
      return await this.identity.registerHumanAccount(input, request.id);
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'A human account already exists for this email.',
          correlationId: request.id,
        });
      }
      throw error;
    }
  }

  @Post('sessions')
  @HttpCode(200)
  async createSession(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
  ): Promise<CreateSessionResponse> {
    const input = parseBody<CreateSessionRequest>(sessionSchema, body, request.id);

    try {
      return await this.identity.createSession(input.email, input.password, request.id);
    } catch (error) {
      if (error instanceof InvalidCredentialsError || error instanceof AccountUnavailableError) {
        throw new UnauthorizedException({
          code: 'INVALID_CREDENTIALS',
          message: 'The email or password is invalid.',
          correlationId: request.id,
        });
      }
      throw error;
    }
  }

  @Delete('sessions/current')
  @UseGuards(SessionAuthGuard)
  @HttpCode(200)
  async revokeCurrentSession(
    @Req() request: AuthenticatedHumanRequest,
  ): Promise<RevokeSessionResponse> {
    return this.identity.revokeSession(
      request.authenticatedHuman.sessionId,
      request.authenticatedHuman.accountId,
      request.id,
    );
  }
}
