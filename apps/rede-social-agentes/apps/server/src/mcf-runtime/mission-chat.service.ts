import { createHash, randomUUID } from 'node:crypto';

import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DatabaseRow } from '@rsa/database';

import { DatabaseService } from '../database.service.js';

export type ChatKind = 'MESSAGE' | 'TASK' | 'RESULT' | 'BLOCKER' | 'HANDOFF' | 'APPROVAL_REQUEST';

export interface MissionChatMessage {
  sequence: string;
  id: string;
  roomId: string;
  actorKind: 'HUMAN' | 'AGENT_REPORTED';
  actorId: string;
  actorLabel: string;
  kind: ChatKind;
  content: string;
  trustLabel: 'AUTHENTICATED_HUMAN' | 'RUNTIME_REPORTED';
  createdAt: string;
}

interface MessageRow extends DatabaseRow {
  sequence: string;
  id: string;
  room_id: string;
  actor_kind: MissionChatMessage['actorKind'];
  actor_id: string;
  actor_label: string;
  kind: ChatKind;
  content: string;
  trust_label: MissionChatMessage['trustLabel'];
  created_at: Date;
  request_fingerprint: string | null;
}

interface MissionRow extends DatabaseRow {
  id: string;
  title: string | null;
  state: string;
}

interface RoomExistsRow extends DatabaseRow {
  id: string;
}

function mapMessage(row: MessageRow): MissionChatMessage {
  return {
    sequence: String(row.sequence),
    id: row.id,
    roomId: row.room_id,
    actorKind: row.actor_kind,
    actorId: row.actor_id,
    actorLabel: row.actor_label,
    kind: row.kind,
    content: row.content,
    trustLabel: row.trust_label,
    createdAt: row.created_at.toISOString(),
  };
}

@Injectable()
export class MissionChatService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  /**
   * The browser session proves a human account, not delegation authority.
   * Production requires the configured reserved authority account.
   */
  assertHumanAuthority(accountId: string): void {
    const reserved = process.env.RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID;
    if (
      (process.env.NODE_ENV === 'production' && !reserved) ||
      (reserved && accountId !== reserved)
    ) {
      throw new ForbiddenException({
        code: 'MCF_CHAT_HUMAN_AUTHORITY_REQUIRED',
        message: 'The mission chat is reserved for the authenticated human authority.',
      });
    }
  }

  async rooms(): Promise<Array<{ id: string; title: string; state: string; type: string }>> {
    const result = await this.database.query<MissionRow>(
      `select "id", "contract"->>'title' as "title", "state"
       from "mcf_missions"
       order by "updated_at" desc, "id" desc limit 30`,
    );
    return [
      { id: 'geral', title: 'Sala geral', state: 'OPEN', type: 'GENERAL' },
      ...result.rows.map((row) => ({
        id: row.id,
        title: row.title ?? row.id,
        state: row.state,
        type: 'MISSION',
      })),
    ];
  }

  async ensureRoom(roomId: string): Promise<void> {
    if (roomId === 'geral') return;
    const result = await this.database.query<RoomExistsRow>(
      'select "id" from "mcf_missions" where "id" = $1 limit 1',
      [roomId],
    );
    if (!result.rows.length) {
      throw new NotFoundException({
        code: 'MCF_CHAT_ROOM_NOT_FOUND',
        message: 'The mission room does not exist.',
      });
    }
  }

  async messages(roomId: string, after: string): Promise<MissionChatMessage[]> {
    await this.ensureRoom(roomId);
    // Initial view shows the most recent 100 messages; subsequent reads are cursor-based.
    const query =
      after === '0'
        ? `select * from (
          select "sequence"::text as "sequence", "id", "room_id", "actor_kind",
                 "actor_id", "actor_label", "kind", "content", "trust_label",
                 "created_at", "request_fingerprint"
          from "mcf_chat_messages" where "room_id" = $1
          order by "sequence" desc limit 100
        ) recent order by "sequence"::bigint asc`
        : `select "sequence"::text as "sequence", "id", "room_id", "actor_kind",
                "actor_id", "actor_label", "kind", "content", "trust_label",
                "created_at", "request_fingerprint"
         from "mcf_chat_messages"
         where "room_id" = $1 and "sequence" > $2::bigint
         order by "sequence" asc limit 100`;
    const rows = await this.database.query<MessageRow>(
      query,
      after === '0' ? [roomId] : [roomId, after],
    );
    return rows.rows.map(mapMessage);
  }

  async send(
    roomId: string,
    actor: { kind: MissionChatMessage['actorKind']; id: string; label: string },
    kind: ChatKind,
    content: string,
    idempotencyKey?: string,
  ): Promise<MissionChatMessage> {
    await this.ensureRoom(roomId);
    const trust = actor.kind === 'HUMAN' ? 'AUTHENTICATED_HUMAN' : 'RUNTIME_REPORTED';
    const fingerprint = createHash('sha256')
      .update(JSON.stringify([roomId, actor.kind, actor.id, actor.label, kind, content]))
      .digest('hex');
    const result = await this.database.query<MessageRow>(
      `insert into "mcf_chat_messages" (
         "id", "room_id", "mission_id", "actor_kind", "actor_id", "actor_label",
         "kind", "content", "trust_label", "idempotency_key", "request_fingerprint"
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict ("idempotency_key") do nothing
       returning "sequence"::text as "sequence", "id", "room_id", "actor_kind",
                 "actor_id", "actor_label", "kind", "content", "trust_label",
                 "created_at", "request_fingerprint"`,
      [
        randomUUID(),
        roomId,
        roomId === 'geral' ? null : roomId,
        actor.kind,
        actor.id,
        actor.label,
        kind,
        content,
        trust,
        idempotencyKey ?? null,
        fingerprint,
      ],
    );
    if (result.rows[0]) return mapMessage(result.rows[0]);

    if (idempotencyKey) {
      const previous = await this.database.query<MessageRow>(
        `select "sequence"::text as "sequence", "id", "room_id", "actor_kind",
                "actor_id", "actor_label", "kind", "content", "trust_label",
                "created_at", "request_fingerprint"
         from "mcf_chat_messages" where "idempotency_key" = $1`,
        [idempotencyKey],
      );
      const row = previous.rows[0];
      if (row?.request_fingerprint === fingerprint) return mapMessage(row);
    }
    throw new ConflictException({
      code: 'MCF_CHAT_IDEMPOTENCY_CONFLICT',
      message: 'An idempotency key was reused for different message data.',
    });
  }
}
