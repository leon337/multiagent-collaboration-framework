import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  CommentListResponse,
  CommentResponse,
  CreateCommentRequest,
  ReactionResponse,
  ReactionType,
} from '@rsa/contracts';

import { decodeCommentCursor, encodeCommentCursor } from './comment.cursor.js';
import {
  INTERACTION_REPOSITORY,
  type CommentRecord,
  type InteractionRepository,
  type ReactionRecord,
} from './interaction.repository.js';

function mapComment(comment: CommentRecord): CommentResponse {
  return {
    id: comment.id,
    contentId: comment.contentId,
    authorType: comment.authorType,
    authorAccountId: comment.authorAccountId,
    authorAgentId: comment.authorAgentId,
    responsibleAccountId: comment.responsibleAccountId,
    approvedByAccountId: comment.approvedByAccountId,
    body: comment.body,
    status: comment.status,
    createdAt: comment.createdAt.toISOString(),
    publishedAt: comment.publishedAt?.toISOString() ?? null,
    archivedAt: comment.archivedAt?.toISOString() ?? null,
  };
}

function mapReaction(reaction: ReactionRecord): ReactionResponse {
  return {
    contentId: reaction.contentId,
    accountId: reaction.accountId,
    reactionType: reaction.reactionType,
    active: reaction.active,
    updatedAt: reaction.updatedAt.toISOString(),
  };
}

@Injectable()
export class InteractionService {
  constructor(@Inject(INTERACTION_REPOSITORY) private readonly repository: InteractionRepository) {}

  async createHumanComment(
    contentId: string,
    request: CreateCommentRequest,
    accountId: string,
    correlationId: string,
  ): Promise<CommentResponse> {
    return mapComment(
      await this.repository.createHumanComment({
        id: randomUUID(),
        contentId,
        accountId,
        body: request.body.trim(),
        correlationId,
      }),
    );
  }

  async createAgentCommentDraft(
    agentId: string,
    contentId: string,
    request: CreateCommentRequest,
    responsibleAccountId: string,
    correlationId: string,
  ): Promise<CommentResponse> {
    return mapComment(
      await this.repository.createAgentCommentDraft({
        id: randomUUID(),
        contentId,
        agentId,
        responsibleAccountId,
        body: request.body.trim(),
        correlationId,
      }),
    );
  }

  async publishComment(
    commentId: string,
    responsibleAccountId: string,
    correlationId: string,
  ): Promise<CommentResponse> {
    return mapComment(
      await this.repository.publishComment({
        commentId,
        responsibleAccountId,
        correlationId,
      }),
    );
  }

  async archiveComment(
    commentId: string,
    accountId: string,
    correlationId: string,
  ): Promise<CommentResponse> {
    return mapComment(
      await this.repository.archiveComment({ commentId, accountId, correlationId }),
    );
  }

  async listComments(
    contentId: string,
    limit: number,
    cursorValue?: string,
  ): Promise<CommentListResponse> {
    const cursor = cursorValue ? decodeCommentCursor(cursorValue) : null;
    const page = await this.repository.listComments({ contentId, limit, cursor });
    const lastItem = page.items.at(-1);
    return {
      items: page.items.map(mapComment),
      nextCursor:
        page.hasMore && lastItem?.publishedAt
          ? encodeCommentCursor({ publishedAt: lastItem.publishedAt, id: lastItem.id })
          : null,
      hasMore: page.hasMore,
    };
  }

  async setReaction(
    contentId: string,
    accountId: string,
    reactionType: ReactionType,
    correlationId: string,
  ): Promise<ReactionResponse> {
    return mapReaction(
      await this.repository.setReaction({ contentId, accountId, reactionType, correlationId }),
    );
  }

  async removeReaction(
    contentId: string,
    accountId: string,
    reactionType: ReactionType,
    correlationId: string,
  ): Promise<ReactionResponse> {
    return mapReaction(
      await this.repository.removeReaction({ contentId, accountId, reactionType, correlationId }),
    );
  }
}
