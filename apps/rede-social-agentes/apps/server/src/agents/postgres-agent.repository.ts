import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type { AgentStatus } from '@rsa/contracts';
import type { DatabaseRow } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import {
  ActiveResponsibilityRequiredError,
  AgentHandleAlreadyExistsError,
  AgentNotFoundError,
  InvalidAgentTransitionError,
} from './agent.errors.js';
import type {
  AgentRecord,
  AgentRepository,
  CreateAgentWithResponsibilityInput,
  ResponsibilityLinkRecord,
  TransitionAgentStateInput,
} from './agent.repository.js';
import { canResponsibleTransition } from './agent-state.js';

interface AgentRow extends DatabaseRow {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  capabilities: string[];
  status: AgentStatus;
  created_at: Date;
}

interface ResponsibilityRow extends DatabaseRow {
  id: string;
  agent_id: string;
  responsible_account_id: string;
  status: 'ACTIVE' | 'ENDED';
  started_at: Date;
  ended_at: Date | null;
}

function mapAgent(row: AgentRow): AgentRecord {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio,
    capabilities: row.capabilities,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapResponsibility(row: ResponsibilityRow): ResponsibilityLinkRecord {
  return {
    id: row.id,
    agentId: row.agent_id,
    responsibleAccountId: row.responsible_account_id,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

@Injectable()
export class PostgresAgentRepository implements AgentRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async createAgentWithResponsibility(
    input: CreateAgentWithResponsibilityInput,
  ): Promise<{ agent: AgentRecord; responsibility: ResponsibilityLinkRecord }> {
    try {
      return await this.database.transaction(async (client) => {
        const agentResult = await client.query<AgentRow>(
          `
            insert into "agent_profiles" (
              "id", "handle", "display_name", "bio", "capabilities", "status"
            ) values ($1, $2, $3, $4, $5::jsonb, 'DRAFT')
            returning
              "id", "handle", "display_name", "bio", "capabilities", "status", "created_at"
          `,
          [
            input.agentId,
            input.handle,
            input.displayName,
            input.bio,
            JSON.stringify(input.capabilities),
          ],
        );

        const responsibilityResult = await client.query<ResponsibilityRow>(
          `
            insert into "responsibility_links" (
              "id", "agent_id", "responsible_account_id", "status"
            ) values ($1, $2, $3, 'ACTIVE')
            returning
              "id", "agent_id", "responsible_account_id", "status", "started_at", "ended_at"
          `,
          [input.responsibilityId, input.agentId, input.responsibleAccountId],
        );

        await client.query(
          `
            insert into "audit_events" (
              "id", "actor_id", "actor_type", "event_type", "aggregate_type",
              "aggregate_id", "correlation_id", "payload"
            ) values
              ($1, $2, 'HUMAN', 'AGENT_PROFILE_CREATED', 'AGENT', $3, $4, $5),
              ($6, $2, 'HUMAN', 'RESPONSIBILITY_LINK_ACTIVATED', 'RESPONSIBILITY_LINK', $7, $4, $8)
          `,
          [
            randomUUID(),
            input.responsibleAccountId,
            input.agentId,
            input.correlationId,
            { status: 'DRAFT' },
            randomUUID(),
            input.responsibilityId,
            { agentId: input.agentId },
          ],
        );

        const agentRow = agentResult.rows[0];
        const responsibilityRow = responsibilityResult.rows[0];
        if (!agentRow || !responsibilityRow) {
          throw new Error('Agent creation did not return the expected records.');
        }

        return {
          agent: mapAgent(agentRow),
          responsibility: mapResponsibility(responsibilityRow),
        };
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AgentHandleAlreadyExistsError();
      }
      throw error;
    }
  }

  async transitionAgentState(input: TransitionAgentStateInput): Promise<AgentRecord> {
    return this.database.transaction(async (client) => {
      const agentResult = await client.query<AgentRow>(
        `
          select
            "id", "handle", "display_name", "bio", "capabilities", "status", "created_at"
          from "agent_profiles"
          where "id" = $1
          for update
        `,
        [input.agentId],
      );

      const agentRow = agentResult.rows[0];
      if (!agentRow) {
        throw new AgentNotFoundError();
      }

      const responsibilityResult = await client.query(
        `
          select "id"
          from "responsibility_links"
          where "agent_id" = $1
            and "responsible_account_id" = $2
            and "status" = 'ACTIVE'
          limit 1
        `,
        [input.agentId, input.responsibleAccountId],
      );

      if (responsibilityResult.rowCount !== 1) {
        throw new ActiveResponsibilityRequiredError();
      }

      if (!canResponsibleTransition(agentRow.status, input.targetStatus)) {
        throw new InvalidAgentTransitionError();
      }

      const updatedResult = await client.query<AgentRow>(
        `
          update "agent_profiles"
          set "status" = $2, "updated_at" = now()
          where "id" = $1
          returning
            "id", "handle", "display_name", "bio", "capabilities", "status", "created_at"
        `,
        [input.agentId, input.targetStatus],
      );

      await client.query(
        `
          insert into "audit_events" (
            "id", "actor_id", "actor_type", "event_type", "aggregate_type",
            "aggregate_id", "correlation_id", "payload"
          ) values ($1, $2, 'HUMAN', 'AGENT_STATE_CHANGED', 'AGENT', $3, $4, $5)
        `,
        [
          randomUUID(),
          input.responsibleAccountId,
          input.agentId,
          input.correlationId,
          { from: agentRow.status, to: input.targetStatus },
        ],
      );

      const updatedRow = updatedResult.rows[0];
      if (!updatedRow) {
        throw new Error('Agent state update did not return the updated record.');
      }

      return mapAgent(updatedRow);
    });
  }
}
