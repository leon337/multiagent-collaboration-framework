import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type {
  CommunityMemberRole,
  CommunityMemberStatus,
  CommunityMemberSubjectType,
  CommunityStatus,
} from '@rsa/contracts';
import type { DatabaseRow, DatabaseTransaction } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import {
  CommunityAgentNotAvailableError,
  CommunityNotAvailableError,
  CommunityStateConflictError,
  DuplicateCommunitySlugError,
} from './community.errors.js';
import type {
  CommunityMemberPageRecord,
  CommunityMemberRecord,
  CommunityRecord,
  CommunityRepository,
} from './community.repository.js';

interface CommunityRow extends DatabaseRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  owner_account_id: string;
  status: CommunityStatus;
  created_at: Date;
  archived_at: Date | null;
}

interface CommunityMemberRow extends DatabaseRow {
  id: string;
  community_id: string;
  subject_type: CommunityMemberSubjectType;
  account_id: string | null;
  agent_id: string | null;
  responsible_account_id: string | null;
  role: CommunityMemberRole;
  status: CommunityMemberStatus;
  joined_at: Date;
  ended_at: Date | null;
}

const communityColumns = `
  "id", "slug", "name", "description", "owner_account_id",
  "status", "created_at", "archived_at"
`;

const memberColumns = `
  "id", "community_id", "subject_type", "account_id", "agent_id",
  "responsible_account_id", "role", "status", "joined_at", "ended_at"
`;

function mapCommunity(row: CommunityRow): CommunityRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    ownerAccountId: row.owner_account_id,
    status: row.status,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  };
}

function mapMember(row: CommunityMemberRow): CommunityMemberRecord {
  return {
    id: row.id,
    communityId: row.community_id,
    subjectType: row.subject_type,
    accountId: row.account_id,
    agentId: row.agent_id,
    responsibleAccountId: row.responsible_account_id,
    role: row.role,
    status: row.status,
    joinedAt: row.joined_at,
    endedAt: row.ended_at,
  };
}

