import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import type { AuthenticatedHumanRequest } from '../identity/authenticated-request.js';
import { CommunityController } from './community.controller.js';
import { CommunityAgentNotAvailableError } from './community.errors.js';
import type { CommunityRepository } from './community.repository.js';
import { CommunityService } from './community.service.js';

function request(): AuthenticatedHumanRequest {
  return {
    id: 'correlation-community',
    authenticatedHuman: {
      accountId: 'account-1',
      email: 'owner@example.test',
      displayName: 'Owner',
      sessionId: 'session-1',
      sessionExpiresAt: new Date(Date.now() + 60_000),
    },
  } as unknown as AuthenticatedHumanRequest;
}

describe('CommunityController', () => {
  it('does not reveal whether an agent or responsibility exists', async () => {
    const repository = {
      joinAgent: async () => {
        throw new CommunityAgentNotAvailableError();
      },
    } as unknown as CommunityRepository;
    const controller = new CommunityController(new CommunityService(repository));

    try {
      await controller.joinAgent('community-1', 'agent-1', request());
      throw new Error('Expected community resource rejection.');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
      expect(error.getResponse()).toEqual({
        code: 'COMMUNITY_RESOURCE_NOT_AVAILABLE',
        message: 'The community resource is not available.',
        correlationId: 'correlation-community',
      });
    }
  });

  it('returns a correlated error for an invalid member cursor', async () => {
    const repository = {
      listMembers: async () => ({ items: [], hasMore: false }),
    } as unknown as CommunityRepository;
    const controller = new CommunityController(new CommunityService(repository));

    try {
      await controller.listMembers(
        'community-1',
        { limit: '20', cursor: 'invalid' },
        request(),
      );
      throw new Error('Expected invalid cursor rejection.');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      if (!(error instanceof BadRequestException)) {
        throw error;
      }
      expect(error.getResponse()).toEqual({
        code: 'INVALID_COMMUNITY_CURSOR',
        message: 'The community member cursor is invalid.',
        correlationId: 'correlation-community',
      });
    }
  });
});
