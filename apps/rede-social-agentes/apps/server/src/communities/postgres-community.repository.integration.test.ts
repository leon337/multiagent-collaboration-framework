import { randomUUID } from 'node:crypto';

import type { DatabaseRow } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PostgresAgentRepository } from '../agents/postgres-agent.repository.js';
import { DatabaseService } from '../database.service.js';
import { PostgresIdentityRepository } from '../identity/postgres-identity.repository.js';
import {
  CommunityAgentNotAvailableError,
  CommunityNotAvailableError,
  CommunityStateConflictError,
} from './community.errors.js';
import { CommunityService } from './community.service.js';
import { PostgresCommunityRepository } from './postgres-community.repository.js';

interface CountRow extends DatabaseRow {
  count: string;
}

describe('PostgresCommunityRepository integration', () => {
  let database: DatabaseService;

  beforeAll(() => {
    database = new DatabaseService();
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('keeps human and agent memberships supervised, idempotent and auditable', async () => {
    const identities = new PostgresIdentityRepository(database);
    const agents = new PostgresAgentRepository(database);
    const communities = new CommunityService(new PostgresCommunityRepository(database));
    const ownerAccountId = randomUUID();
    const memberAccountId = randomUUID();
    const unrelatedAccountId = randomUUID();
    const agentId = randomUUID();
    const correlation = randomUUID();
    let communityId: string | null = null;

    try {
      for (const [accountId, label] of [
        [ownerAccountId, 'owner'],
        [memberAccountId, 'member'],
        [unrelatedAccountId, 'unrelated'],
      ] as const) {
        await identities.createHumanAccount({
          id: accountId,
          email: `community-${label}-${accountId}@example.test`,
          displayName: `Community ${label}`,
          passwordHash: `scrypt$integration$${label}`,
          correlationId: `${label}-${correlation}`,
        });
      }

      await agents.createAgentWithResponsibility({
        agentId,
        responsibilityId: randomUUID(),
        responsibleAccountId: ownerAccountId,
        handle: `community_${agentId.replaceAll('-', '').slice(0, 18)}`,
        displayName: 'Community Agent',
        bio: null,
        capabilities: ['community-participation'],
        correlationId: `agent-${correlation}`,
      });
      await agents.transitionAgentState({
        agentId,
        responsibleAccountId: ownerAccountId,
        targetStatus: 'ACTIVE',
        correlationId: `activate-${correlation}`,
      });

      const community = await communities.create(
        {
          slug: `Agentes Recife ${correlation.slice(0, 8)}`,
          name: 'Agentes Recife',
          description: 'Comunidade de construção supervisionada.',
        },
        ownerAccountId,
        `create-${correlation}`,
      );
      communityId = community.id;
      expect(community).toMatchObject({
        ownerAccountId,
        status: 'ACTIVE',
      });
      expect(community.slug).toMatch(/^agentes-recife-/);

      const firstHumanJoin = await communities.joinHuman(
        community.id,
        memberAccountId,
        `human-join-one-${correlation}`,
      );
      const secondHumanJoin = await communities.joinHuman(
        community.id,
        memberAccountId,
        `human-join-two-${correlation}`,
      );
      expect(secondHumanJoin.id).toBe(firstHumanJoin.id);

      const firstAgentJoin = await communities.joinAgent(
        community.id,
        agentId,
        ownerAccountId,
        `agent-join-one-${correlation}`,
      );
      const secondAgentJoin = await communities.joinAgent(
        community.id,
        agentId,
        ownerAccountId,
        `agent-join-two-${correlation}`,
      );
      expect(secondAgentJoin.id).toBe(firstAgentJoin.id);

      await expect(
        communities.joinAgent(
          community.id,
          agentId,
          unrelatedAccountId,
          `agent-third-party-${correlation}`,
        ),
      ).rejects.toBeInstanceOf(CommunityAgentNotAvailableError);

      const firstPage = await communities.listMembers(community.id, 2);
      const secondPage = await communities.listMembers(
        community.id,
        2,
        firstPage.nextCursor ?? undefined,
      );
      const memberIds = [...firstPage.items, ...secondPage.items].map((member) => member.id);
      expect(firstPage.hasMore).toBe(true);
      expect(new Set(memberIds).size).toBe(3);
      expect(memberIds).toEqual(
        expect.arrayContaining([firstHumanJoin.id, firstAgentJoin.id]),
      );

      await expect(
        communities.leaveHuman(community.id, ownerAccountId, `owner-leave-${correlation}`),
      ).rejects.toBeInstanceOf(CommunityStateConflictError);

      const firstHumanLeave = await communities.leaveHuman(
        community.id,
        memberAccountId,
        `human-leave-one-${correlation}`,
      );
      const secondHumanLeave = await communities.leaveHuman(
        community.id,
        memberAccountId,
        `human-leave-two-${correlation}`,
      );
      expect(firstHumanLeave.status).toBe('ENDED');
      expect(secondHumanLeave.id).toBe(firstHumanLeave.id);

      const firstAgentLeave = await communities.leaveAgent(
        community.id,
        agentId,
        ownerAccountId,
        `agent-leave-one-${correlation}`,
      );
      const secondAgentLeave = await communities.leaveAgent(
        community.id,
        agentId,
        ownerAccountId,
        `agent-leave-two-${correlation}`,
      );
      expect(firstAgentLeave.status).toBe('ENDED');
      expect(secondAgentLeave.id).toBe(firstAgentLeave.id);

      await expect(
        communities.archive(
          community.id,
          unrelatedAccountId,
          `archive-third-party-${correlation}`,
        ),
      ).rejects.toBeInstanceOf(CommunityNotAvailableError);

      const archived = await communities.archive(
        community.id,
        ownerAccountId,
        `archive-owner-${correlation}`,
      );
      expect(archived.status).toBe('ARCHIVED');

      await expect(
        communities.joinHuman(
          community.id,
          unrelatedAccountId,
          `join-archived-${correlation}`,
        ),
      ).rejects.toBeInstanceOf(CommunityNotAvailableError);

      const activeMemberships = await database.query<CountRow>(
        `
          select count(*)::text as "count"
          from "community_members"
          where "community_id" = $1 and "status" = 'ACTIVE'
        `,
        [community.id],
      );
      expect(Number(activeMemberships.rows[0]?.count ?? '0')).toBe(1);
    } finally {
      if (communityId) {
        await database.query(
          'delete from "audit_events" where "aggregate_id" = $1 or "actor_id" in ($2, $3, $4, $5)',
          [
            communityId,
            ownerAccountId,
            memberAccountId,
            unrelatedAccountId,
            agentId,
          ],
        );
        await database.query('delete from "communities" where "id" = $1', [communityId]);
      }
      await database.query('delete from "agent_profiles" where "id" = $1', [agentId]);
      await database.query('delete from "accounts" where "id" in ($1, $2, $3)', [
        ownerAccountId,
        memberAccountId,
        unrelatedAccountId,
      ]);
    }
  });
});
