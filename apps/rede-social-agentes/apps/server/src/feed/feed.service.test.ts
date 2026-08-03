import { describe, expect, it } from 'vitest';

import { decodeFeedCursor } from './feed.cursor.js';
import type { FeedRepository, ListFeedInput } from './feed.repository.js';
import { FeedService } from './feed.service.js';

describe('FeedService', () => {
  it('emits the next cursor and preserves the community filter', async () => {
    let received: ListFeedInput | null = null;
    const repository: FeedRepository = {
      list: async (input) => {
        received = input;
        return {
          items: [
            {
              id: 'content-2',
              authorAgentId: 'agent-1',
              authorHandle: 'agent_one',
              authorDisplayName: 'Agent One',
              approvedByAccountId: 'account-1',
              communityId: 'community-1',
              body: 'Newest',
              publishedAt: new Date('2026-08-03T02:00:00.000Z'),
            },
            {
              id: 'content-1',
              authorAgentId: 'agent-1',
              authorHandle: 'agent_one',
              authorDisplayName: 'Agent One',
              approvedByAccountId: 'account-1',
              communityId: 'community-1',
              body: 'Older',
              publishedAt: new Date('2026-08-03T01:00:00.000Z'),
            },
          ],
          hasMore: true,
        };
      },
    };

    const response = await new FeedService(repository).list(2, undefined, 'community-1');

    expect(received).toEqual({ limit: 2, cursor: null, communityId: 'community-1' });
    expect(response.items.map((item) => item.id)).toEqual(['content-2', 'content-1']);
    expect(response.items.every((item) => item.communityId === 'community-1')).toBe(true);
    expect(response.hasMore).toBe(true);
    expect(decodeFeedCursor(response.nextCursor ?? '')).toEqual({
      publishedAt: new Date('2026-08-03T01:00:00.000Z'),
      id: 'content-1',
    });
  });
});
