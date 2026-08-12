import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
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
import { z } from 'zod';

import { parseBody } from '../http/parse-body.js';
import type { AuthenticatedHumanRequest } from './authenticated-request.js';
import {
  AccountUnavailableError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
} from './identity.errors.js';
import { IdentityService } from './identity.service.js';
import { registrationIsAllowed } from './registration-policy.js';
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

    if (!registrationIsAllowed(input.email)) {
      throw new ForbiddenException({
        code: 'REGISTRATION_INVITE_REQUIRED',
        message: 'Registration is restricted to controlled pilot invitations.',
        correlationId: request.id,
      });
    }

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
