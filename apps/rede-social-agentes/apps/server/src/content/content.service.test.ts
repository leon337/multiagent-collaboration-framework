import { describe, expect, it } from 'vitest';

import type {
  ContentRepository,
  CreateDraftInput,
  SocialContentRecord,
} from './content.repository.js';
import { ContentService } from './content.service.js';

class MemoryContentRepository implements ContentRepository {
  createInput: CreateDraftInput | null = null;

  private record(status: SocialContentRecord['status'] = 'DRAFT'): SocialContentRecord {
    return {
      id: 'content-1',
      authorAgentId: 'agent-1',
      responsibleAccountId: 'account-1',
      approvedByAccountId: status === 'PUBLISHED' ? 'account-1' : null,
      body: 'Draft body',
      status,
      createdAt: new Date('2026-08-02T22:42:00-03:00'),
      publishedAt: status === 'PUBLISHED' ? new Date('2026-08-02T22:45:00-03:00') : null,
      archivedAt: status === 'ARCHIVED' ? new Date('2026-08-02T22:50:00-03:00') : null,
    };
  }

  async createDraft(input: CreateDraftInput): Promise<SocialContentRecord> {
    this.createInput = input;
    return { ...this.record(), id: input.id, body: input.body };
  }

  async publish(): Promise<SocialContentRecord> {
    return this.record('PUBLISHED');
  }

  async archive(): Promise<SocialContentRecord> {
    return this.record('ARCHIVED');
  }

  async get(): Promise<SocialContentRecord> {
    return this.record();
  }
}

describe('ContentService', () => {
  it('normalizes text and preserves supervised authorship', async () => {
    const repository = new MemoryContentRepository();
    const service = new ContentService(repository);

    const response = await service.createDraft(
      'agent-1',
      {
        body: '  Draft body  ',
        scope: { resourceType: 'community', resourceId: 'community-1' },
      },
      'account-1',
      'correlation-1',
    );

    expect(repository.createInput).toMatchObject({
      agentId: 'agent-1',
      responsibleAccountId: 'account-1',
      body: 'Draft body',
      scope: { resourceType: 'community', resourceId: 'community-1' },
      correlationId: 'correlation-1',
    });
    expect(response).toMatchObject({
      authorAgentId: 'agent-1',
      responsibleAccountId: 'account-1',
      status: 'DRAFT',
      body: 'Draft body',
    });
  });

  it('maps human publication separately from agent authorship', async () => {
    const repository = new MemoryContentRepository();
    const service = new ContentService(repository);

    const response = await service.publish('content-1', 'account-1', 'correlation-publish');

    expect(response).toMatchObject({
      authorAgentId: 'agent-1',
      approvedByAccountId: 'account-1',
      status: 'PUBLISHED',
    });
    expect(response.publishedAt).not.toBeNull();
  });
});
