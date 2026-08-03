import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  CommunityMemberListResponse,
  CommunityMemberResponse,
  CommunityResponse,
  CreateCommunityRequest,
} from '@rsa/contracts';

import {
  decodeCommunityMemberCursor,
  encodeCommunityMemberCursor,
} from './community-member.cursor.js';
import {
  COMMUNITY_REPOSITORY,
  type CommunityMemberRecord,
  type CommunityRecord,
  type CommunityRepository,
} from './community.repository.js';

function mapCommunity(community: CommunityRecord): CommunityResponse {
  return {
    id: community.id,
    slug: community.slug,
    name: community.name,
    description: community.description,
    ownerAccountId: community.ownerAccountId,
    status: community.status,
    createdAt: community.createdAt.toISOString(),
    archivedAt: community.archivedAt?.toISOString() ?? null,
  };
}

function mapMember(member: CommunityMemberRecord): CommunityMemberResponse {
  return {
    id: member.id,
    communityId: member.communityId,
    subjectType: member.subjectType,
    accountId: member.accountId,
    agentId: member.agentId,
    responsibleAccountId: member.responsibleAccountId,
    role: member.role,
    status: member.status,
    joinedAt: member.joinedAt.toISOString(),
    endedAt: member.endedAt?.toISOString() ?? null,
  };
}

export function normalizeCommunitySlug(value: string): string {
  return value
    .normalize('NFKD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
}

@Injectable()
export class CommunityService {
  constructor(@Inject(COMMUNITY_REPOSITORY) private readonly repository: CommunityRepository) {}

  async create(
    request: CreateCommunityRequest,
    ownerAccountId: string,
    correlationId: string,
  ): Promise<CommunityResponse> {
    return mapCommunity(
      await this.repository.create({
        communityId: randomUUID(),
        ownerMemberId: randomUUID(),
        ownerAccountId,
        slug: normalizeCommunitySlug(request.slug),
        name: request.name.trim(),
        description: request.description?.trim() || null,
        correlationId,
      }),
    );
  }

  async get(communityId: string): Promise<CommunityResponse> {
    return mapCommunity(await this.repository.get(communityId));
  }

  async archive(
    communityId: string,
    ownerAccountId: string,
    correlationId: string,
  ): Promise<CommunityResponse> {
    return mapCommunity(
      await this.repository.archive({ communityId, ownerAccountId, correlationId }),
    );
  }

  async joinHuman(
    communityId: string,
    accountId: string,
    correlationId: string,
  ): Promise<CommunityMemberResponse> {
    return mapMember(
      await this.repository.joinHuman({
        memberId: randomUUID(),
        communityId,
        accountId,
        correlationId,
      }),
    );
  }

  async leaveHuman(
    communityId: string,
    accountId: string,
    correlationId: string,
  ): Promise<CommunityMemberResponse> {
    return mapMember(await this.repository.leaveHuman({ communityId, accountId, correlationId }));
  }

  async joinAgent(
    communityId: string,
    agentId: string,
    responsibleAccountId: string,
    correlationId: string,
  ): Promise<CommunityMemberResponse> {
    return mapMember(
      await this.repository.joinAgent({
        memberId: randomUUID(),
        communityId,
        agentId,
        responsibleAccountId,
        correlationId,
      }),
    );
  }

  async leaveAgent(
    communityId: string,
    agentId: string,
    responsibleAccountId: string,
    correlationId: string,
  ): Promise<CommunityMemberResponse> {
    return mapMember(
      await this.repository.leaveAgent({
        communityId,
        agentId,
        responsibleAccountId,
        correlationId,
      }),
    );
  }

  async listMembers(
    communityId: string,
    limit: number,
    cursorValue?: string,
  ): Promise<CommunityMemberListResponse> {
    const cursor = cursorValue ? decodeCommunityMemberCursor(cursorValue) : null;
    const page = await this.repository.listMembers({ communityId, limit, cursor });
    const lastItem = page.items.at(-1);

    return {
      items: page.items.map(mapMember),
      nextCursor:
        page.hasMore && lastItem
          ? encodeCommunityMemberCursor({ joinedAt: lastItem.joinedAt, id: lastItem.id })
          : null,
      hasMore: page.hasMore,
    };
  }
}
