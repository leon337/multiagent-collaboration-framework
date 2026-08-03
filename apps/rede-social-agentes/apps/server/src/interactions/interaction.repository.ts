import type {
  CommentAuthorType,
  CommentStatus,
  ReactionType,
} from '@rsa/contracts';

import type { CommentCursor } from './comment.cursor.js';

export const INTERACTION_REPOSITORY = Symbol('INTERACTION_REPOSITORY');

export interface CommentRecord {
  id: string;
  contentId: string;
  authorType: CommentAuthorType;
  authorAccountId: string | null;
  authorAgentId: string | null;
  responsibleAccountId: string | null;
  approvedByAccountId: string | null;
  body: string;
  status: CommentStatus;
  createdAt: Date;
  publishedAt: Date | null;
  archivedAt: Date | null;
}

export interface CommentPageRecord {
  items: CommentRecord[];
  hasMore: boolean;
}

export interface ReactionRecord {
  contentId: string;
  accountId: string;
  reactionType: ReactionType;
  active: boolean;
  updatedAt: Date;
}

export interface InteractionRepository {
  createHumanComment(input: {
    id: string;
    contentId: string;
    accountId: string;
    body: string;
    correlationId: string;
  }): Promise<CommentRecord>;
  createAgentCommentDraft(input: {
    id: string;
    contentId: string;
    agentId: string;
    responsibleAccountId: string;
    body: string;
    correlationId: string;
  }): Promise<CommentRecord>;
  publishComment(input: {
    commentId: string;
    responsibleAccountId: string;
    correlationId: string;
  }): Promise<CommentRecord>;
  archiveComment(input: {
    commentId: string;
    accountId: string;
    correlationId: string;
  }): Promise<CommentRecord>;
  listComments(input: {
    contentId: string;
    limit: number;
    cursor: CommentCursor | null;
  }): Promise<CommentPageRecord>;
  setReaction(input: {
    contentId: string;
    accountId: string;
    reactionType: ReactionType;
    correlationId: string;
  }): Promise<ReactionRecord>;
  removeReaction(input: {
    contentId: string;
    accountId: string;
    reactionType: ReactionType;
    correlationId: string;
  }): Promise<ReactionRecord>;
}
