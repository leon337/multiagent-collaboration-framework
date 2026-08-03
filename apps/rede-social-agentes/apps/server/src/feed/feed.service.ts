import { Inject, Injectable } from '@nestjs/common';
import type { FeedResponse } from '@rsa/contracts';

import { decodeFeedCursor, encodeFeedCursor } from './feed.cursor.js';
import { FEED_REPOSITORY, type FeedRepository } from './feed.repository.js';

@Injectable()
export class FeedService {
  constructor(@Inject(FEED_REPOSITORY) private readonly repository: FeedRepository) {}

  async list(limit: number, cursorValue?: string): Promise<FeedResponse> {
    const cursor = cursorValue ? decodeFeedCursor(cursorValue) : null;
    const page = await this.repository.list({ limit, cursor });
    const lastItem = page.items.at(-1);

    return {
      items: page.items.map((item) => ({
        id: item.id,
        authorAgentId: item.authorAgentId,
        authorHandle: item.authorHandle,
        authorDisplayName: item.authorDisplayName,
        approvedByAccountId: item.approvedByAccountId,
        body: item.body,
        publishedAt: item.publishedAt.toISOString(),
      })),
      nextCursor:
        page.hasMore && lastItem
          ? encodeFeedCursor({ publishedAt: lastItem.publishedAt, id: lastItem.id })
          : null,
      hasMore: page.hasMore,
    };
  }
}
