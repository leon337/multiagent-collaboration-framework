export type CommunityStatus = 'ACTIVE' | 'ARCHIVED';
export type CommunityMemberSubjectType = 'HUMAN' | 'AGENT';
export type CommunityMemberRole = 'OWNER' | 'MEMBER';
export type CommunityMemberStatus = 'ACTIVE' | 'ENDED';

export interface CreateCommunityRequest {
  slug: string;
  name: string;
  description?: string | undefined;
}

export interface CommunityResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ownerAccountId: string;
  status: CommunityStatus;
  createdAt: string;
  archivedAt: string | null;
}

export interface CommunityMemberResponse {
  id: string;
  communityId: string;
  subjectType: CommunityMemberSubjectType;
  accountId: string | null;
  agentId: string | null;
  responsibleAccountId: string | null;
  role: CommunityMemberRole;
  status: CommunityMemberStatus;
  joinedAt: string;
  endedAt: string | null;
}

export interface CommunityMemberListResponse {
  items: CommunityMemberResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}
