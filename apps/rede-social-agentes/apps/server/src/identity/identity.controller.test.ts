import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  it('rejects production registration outside the controlled invitation allowlist', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('REGISTRATION_ALLOWLIST', 'invited@example.test');
    const identity = {
      registerHumanAccount: vi.fn(),
    } as unknown as IdentityService;
    const controller = new IdentityController(identity);

    const error = await captureRejection(
      controller.register(
        {
          email: 'public@example.test',
          password: 'a-secure-password',
          displayName: 'Public',
        },
        requestWithId('correlation-invite'),
      ),
    );

    expect(error).toBeInstanceOf(ForbiddenException);
    if (!(error instanceof ForbiddenException)) {
      throw error;
    }
    expect(error.getResponse()).toMatchObject({
      code: 'REGISTRATION_INVITE_REQUIRED',
      correlationId: 'correlation-invite',
    });
    expect(identity.registerHumanAccount).not.toHaveBeenCalled();
  });

  it('allows a controlled invited account in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('REGISTRATION_ALLOWLIST', 'Invited@Example.Test');
    const identity = {
      registerHumanAccount: vi.fn().mockResolvedValue({ id: 'account-1' }),
    } as unknown as IdentityService;
    const controller = new IdentityController(identity);

    await expect(
      controller.register(
        {
          email: 'invited@example.test',
          password: 'a-secure-password',
          displayName: 'Invited',
        },
        requestWithId('correlation-allowed'),
      ),
    ).resolves.toMatchObject({ id: 'account-1' });
    expect(identity.registerHumanAccount).toHaveBeenCalledOnce();
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
