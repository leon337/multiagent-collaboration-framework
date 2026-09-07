import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { CreateSessionResponse } from '@rsa/contracts';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { parseBody } from '../http/parse-body.js';
import {
  InitialHumanBootstrapAlreadyInitializedError,
  InitialHumanBootstrapRegistrationTokenError,
  InitialHumanBootstrapService,
} from './initial-human-bootstrap.service.js';

const registerSchema = z
  .object({
    password: z.string().min(12).max(128),
    displayName: z.string().trim().min(2).max(80),
  })
  .strict();

function bearer(request: FastifyRequest): string | null {
  const raw = request.headers.authorization;
  return typeof raw === 'string' ? (/^Bearer\s+([^\s]+)$/iu.exec(raw)?.[1] ?? null) : null;
}

@Controller('v1/bootstrap')
export class InitialHumanBootstrapController {
  constructor(
    @Inject(InitialHumanBootstrapService) private readonly service: InitialHumanBootstrapService,
  ) {}

  @Post('initial-human')
  @HttpCode(201)
  async register(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
  ): Promise<CreateSessionResponse> {
    const presentedToken = bearer(request);
    if (!presentedToken) {
      throw new UnauthorizedException({
        code: 'INITIAL_HUMAN_BOOTSTRAP_UNAUTHORIZED',
        message: 'A valid initial-human registration token is required.',
        correlationId: request.id,
      });
    }
    const input = parseBody<{ password: string; displayName: string }>(
      registerSchema,
      body,
      request.id,
    );
    try {
      return await this.service.register(input, presentedToken, new Date(), request.id);
    } catch (error) {
      if (error instanceof InitialHumanBootstrapAlreadyInitializedError) {
        throw new ConflictException({
          code: 'INITIAL_HUMAN_ALREADY_INITIALIZED',
          message: error.message,
          correlationId: request.id,
        });
      }
      if (error instanceof InitialHumanBootstrapRegistrationTokenError) {
        throw new UnauthorizedException({
          code: 'INITIAL_HUMAN_BOOTSTRAP_UNAUTHORIZED',
          message: error.message,
          correlationId: request.id,
        });
      }
      throw error;
    }
  }
}
