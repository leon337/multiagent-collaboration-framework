import { Injectable } from '@nestjs/common';
import type { McfChatDispatchResponse } from '@rsa/contracts';
import type { DatabaseRow } from '@rsa/database';

import type { DatabaseService } from '../database.service.js';
import type {
  ChatDispatchRepository,
  ChatDispatchReservation,
  ReserveChatDispatchResult,
} from './chat-dispatch.repository.js';

interface DispatchRow extends DatabaseRow {
  accountId: string;
  dispatchId: string;
  requestDigest: string;
  state: string;
  missionId: string | null;
  response: unknown;
}

const dispatchColumns = `
  "account_id" as "accountId",
  "dispatch_id" as "dispatchId",
  "request_digest" as "requestDigest",
  "state",
  "mission_id" as "missionId",
  "response"
`;

function mapReservation(row: DispatchRow): ChatDispatchReservation {
  return {
    accountId: row.accountId,
    dispatchId: row.dispatchId,
    requestDigest: row.requestDigest,
    state: row.state as ChatDispatchReservation['state'],
    missionId: row.missionId,
    response:
      typeof row.response === 'object' && row.response !== null
        ? (row.response as McfChatDispatchResponse)
        : null,
  };
}

@Injectable()
export class PostgresChatDispatchRepository implements ChatDispatchRepository {
  constructor(private readonly database: DatabaseService) {}

  async reserve(
    accountId: string,
    dispatchId: string,
    requestDigest: string,
  ): Promise<ReserveChatDispatchResult> {
    return this.database.transaction(async (client) => {
      const inserted = await client.query<DispatchRow>(
        `insert into "mcf_chat_dispatches" (
          "account_id", "dispatch_id", "request_digest", "state"
        ) values ($1, $2, $3, 'IN_PROGRESS')
        on conflict ("account_id", "dispatch_id") do nothing
        returning ${dispatchColumns}`,
        [accountId, dispatchId, requestDigest],
      );

      const insertedRow = inserted.rows[0];
      if (insertedRow) {
        return { status: 'RESERVED', reservation: mapReservation(insertedRow) };
      }

      const existing = await client.query<DispatchRow>(
        `select ${dispatchColumns}
         from "mcf_chat_dispatches"
         where "account_id" = $1 and "dispatch_id" = $2
         for update`,
        [accountId, dispatchId],
      );
      const existingRow = existing.rows[0];
      if (!existingRow) {
        throw new Error('MCF chat dispatch reservation disappeared after conflict.');
      }
      return { status: 'EXISTING', reservation: mapReservation(existingRow) };
    });
  }

  async attachMission(
    accountId: string,
    dispatchId: string,
    requestDigest: string,
    missionId: string,
  ): Promise<void> {
    const result = await this.database.query(
      `update "mcf_chat_dispatches"
       set "mission_id" = $1, "updated_at" = now()
       where "account_id" = $2
         and "dispatch_id" = $3
         and "request_digest" = $4
         and "state" = 'IN_PROGRESS'
         and "mission_id" is null`,
      [missionId, accountId, dispatchId, requestDigest],
    );
    if (result.rowCount !== 1) {
      throw new Error('MCF mission could not be attached to the dispatch reservation.');
    }
  }

  async complete(
    accountId: string,
    dispatchId: string,
    requestDigest: string,
    response: McfChatDispatchResponse,
  ): Promise<void> {
    const result = await this.database.query(
      `update "mcf_chat_dispatches"
       set "state" = 'COMPLETED',
           "response" = $1::jsonb,
           "updated_at" = now()
       where "account_id" = $2
         and "dispatch_id" = $3
         and "request_digest" = $4
         and "mission_id" = $5
         and "state" = 'IN_PROGRESS'`,
      [JSON.stringify(response), accountId, dispatchId, requestDigest, response.mission.id],
    );
    if (result.rowCount !== 1) {
      throw new Error('MCF chat dispatch could not be completed from its reserved state.');
    }
  }

  async releaseUnattached(
    accountId: string,
    dispatchId: string,
    requestDigest: string,
  ): Promise<void> {
    await this.database.query(
      `delete from "mcf_chat_dispatches"
       where "account_id" = $1
         and "dispatch_id" = $2
         and "request_digest" = $3
         and "state" = 'IN_PROGRESS'
         and "mission_id" is null`,
      [accountId, dispatchId, requestDigest],
    );
  }
}
