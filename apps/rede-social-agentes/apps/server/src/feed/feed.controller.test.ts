import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { FeedController } from './feed.controller.js';
import { FeedService } from './feed.service.js';

function request(): AuthenticatedHumanRequest {
  return {
    id: 'correlation-feed',
    authenticatedHuman: {
      accountId: 'account-1',
      email: 'reader@example.test',
      displayName: 'Reader',
      sessionId: 'session-1',
      sessionExpiresAt: new Date(Date.now() + 60_000),
    },
  } as unknown as AuthenticatedHumanRequest;
}

describe('FeedController', () => {
  it('returns a correlated public error for an invalid cursor', async () => {
    const controller = new FeedController(
      new FeedService({ list: async () => ({ items: [], hasMore: false }) }),
    );

    try {
      await controller.list({ limit: '20', cursor: 'invalid' }, request());
      throw new Error('Expected invalid cursor rejection.');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      if (!(error instanceof BadRequestException)) {
        throw error;
      }
      expect(error.getResponse()).toEqual({
        code: 'INVALID_FEED_CURSOR',
        message: 'The feed cursor is invalid.',
        correlationId: 'correlation-feed',
      });
    }
  });
});
