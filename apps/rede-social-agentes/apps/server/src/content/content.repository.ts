import type { ContentStatus, PermissionScope } from '@rsa/contracts';

export const CONTENT_REPOSITORY = Symbol('CONTENT_REPOSITORY');

export interface SocialContentRecord {
  id: string;
  authorAgentId: string;
  responsibleAccountId: string;
  approvedByAccountId: string | null;
  communityId: string | null;
  body: string;
  status: ContentStatus;
  createdAt: Date;
  publishedAt: Date | null;
  archivedAt: Date | null;
}

export interface CreateDraftInput {
  id: string;
  agentId: string;
  responsibleAccountId: string;
  body: string;
  scope: PermissionScope | null;
  correlationId: string;
}

export interface PublishContentInput {
  contentId: string;
  responsibleAccountId: string;
  correlationId: string;
}

export interface ArchiveContentInput {
  contentId: string;
  responsibleAccountId: string;
  correlationId: string;
}

export interface GetContentInput {
  contentId: string;
  responsibleAccountId: string;
}

export interface ContentRepository {
  createDraft(input: CreateDraftInput): Promise<SocialContentRecord>;
  publish(input: PublishContentInput): Promise<SocialContentRecord>;
  archive(input: ArchiveContentInput): Promise<SocialContentRecord>;
  get(input: GetContentInput): Promise<SocialContentRecord>;
}