async function writeAudit(
  client: DatabaseTransaction,
  input: {
    actorId: string;
    eventType: string;
    communityId: string;
    correlationId: string;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  await client.query(
    `
      insert into "audit_events" (
        "id", "actor_id", "actor_type", "event_type", "aggregate_type",
        "aggregate_id", "correlation_id", "payload"
      ) values ($1, $2, 'HUMAN', $3, 'COMMUNITY', $4, $5, $6::jsonb)
    `,
    [
      randomUUID(),
      input.actorId,
      input.eventType,
      input.communityId,
      input.correlationId,
      JSON.stringify(input.payload),
    ],
  );
}

async function getCommunityWithClient(
  client: DatabaseTransaction,
  communityId: string,
  lock = false,
): Promise<CommunityRow> {
  const result = await client.query<CommunityRow>(
    `select ${communityColumns} from "communities" where "id" = $1 ${lock ? 'for update' : ''}`,
    [communityId],
  );
  const row = result.rows[0];
  if (!row) {
    throw new CommunityNotAvailableError();
  }
  return row;
}

async function ensureActiveCommunity(
  client: DatabaseTransaction,
  communityId: string,
): Promise<CommunityRow> {
  const community = await getCommunityWithClient(client, communityId);
  if (community.status !== 'ACTIVE') {
    throw new CommunityNotAvailableError();
  }
  return community;
}

async function ensureResponsibleActiveAgent(
  client: DatabaseTransaction,
  agentId: string,
  responsibleAccountId: string,
): Promise<void> {
  const result = await client.query(
    `
      select rl."id"
      from "responsibility_links" rl
      join "agent_profiles" ap on ap."id" = rl."agent_id"
      where rl."agent_id" = $1
        and rl."responsible_account_id" = $2
        and rl."status" = 'ACTIVE'
        and ap."status" = 'ACTIVE'
      limit 1
    `,
    [agentId, responsibleAccountId],
  );
  if (result.rowCount !== 1) {
    throw new CommunityAgentNotAvailableError();
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

@Injectable()
export class PostgresCommunityRepository implements CommunityRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async create(input: {
    communityId: string;
    ownerMemberId: string;
    ownerAccountId: string;
    slug: string;
    name: string;
    description: string | null;
    correlationId: string;
  }): Promise<CommunityRecord> {
    try {
      return await this.database.transaction(async (client) => {
        const result = await client.query<CommunityRow>(
          `
            insert into "communities" (
              "id", "slug", "name", "description", "owner_account_id"
            ) values ($1, $2, $3, $4, $5)
            returning ${communityColumns}
          `,
          [input.communityId, input.slug, input.name, input.description, input.ownerAccountId],
        );
        const community = result.rows[0];
        if (!community) {
          throw new CommunityStateConflictError();
        }
        await client.query(
          `
            insert into "community_members" (
              "id", "community_id", "subject_type", "account_id", "role", "joined_at"
            ) values ($1, $2, 'HUMAN', $3, 'OWNER', date_trunc('milliseconds', clock_timestamp()))
          `,
          [input.ownerMemberId, input.communityId, input.ownerAccountId],
        );
        await writeAudit(client, {
          actorId: input.ownerAccountId,
          eventType: 'COMMUNITY_CREATED',
          communityId: input.communityId,
          correlationId: input.correlationId,
          payload: { slug: input.slug, ownerMemberId: input.ownerMemberId },
        });
        return mapCommunity(community);
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DuplicateCommunitySlugError();
      }
      throw error;
    }
  }

  async get(communityId: string): Promise<CommunityRecord> {
    const result = await this.database.query<CommunityRow>(
      `select ${communityColumns} from "communities" where "id" = $1`,
      [communityId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new CommunityNotAvailableError();
    }
    return mapCommunity(row);
  }

  async archive(input: {
    communityId: string;
    ownerAccountId: string;
    correlationId: string;
  }): Promise<CommunityRecord> {
    return this.database.transaction(async (client) => {
      const community = await getCommunityWithClient(client, input.communityId, true);
      if (community.owner_account_id !== input.ownerAccountId) {
        throw new CommunityNotAvailableError();
      }
      if (community.status === 'ARCHIVED') {
        return mapCommunity(community);
      }
      const result = await client.query<CommunityRow>(
        `
          update "communities"
          set "status" = 'ARCHIVED', "archived_at" = now(), "updated_at" = now()
          where "id" = $1
          returning ${communityColumns}
        `,
        [input.communityId],
      );
      const row = result.rows[0];
      if (!row) {
        throw new CommunityStateConflictError();
      }
      await writeAudit(client, {
        actorId: input.ownerAccountId,
        eventType: 'COMMUNITY_ARCHIVED',
        communityId: input.communityId,
        correlationId: input.correlationId,
        payload: {},
      });
      return mapCommunity(row);
    });
  }

  async joinHuman(input: {
    memberId: string;
    communityId: string;
    accountId: string;
    correlationId: string;
  }): Promise<CommunityMemberRecord> {
    return this.database.transaction(async (client) => {
      await ensureActiveCommunity(client, input.communityId);
      const existing = await client.query<CommunityMemberRow>(
        `
          select ${memberColumns}
          from "community_members"
          where "community_id" = $1 and "account_id" = $2
            and "subject_type" = 'HUMAN' and "status" = 'ACTIVE'
          limit 1
        `,
        [input.communityId, input.accountId],
      );
      if (existing.rows[0]) {
        return mapMember(existing.rows[0]);
      }

      const inserted = await client.query<CommunityMemberRow>(
        `
          insert into "community_members" (
            "id", "community_id", "subject_type", "account_id", "role", "joined_at"
          ) values ($1, $2, 'HUMAN', $3, 'MEMBER', date_trunc('milliseconds', clock_timestamp()))
          on conflict do nothing
          returning ${memberColumns}
        `,
        [input.memberId, input.communityId, input.accountId],
      );
      const row =
        inserted.rows[0] ??
        (
          await client.query<CommunityMemberRow>(
            `
              select ${memberColumns}
              from "community_members"
              where "community_id" = $1 and "account_id" = $2
                and "subject_type" = 'HUMAN' and "status" = 'ACTIVE'
              limit 1
            `,
            [input.communityId, input.accountId],
          )
        ).rows[0];
      if (!row) {
        throw new CommunityStateConflictError();
      }
      if (inserted.rows[0]) {
        await writeAudit(client, {
          actorId: input.accountId,
          eventType: 'COMMUNITY_HUMAN_JOINED',
          communityId: input.communityId,
          correlationId: input.correlationId,
          payload: { memberId: row.id },
        });
      }
      return mapMember(row);
    });
  }

  async leaveHuman(input: {
    communityId: string;
    accountId: string;
    correlationId: string;
  }): Promise<CommunityMemberRecord> {
    return this.database.transaction(async (client) => {
      await ensureActiveCommunity(client, input.communityId);
      const current = await client.query<CommunityMemberRow>(
        `
          select ${memberColumns}
          from "community_members"
          where "community_id" = $1 and "account_id" = $2 and "subject_type" = 'HUMAN'
          order by "joined_at" desc
          limit 1
          for update
        `,
        [input.communityId, input.accountId],
      );
      const membership = current.rows[0];
      if (!membership) {
        throw new CommunityNotAvailableError();
      }
      if (membership.status === 'ENDED') {
        return mapMember(membership);
      }
      if (membership.role === 'OWNER') {
        throw new CommunityStateConflictError();
      }
      const result = await client.query<CommunityMemberRow>(
        `
          update "community_members"
          set "status" = 'ENDED', "ended_at" = now()
          where "id" = $1
          returning ${memberColumns}
        `,
        [membership.id],
      );
      const row = result.rows[0];
      if (!row) {
        throw new CommunityStateConflictError();
      }
      await writeAudit(client, {
        actorId: input.accountId,
        eventType: 'COMMUNITY_HUMAN_LEFT',
        communityId: input.communityId,
        correlationId: input.correlationId,
        payload: { memberId: row.id },
      });
      return mapMember(row);
    });
  }

  async joinAgent(input: {
    memberId: string;
    communityId: string;
    agentId: string;
    responsibleAccountId: string;
    correlationId: string;
  }): Promise<CommunityMemberRecord> {
    return this.database.transaction(async (client) => {
      await ensureActiveCommunity(client, input.communityId);
      await ensureResponsibleActiveAgent(client, input.agentId, input.responsibleAccountId);
      const existing = await client.query<CommunityMemberRow>(
        `
          select ${memberColumns}
          from "community_members"
          where "community_id" = $1 and "agent_id" = $2
            and "subject_type" = 'AGENT' and "status" = 'ACTIVE'
          limit 1
        `,
        [input.communityId, input.agentId],
      );
      if (existing.rows[0]) {
        return mapMember(existing.rows[0]);
      }
      const inserted = await client.query<CommunityMemberRow>(
        `
          insert into "community_members" (
            "id", "community_id", "subject_type", "agent_id",
            "responsible_account_id", "role", "joined_at"
          ) values (
            $1, $2, 'AGENT', $3, $4, 'MEMBER', date_trunc('milliseconds', clock_timestamp())
          )
          on conflict do nothing
          returning ${memberColumns}
        `,
        [input.memberId, input.communityId, input.agentId, input.responsibleAccountId],
      );
      const row =
        inserted.rows[0] ??
        (
          await client.query<CommunityMemberRow>(
            `
              select ${memberColumns}
              from "community_members"
              where "community_id" = $1 and "agent_id" = $2
                and "subject_type" = 'AGENT' and "status" = 'ACTIVE'
              limit 1
            `,
            [input.communityId, input.agentId],
          )
        ).rows[0];
      if (!row) {
        throw new CommunityStateConflictError();
      }
      if (inserted.rows[0]) {
        await writeAudit(client, {
          actorId: input.responsibleAccountId,
          eventType: 'COMMUNITY_AGENT_JOINED',
          communityId: input.communityId,
          correlationId: input.correlationId,
          payload: { memberId: row.id, agentId: input.agentId },
        });
      }
      return mapMember(row);
    });
  }

  async leaveAgent(input: {
    communityId: string;
    agentId: string;
    responsibleAccountId: string;
    correlationId: string;
  }): Promise<CommunityMemberRecord> {
    return this.database.transaction(async (client) => {
      await ensureActiveCommunity(client, input.communityId);
      await ensureResponsibleActiveAgent(client, input.agentId, input.responsibleAccountId);
      const current = await client.query<CommunityMemberRow>(
        `
          select ${memberColumns}
          from "community_members"
          where "community_id" = $1 and "agent_id" = $2 and "subject_type" = 'AGENT'
          order by "joined_at" desc
          limit 1
          for update
        `,
        [input.communityId, input.agentId],
      );
      const membership = current.rows[0];
      if (!membership) {
        throw new CommunityAgentNotAvailableError();
      }
      if (membership.responsible_account_id !== input.responsibleAccountId) {
        throw new CommunityAgentNotAvailableError();
      }
      if (membership.status === 'ENDED') {
        return mapMember(membership);
      }
      const result = await client.query<CommunityMemberRow>(
        `
          update "community_members"
          set "status" = 'ENDED', "ended_at" = now()
          where "id" = $1
          returning ${memberColumns}
        `,
        [membership.id],
      );
      const row = result.rows[0];
      if (!row) {
        throw new CommunityStateConflictError();
      }
      await writeAudit(client, {
        actorId: input.responsibleAccountId,
        eventType: 'COMMUNITY_AGENT_LEFT',
        communityId: input.communityId,
        correlationId: input.correlationId,
        payload: { memberId: row.id, agentId: input.agentId },
      });
      return mapMember(row);
    });
  }

  async listMembers(input: {
    communityId: string;
    limit: number;
    cursor: { joinedAt: Date; id: string } | null;
  }): Promise<CommunityMemberPageRecord> {
    return this.database.transaction(async (client) => {
      await getCommunityWithClient(client, input.communityId);
      const values: unknown[] = [input.communityId, input.limit + 1];
      let cursorCondition = '';
      if (input.cursor) {
        values.push(input.cursor.joinedAt, input.cursor.id);
        cursorCondition = `and ("joined_at", "id") > ($3::timestamptz, $4::text)`;
      }
      const result = await client.query<CommunityMemberRow>(
        `
          select ${memberColumns}
          from "community_members"
          where "community_id" = $1 and "status" = 'ACTIVE'
          ${cursorCondition}
          order by "joined_at" asc, "id" asc
          limit $2
        `,
        values,
      );
      return {
        items: result.rows.slice(0, input.limit).map(mapMember),
        hasMore: result.rows.length > input.limit,
      };
    });
  }
}
