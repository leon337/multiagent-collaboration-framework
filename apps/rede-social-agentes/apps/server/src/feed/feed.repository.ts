export const FEED_REPOSITORY = Symbol('FEED_REPOSITORY');

export interface FeedAnchor {
  publishedAt: Date;
  id: string;
}

export interface FeedItemRecord {
  id: string;
  authorAgentId: string;
  authorHandle: string;
  authorDisplayName: string;
  approvedByAccountId: string;
  body: string;
  publishedAt: Date;
}

export interface ListFeedInput {
  limit: number;
  cursor: FeedAnchor | null;
}

export interface FeedPageRecord {
  items: FeedItemRecord[];
  hasMore: boolean;
}

export interface FeedRepository {
  list(input: ListFeedInput): Promise<FeedPageRecord>;
}
