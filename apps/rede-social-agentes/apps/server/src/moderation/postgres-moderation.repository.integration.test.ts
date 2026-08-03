import { randomUUID } from 'node:crypto';

import type { DatabaseRow } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PostgresAgentRepository } from '../agents/postgres-agent.repository.js';
import { DatabaseService } from '../database.service.js';
import { PostgresIdentityRepository } from '../identity/postgres-identity.repository.js';
import { ModerationOperatorAccessDeniedError } from './moderation.errors.js';
import { ModerationService } from './moderation.service.js';
import { PostgresModerationRepository } from './postgres-moderation.repository.js';

interface CountRow extends DatabaseRow {
  count: string;
}

describe('PostgresModerationRepository integration', () => {
  let database: DatabaseService;

  beforeAll(() => {
    database = new DatabaseService();
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('groups reports, protects the queue and supports idempotent claim', async () => {
    const identities = new PostgresIdentityRepository(database);
    const agents = new PostgresAgentRepository(database);
    const moderation = new ModerationService(new PostgresModerationRepository(database));
    const reporterOneId = randomUUID();
    const reporterTwoId = randomUUID();
    const moderatorId = randomUUID();
    const agentId = randomUUID();
    const contentId = randomUUID();
    const correlation = randomUUID();
    let caseId: string | null = null;

    try {
      for (const [accountId, label] of [
        [reporterOneId, 'reporter-one'],
        [reporterTwoId, 'reporter-two'],
        [moderatorId, 'moderator'],
      ] as const) {
        await identities.createHumanAccount({
          id: accountId,
          email: `moderation-${label}-${accountId}@example.test`,
          displayName: `Moderation ${label}`,
          passwordHash: `scrypt$integration$${label}`,
          correlationId: `${label}-${correlation}`,
        });
      }

      await agents.createAgentWithResponsibility({
        agentId,
        responsibilityId: randomUUID(),
        responsibleAccountId: reporterOneId,
        handle: `moderation_${agentId.replaceAll('-', '').slice(0, 18)}`,
        displayName: 'Moderation Target Agent',
        bio: null,
        capabilities: ['publishing'],
        correlationId: `agent-${correlation}`,
      });
      await agents.transitionAgentState({
        agentId,
        responsibleAccountId: reporterOneId,
        targetStatus: 'ACTIVE',
        correlationId: `activate-${correlation}`,
      });
      await database.query(
        `
          insert into "social_content" (
            "id", "author_agent_id", "responsible_account_id", "approved_by_account_id",
            "body", "status", "published_at"
          ) values ($1, $2, $3, $3, 'Reportable content', 'PUBLISHED', now())
        `,
        [contentId, agentId, reporterOneId],
      );

      const first = await moderation.createReport(
        {
          targetType: 'CONTENT',
          targetId: contentId,
          reason: 'SECURITY',
          details: 'Suspicious credential request.',
        },
        reporterOneId,
        `report-one-${correlation}`,
      );
      caseId = first.moderationCase.id;
      expect(first.moderationCase).toMatchObject({
        targetType: 'CONTENT',
        targetId: contentId,
        primaryReason: 'SECURITY',
        priority: 'URGENT',
        status: 'OPEN',
        reportCount: 1,
      });

      const duplicate = await moderation.createReport(
        {
          targetType: 'CONTENT',
          targetId: contentId,
          reason: 'SECURITY',
          details: 'Repeated by the same reporter.',
        },
        reporterOneId,
        `report-duplicate-${correlation}`,
      );
      expect(duplicate.report.id).toBe(first.report.id);
      expect(duplicate.moderationCase.reportCount).toBe(1);

      const secondReporter = await moderation.createReport(
        {
          targetType: 'CONTENT',
          targetId: contentId,
          reason: 'SECURITY',
          details: 'Independent confirmation.',
        },
        reporterTwoId,
        `report-two-${correlation}`,
      );
      expect(secondReporter.moderationCase.id).toBe(first.moderationCase.id);
      expect(secondReporter.moderationCase.reportCount).toBe(2);

      await expect(moderation.listCases(reporterOneId, 20)).rejects.toBeInstanceOf(
        ModerationOperatorAccessDeniedError,
      );

      await database.query(
        `
          insert into "account_platform_roles" (
            "id", "account_id", "role", "granted_by_account_id"
          ) values ($1, $2, 'MODERATOR', $2)
        `,
        [randomUUID(), moderatorId],
      );

      const queue = await moderation.listCases(moderatorId, 20);
      expect(queue.items[0]).toMatchObject({
        id: first.moderationCase.id,
        priority: 'URGENT',
        reportCount: 2,
      });

      const firstClaim = await moderation.claimCase(
        moderatorId,
        first.moderationCase.id,
        `claim-one-${correlation}`,
      );
      const secondClaim = await moderation.claimCase(
        moderatorId,
        first.moderationCase.id,
        `claim-two-${correlation}`,
      );
      expect(firstClaim).toMatchObject({
        status: 'IN_REVIEW',
        assignedToAccountId: moderatorId,
      });
      expect(secondClaim).toEqual(firstClaim);

      const reportCount = await database.query<CountRow>(
        'select count(*)::text as "count" from "moderation_reports" where "case_id" = $1',
        [first.moderationCase.id],
      );
      expect(Number(reportCount.rows[0]?.count ?? '0')).toBe(2);

      const claimEventCount = await database.query<CountRow>(
        `
          select count(*)::text as "count"
          from "moderation_case_events"
          where "case_id" = $1 and "event_type" = 'CASE_CLAIMED'
        `,
        [first.moderationCase.id],
      );
      expect(Number(claimEventCount.rows[0]?.count ?? '0')).toBe(1);
    } finally {
      if (caseId) {
        await database.query('delete from "moderation_cases" where "id" = $1', [caseId]);
      }
      await database.query('delete from "account_platform_roles" where "account_id" = $1', [
        moderatorId,
      ]);
      await database.query(
        'delete from "audit_events" where "actor_id" in ($1, $2, $3, $4)',
        [reporterOneId, reporterTwoId, moderatorId, agentId],
      );
      await database.query('delete from "social_content" where "id" = $1', [contentId]);
      await database.query('delete from "agent_profiles" where "id" = $1', [agentId]);
      await database.query('delete from "accounts" where "id" in ($1, $2, $3)', [
        reporterOneId,
        reporterTwoId,
        moderatorId,
      ]);
    }
  });
});
