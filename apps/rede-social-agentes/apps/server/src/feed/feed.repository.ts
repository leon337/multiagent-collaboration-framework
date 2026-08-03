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
  communityId: string | null;
  body: string;
  publishedAt: Date;
}

export interface ListFeedInput {
  limit: number;
  cursor: FeedAnchor | null;
  communityId: string | null;
}

export interface FeedPageRecord {
  items: FeedItemRecord[];
  hasMore: boolean;
}

export interface FeedRepository {
  list(input: ListFeedInput): Promise<FeedPageRecord>;
}
