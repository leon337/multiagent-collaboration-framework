import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PostgresAgentRepository } from '../agents/postgres-agent.repository.js';
import { DatabaseService } from '../database.service.js';
import { PostgresIdentityRepository } from '../identity/postgres-identity.repository.js';
import { FeedService } from './feed.service.js';
import { PostgresFeedRepository } from './postgres-feed.repository.js';

describe('PostgresFeedRepository integration', () => {
  let database: DatabaseService;

  beforeAll(() => {
    database = new DatabaseService();
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('paginates published content without duplicates or hidden-state leakage', async () => {
    const identities = new PostgresIdentityRepository(database);
    const agents = new PostgresAgentRepository(database);
    const prefix = randomUUID();
    const accountId = randomUUID();
    const agentId = randomUUID();
    const publishedAt = new Date('9999-12-31T23:59:59.000Z');
    const ids = [`${prefix}-c`, `${prefix}-b`, `${prefix}-a`];
    const hiddenIds = [`${prefix}-draft`, `${prefix}-archived`];

    try {
      await identities.createHumanAccount({
        id: accountId,
        email: `feed-${accountId}@example.test`,
        displayName: 'Feed Reader',
        passwordHash: 'scrypt$integration$feed',
        correlationId: `feed-account-${prefix}`,
      });
      await agents.createAgentWithResponsibility({
        agentId,
        responsibilityId: randomUUID(),
        responsibleAccountId: accountId,
        handle: `feed_${prefix.replaceAll('-', '').slice(0, 18)}`,
        displayName: 'Feed Agent',
        bio: null,
        capabilities: ['writing'],
        correlationId: `feed-agent-${prefix}`,
      });

      for (const id of ids) {
        await database.query(
          `
            insert into "social_content" (
              "id", "author_agent_id", "responsible_account_id", "approved_by_account_id",
              "body", "status", "published_at"
            ) values ($1, $2, $3, $3, $4, 'PUBLISHED', $5)
          `,
          [id, agentId, accountId, `Published ${id}`, publishedAt],
        );
      }
      await database.query(
        `
          insert into "social_content" (
            "id", "author_agent_id", "responsible_account_id", "body", "status"
          ) values ($1, $3, $4, 'Hidden draft', 'DRAFT')
        `,
        [hiddenIds[0], null, agentId, accountId],
      );
      await database.query(
        `
          insert into "social_content" (
            "id", "author_agent_id", "responsible_account_id", "body", "status", "archived_at"
          ) values ($1, $2, $3, 'Hidden archived', 'ARCHIVED', now())
        `,
        [hiddenIds[1], agentId, accountId],
      );

      const service = new FeedService(new PostgresFeedRepository(database));
      const first = await service.list(2);
      const second = await service.list(2, first.nextCursor ?? undefined);
      const visibleIds = [...first.items, ...second.items].map((item) => item.id);

      expect(first.items.map((item) => item.id)).toEqual(ids.slice(0, 2));
      expect(second.items[0]?.id).toBe(ids[2]);
      expect(new Set(visibleIds).size).toBe(visibleIds.length);
      expect(visibleIds).not.toContain(hiddenIds[0]);
      expect(visibleIds).not.toContain(hiddenIds[1]);
    } finally {
      await database.query('delete from "social_content" where "author_agent_id" = $1', [agentId]);
      await database.query('delete from "audit_events" where "actor_id" in ($1, $2)', [
        accountId,
        agentId,
      ]);
      await database.query('delete from "agent_profiles" where "id" = $1', [agentId]);
      await database.query('delete from "accounts" where "id" = $1', [accountId]);
    }
  });
});
