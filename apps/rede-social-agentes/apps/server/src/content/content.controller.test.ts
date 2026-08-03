import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { PermissionResourceAccessDeniedError } from '../permissions/permission.errors.js';
import { ContentController } from './content.controller.js';
import {
  ContentPermissionDeniedError,
  ContentResourceAccessDeniedError,
  ContentStateConflictError,
} from './content.errors.js';
import type { ContentService } from './content.service.js';

function requestWithHuman(correlationId: string): AuthenticatedHumanRequest {
  return {
    id: correlationId,
    authenticatedHuman: {
      accountId: 'account-1',
      email: 'human@example.test',
      displayName: 'Human',
      sessionId: 'session-1',
      sessionExpiresAt: new Date(Date.now() + 60_000),
    },
  } as unknown as AuthenticatedHumanRequest;
}

async function captureRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    return new Error('Expected the promise to reject.');
  } catch (error) {
    return error;
  }
}

describe('ContentController', () => {
  it.each([new ContentResourceAccessDeniedError(), new PermissionResourceAccessDeniedError()])(
    'returns one public response for unavailable resources',
    async (domainError) => {
      const content = {
        publish: vi.fn().mockRejectedValue(domainError),
      } as unknown as ContentService;
      const controller = new ContentController(content);
      const request = requestWithHuman('correlation-content-missing');

      const error = await captureRejection(controller.publish('content-1', request));

      expect(error).toBeInstanceOf(NotFoundException);
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
      expect(error.getResponse()).toEqual({
        code: 'CONTENT_RESOURCE_NOT_AVAILABLE',
        message: 'The content resource is not available.',
        correlationId: 'correlation-content-missing',
      });
    },
  );

  it('preserves the permission reason without exposing grant details', async () => {
    const content = {
      createDraft: vi.fn().mockRejectedValue(new ContentPermissionDeniedError('QUOTA_EXHAUSTED')),
    } as unknown as ContentService;
    const controller = new ContentController(content);
    const request = requestWithHuman('correlation-content-denied');

    const error = await captureRejection(
      controller.createDraft('agent-1', { body: 'Draft' }, request),
    );

    expect(error).toBeInstanceOf(ForbiddenException);
    if (!(error instanceof ForbiddenException)) {
      throw error;
    }
    expect(error.getResponse()).toEqual({
      code: 'CONTENT_PERMISSION_DENIED',
      message: 'The agent is not authorized to create this draft.',
      correlationId: 'correlation-content-denied',
      details: { reason: 'QUOTA_EXHAUSTED' },
    });
  });

  it('maps repeated publication to a conflict', async () => {
    const content = {
      publish: vi.fn().mockRejectedValue(new ContentStateConflictError()),
    } as unknown as ContentService;
    const controller = new ContentController(content);
    const request = requestWithHuman('correlation-content-conflict');

    const error = await captureRejection(controller.publish('content-1', request));

    expect(error).toBeInstanceOf(ConflictException);
  });
});
