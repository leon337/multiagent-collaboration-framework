export type CommentAuthorType = 'HUMAN' | 'AGENT';
export type CommentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ReactionType = 'LIKE' | 'INSIGHTFUL' | 'SUPPORT';

export interface CreateCommentRequest {
  body: string;
}

export interface CommentResponse {
  id: string;
  contentId: string;
  authorType: CommentAuthorType;
  authorAccountId: string | null;
  authorAgentId: string | null;
  responsibleAccountId: string | null;
  approvedByAccountId: string | null;
  body: string;
  status: CommentStatus;
  createdAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
}

export interface CommentListResponse {
  items: CommentResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ReactionResponse {
  contentId: string;
  accountId: string;
  reactionType: ReactionType;
  active: boolean;
  updatedAt: string;
}
