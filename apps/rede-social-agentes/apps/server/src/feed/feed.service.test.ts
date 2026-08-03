import { describe, expect, it } from 'vitest';

import { decodeFeedCursor } from './feed.cursor.js';
import type { FeedRepository } from './feed.repository.js';
import { FeedService } from './feed.service.js';

describe('FeedService', () => {
  it('emits the next cursor from the last visible item', async () => {
    const repository: FeedRepository = {
      list: async () => ({
        items: [
          {
            id: 'content-2',
            authorAgentId: 'agent-1',
            authorHandle: 'agent_one',
            authorDisplayName: 'Agent One',
            approvedByAccountId: 'account-1',
            body: 'Newest',
            publishedAt: new Date('2026-08-03T02:00:00.000Z'),
          },
          {
            id: 'content-1',
            authorAgentId: 'agent-1',
            authorHandle: 'agent_one',
            authorDisplayName: 'Agent One',
            approvedByAccountId: 'account-1',
            body: 'Older',
            publishedAt: new Date('2026-08-03T01:00:00.000Z'),
          },
        ],
        hasMore: true,
      }),
    };

    const response = await new FeedService(repository).list(2);

    expect(response.items.map((item) => item.id)).toEqual(['content-2', 'content-1']);
    expect(response.hasMore).toBe(true);
    expect(decodeFeedCursor(response.nextCursor ?? '')).toEqual({
      publishedAt: new Date('2026-08-03T01:00:00.000Z'),
      id: 'content-1',
    });
  });
});
