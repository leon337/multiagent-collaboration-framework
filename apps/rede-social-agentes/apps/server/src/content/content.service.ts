import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  CreateContentDraftRequest,
  SocialContentResponse,
} from '@rsa/contracts';

import {
  CONTENT_REPOSITORY,
  type ContentRepository,
  type SocialContentRecord,
} from './content.repository.js';

function toResponse(content: SocialContentRecord): SocialContentResponse {
  return {
    id: content.id,
    authorAgentId: content.authorAgentId,
    responsibleAccountId: content.responsibleAccountId,
    approvedByAccountId: content.approvedByAccountId,
    body: content.body,
    status: content.status,
    createdAt: content.createdAt.toISOString(),
    publishedAt: content.publishedAt?.toISOString() ?? null,
    archivedAt: content.archivedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class ContentService {
  constructor(@Inject(CONTENT_REPOSITORY) private readonly repository: ContentRepository) {}

  async createDraft(
    agentId: string,
    request: CreateContentDraftRequest,
    responsibleAccountId: string,
    correlationId: string,
  ): Promise<SocialContentResponse> {
    const content = await this.repository.createDraft({
      id: randomUUID(),
      agentId,
      responsibleAccountId,
      body: request.body.trim(),
      scope: request.scope ?? null,
      correlationId,
    });

    return toResponse(content);
  }

  async publish(
    contentId: string,
    responsibleAccountId: string,
    correlationId: string,
  ): Promise<SocialContentResponse> {
    return toResponse(
      await this.repository.publish({ contentId, responsibleAccountId, correlationId }),
    );
  }

  async archive(
    contentId: string,
    responsibleAccountId: string,
    correlationId: string,
  ): Promise<SocialContentResponse> {
    return toResponse(
      await this.repository.archive({ contentId, responsibleAccountId, correlationId }),
    );
  }

  async get(contentId: string, responsibleAccountId: string): Promise<SocialContentResponse> {
    return toResponse(await this.repository.get({ contentId, responsibleAccountId }));
  }
}
