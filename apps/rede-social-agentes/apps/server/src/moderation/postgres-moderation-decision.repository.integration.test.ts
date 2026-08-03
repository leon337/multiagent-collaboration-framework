import { randomUUID } from 'node:crypto';

import type { DatabaseRow } from '@rsa/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PostgresAgentRepository } from '../agents/postgres-agent.repository.js';
import { DatabaseService } from '../database.service.js';
import { PostgresIdentityRepository } from '../identity/postgres-identity.repository.js';
import { ModerationOperatorAccessDeniedError } from './moderation.errors.js';
import { ModerationService } from './moderation.service.js';
import { PostgresModerationDecisionRepository } from './postgres-moderation-decision.repository.js';
import { PostgresModerationRepository } from './postgres-moderation.repository.js';

interface StatusRow extends DatabaseRow {
  status: string;
}

describe('PostgresModerationDecisionRepository integration', () => {
  let database: DatabaseService;

  beforeAll(() => {
    database = new DatabaseService();
  });

  afterAll(async () => {
    await database.onModuleDestroy();
  });

  it('applies a reversible action, accepts an appeal and restores the target', async () => {
    const identities = new PostgresIdentityRepository(database);
    const agents = new PostgresAgentRepository(database);
    const moderation = new ModerationService(
      new PostgresModerationRepository(database),
      new PostgresModerationDecisionRepository(database),
    );
    const ownerId = randomUUID();
    const reporterId = randomUUID();
    const moderatorId = randomUUID();
    const supervisorId = randomUUID();
    const agentId = randomUUID();
    const contentId = randomUUID();
    const correlation = randomUUID();
    let caseId: string | null = null;

    try {
      for (const [accountId, label] of [
        [ownerId, 'owner'],
        [reporterId, 'reporter'],
        [moderatorId, 'moderator'],
        [supervisorId, 'supervisor'],
      ] as const) {
        await identities.createHumanAccount({
          id: accountId,
          email: `decision-${label}-${accountId}@example.test`,
          displayName: `Decision ${label}`,
          passwordHash: `scrypt$integration$${label}`,
          correlationId: `${label}-${correlation}`,
        });
      }

      await agents.createAgentWithResponsibility({
        agentId,
        responsibilityId: randomUUID(),
        responsibleAccountId: ownerId,
        handle: `decision_${agentId.replaceAll('-', '').slice(0, 18)}`,
        displayName: 'Decision Target Agent',
        bio: null,
        capabilities: ['publishing'],
        correlationId: `agent-${correlation}`,
      });
      await agents.transitionAgentState({
        agentId,
        responsibleAccountId: ownerId,
        targetStatus: 'ACTIVE',
        correlationId: `activate-${correlation}`,
      });
      await database.query(
        `
          insert into "social_content" (
            "id", "author_agent_id", "responsible_account_id", "approved_by_account_id",
            "body", "status", "published_at"
          ) values ($1, $2, $3, $3, 'Reversible moderation target', 'PUBLISHED', now())
        `,
        [contentId, agentId, ownerId],
      );
      await database.query(
        `
          insert into "account_platform_roles" (
            "id", "account_id", "role", "granted_by_account_id"
          ) values
            ($1, $3, 'MODERATOR', $4),
            ($2, $4, 'SUPERVISOR', $4)
        `,
        [randomUUID(), randomUUID(), moderatorId, supervisorId],
      );

      const report = await moderation.createReport(
        {
          targetType: 'CONTENT',
          targetId: contentId,
          reason: 'HARASSMENT',
          details: 'Request human review.',
        },
        reporterId,
        `report-${correlation}`,
      );
      caseId = report.moderationCase.id;

      await moderation.claimCase(moderatorId, caseId, `claim-moderator-${correlation}`);
      const resolved = await moderation.resolveCase(
        moderatorId,
        caseId,
        {
          action: 'HIDE_CONTENT',
          reason: 'Temporarily hide during review.',
          evidence: { source: 'integration-test' },
        },
        `resolve-${correlation}`,
      );
      expect(resolved.status).toBe('RESOLVED');
      const hiddenContent = await database.query<StatusRow>(
        'select "status" from "social_content" where "id" = $1',
        [contentId],
      );
      expect(hiddenContent.rows[0]?.status).toBe('ARCHIVED');

      const appeal = await moderation.createAppeal(
        ownerId,
        caseId,
        { reason: 'The decision should be reviewed by a supervisor.' },
        `appeal-${correlation}`,
      );
      expect(appeal.status).toBe('OPEN');

      await moderation.claimCase(supervisorId, caseId, `claim-supervisor-${correlation}`);
      const reversedAppeal = await moderation.reverseCase(
        supervisorId,
        caseId,
        'Evidence does not support the restriction.',
        { reviewed: true },
        `reverse-${correlation}`,
      );
      expect(reversedAppeal.status).toBe('OVERTURNED');

      const restoredContent = await database.query<StatusRow>(
        'select "status" from "social_content" where "id" = $1',
        [contentId],
      );
      expect(restoredContent.rows[0]?.status).toBe('PUBLISHED');

      const finalCase = await moderation.getCase(supervisorId, caseId);
      expect(finalCase).toMatchObject({ status: 'RESOLVED' });

      const overview = await moderation.getOverview(supervisorId);
      expect(overview.generatedAt).toBeTruthy();
      expect(overview.openCases).toBeGreaterThanOrEqual(0);

      await expect(
        moderation.resolveCase(
          moderatorId,
          caseId,
          { action: 'PAUSE_AGENT', reason: 'Not allowed for a moderator.' },
          `unauthorized-high-impact-${correlation}`,
        ),
      ).rejects.toBeTruthy();
    } finally {
      if (caseId) {
        await database.query('delete from "moderation_cases" where "id" = $1', [caseId]);
      }
      await database.query(
        'delete from "account_platform_roles" where "account_id" in ($1, $2)',
        [moderatorId, supervisorId],
      );
      await database.query(
        'delete from "audit_events" where "actor_id" in ($1, $2, $3, $4, $5)',
        [ownerId, reporterId, moderatorId, supervisorId, agentId],
      );
      await database.query('delete from "social_content" where "id" = $1', [contentId]);
      await database.query('delete from "agent_profiles" where "id" = $1', [agentId]);
      await database.query('delete from "accounts" where "id" in ($1, $2, $3, $4)', [
        ownerId,
        reporterId,
        moderatorId,
        supervisorId,
      ]);
    }
  });

  it('does not allow a moderator to execute supervisor-only actions', async () => {
    const decisions = new PostgresModerationDecisionRepository(database);
    await expect(decisions.getOperatorRole(randomUUID())).resolves.toBeNull();
    await expect(
      new ModerationService(new PostgresModerationRepository(database), decisions).getOverview(
        randomUUID(),
      ),
    ).rejects.toBeInstanceOf(ModerationOperatorAccessDeniedError);
  });
});
