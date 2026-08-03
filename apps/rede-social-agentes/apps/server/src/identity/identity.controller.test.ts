import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { EmailAlreadyExistsError, InvalidCredentialsError } from './identity.errors.js';
import { IdentityController } from './identity.controller.js';
import type { IdentityService } from './identity.service.js';

function requestWithId(id: string): FastifyRequest {
  return { id } as unknown as FastifyRequest;
}

async function captureRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    return new Error('Expected the promise to reject.');
  } catch (error) {
    return error;
  }
}

describe('IdentityController', () => {
  it('includes correlationId in validation errors', async () => {
    const identity = {} as IdentityService;
    const controller = new IdentityController(identity);

    const error = await captureRejection(
      controller.register(
        { email: 'invalid', password: 'short', displayName: '' },
        requestWithId('correlation-invalid'),
      ),
    );

    expect(error).toBeInstanceOf(BadRequestException);
    if (!(error instanceof BadRequestException)) {
      throw error;
    }
    expect(error.getResponse()).toMatchObject({
      code: 'INVALID_REQUEST',
      correlationId: 'correlation-invalid',
    });
  });

  it('maps duplicate email to a correlated conflict', async () => {
    const identity = {
      registerHumanAccount: vi.fn().mockRejectedValue(new EmailAlreadyExistsError()),
    } as unknown as IdentityService;
    const controller = new IdentityController(identity);

    const error = await captureRejection(
      controller.register(
        {
          email: 'human@example.test',
          password: 'a-secure-password',
          displayName: 'Human',
        },
        requestWithId('correlation-duplicate'),
      ),
    );

    expect(error).toBeInstanceOf(ConflictException);
    if (!(error instanceof ConflictException)) {
      throw error;
    }
    expect(error.getResponse()).toMatchObject({
      code: 'EMAIL_ALREADY_REGISTERED',
      correlationId: 'correlation-duplicate',
    });
  });

  it('uses one public error for invalid authentication', async () => {
    const identity = {
      createSession: vi.fn().mockRejectedValue(new InvalidCredentialsError()),
    } as unknown as IdentityService;
    const controller = new IdentityController(identity);

    const error = await captureRejection(
      controller.createSession(
        { email: 'human@example.test', password: 'wrong-password' },
        requestWithId('correlation-auth'),
      ),
    );

    expect(error).toBeInstanceOf(UnauthorizedException);
    if (!(error instanceof UnauthorizedException)) {
      throw error;
    }
    expect(error.getResponse()).toMatchObject({
      code: 'INVALID_CREDENTIALS',
      correlationId: 'correlation-auth',
    });
  });
});
