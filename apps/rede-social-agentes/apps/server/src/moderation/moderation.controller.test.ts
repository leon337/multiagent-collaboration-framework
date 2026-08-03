import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { ModerationController } from './moderation.controller.js';
import {
  ModerationOperatorAccessDeniedError,
  ModerationTargetNotAvailableError,
} from './moderation.errors.js';
import type { ModerationRepository } from './moderation.repository.js';
import { ModerationService } from './moderation.service.js';

function request(): AuthenticatedHumanRequest {
  return {
    id: 'correlation-moderation',
    authenticatedHuman: {
      accountId: 'account-1',
      email: 'reporter@example.test',
      displayName: 'Reporter',
      sessionId: 'session-1',
      sessionExpiresAt: new Date(Date.now() + 60_000),
    },
  } as unknown as AuthenticatedHumanRequest;
}

describe('ModerationController', () => {
  it('does not reveal whether the reported target exists', async () => {
    const repository = {
      createReport: async () => {
        throw new ModerationTargetNotAvailableError();
      },
    } as unknown as ModerationRepository;
    const controller = new ModerationController(new ModerationService(repository));

    try {
      await controller.createReport(
        { targetType: 'CONTENT', targetId: 'hidden', reason: 'SPAM' },
        request(),
      );
      throw new Error('Expected target rejection.');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
      expect(error.getResponse()).toEqual({
        code: 'MODERATION_RESOURCE_NOT_AVAILABLE',
        message: 'The moderation resource is not available.',
        correlationId: 'correlation-moderation',
      });
    }
  });

  it('blocks the moderation queue for non-operators', async () => {
    const repository = {
      listCases: async () => {
        throw new ModerationOperatorAccessDeniedError();
      },
    } as unknown as ModerationRepository;
    const controller = new ModerationController(new ModerationService(repository));

    try {
      await controller.listCases({ limit: '20' }, request());
      throw new Error('Expected operator access rejection.');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      if (!(error instanceof ForbiddenException)) {
        throw error;
      }
      expect(error.getResponse()).toEqual({
        code: 'MODERATION_OPERATOR_ACCESS_DENIED',
        message: 'Operator access is required.',
        correlationId: 'correlation-moderation',
      });
    }
  });
});
