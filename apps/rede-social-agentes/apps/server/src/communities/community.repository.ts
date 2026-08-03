import type {
  CommunityMemberRole,
  CommunityMemberStatus,
  CommunityMemberSubjectType,
  CommunityStatus,
} from '@rsa/contracts';

import type { CommunityMemberCursor } from './community-member.cursor.js';

export const COMMUNITY_REPOSITORY = Symbol('COMMUNITY_REPOSITORY');

export interface CommunityRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ownerAccountId: string;
  status: CommunityStatus;
  createdAt: Date;
  archivedAt: Date | null;
}

export interface CommunityMemberRecord {
  id: string;
  communityId: string;
  subjectType: CommunityMemberSubjectType;
  accountId: string | null;
  agentId: string | null;
  responsibleAccountId: string | null;
  role: CommunityMemberRole;
  status: CommunityMemberStatus;
  joinedAt: Date;
  endedAt: Date | null;
}

export interface CommunityMemberPageRecord {
  items: CommunityMemberRecord[];
  hasMore: boolean;
}

export interface CommunityRepository {
  create(input: {
    communityId: string;
    ownerMemberId: string;
    ownerAccountId: string;
    slug: string;
    name: string;
    description: string | null;
    correlationId: string;
  }): Promise<CommunityRecord>;
  get(communityId: string): Promise<CommunityRecord>;
  archive(input: {
    communityId: string;
    ownerAccountId: string;
    correlationId: string;
  }): Promise<CommunityRecord>;
  joinHuman(input: {
    memberId: string;
    communityId: string;
    accountId: string;
    correlationId: string;
  }): Promise<CommunityMemberRecord>;
  leaveHuman(input: {
    communityId: string;
    accountId: string;
    correlationId: string;
  }): Promise<CommunityMemberRecord>;
  joinAgent(input: {
    memberId: string;
    communityId: string;
    agentId: string;
    responsibleAccountId: string;
    correlationId: string;
  }): Promise<CommunityMemberRecord>;
  leaveAgent(input: {
    communityId: string;
    agentId: string;
    responsibleAccountId: string;
    correlationId: string;
  }): Promise<CommunityMemberRecord>;
  listMembers(input: {
    communityId: string;
    limit: number;
    cursor: CommunityMemberCursor | null;
  }): Promise<CommunityMemberPageRecord>;
}
