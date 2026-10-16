import { createHash, randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type { DatabaseRow, DatabaseTransaction } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import type {
  WhatsAppInboundEnvelope,
  WhatsAppInboxMessage,
} from './whatsapp-channel.contracts.js';

const AGGREGATE_TYPE = 'MCF_WHATSAPP_INBOX';
const RECEIVED_EVENT = 'WHATSAPP_INBOX_RECEIVED';
const CLAIMED_EVENT = 'WHATSAPP_INBOX_CLAIMED';
const PROCESSED_EVENT = 'WHATSAPP_INBOX_PROCESSED';
const CLAIM_LEASE = "interval '5 minutes'";

interface ReceivedEventRow extends DatabaseRow {
  messageId: string;
  payload: unknown;
  receivedAt: Date;
}

interface ClaimEventRow extends DatabaseRow {
  payload: unknown;
  claimedAt: Date;
}

interface ReceivedPayload {
  phoneNumberId: string;
  senderWaId: string;
  senderHash: string;
  messageType: string;
  textBody: string | null;
  providerTimestamp: string | null;
  metadata: Record<string, unknown>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asReceivedPayload(value: unknown): ReceivedPayload | null {
  const payload = asRecord(value);
  const phoneNumberId = payload.phoneNumberId;
  const senderWaId = payload.senderWaId;
  const senderHash = payload.senderHash;
  const messageType = payload.messageType;
  const textBody = payload.textBody;
  const providerTimestamp = payload.providerTimestamp;
  const metadata = payload.metadata;

  if (
    typeof phoneNumberId !== 'string' ||
    typeof senderWaId !== 'string' ||
    typeof senderHash !== 'string' ||
    typeof messageType !== 'string' ||
    !(textBody === null || typeof textBody === 'string') ||
    !(providerTimestamp === null || typeof providerTimestamp === 'string')
  ) {
    return null;
  }

  return {
    phoneNumberId,
    senderWaId,
    senderHash,
    messageType,
    textBody,
    providerTimestamp,
    metadata: asRecord(metadata),
  };
}

function hashSender(senderWaId: string): string {
  return createHash('sha256').update(senderWaId).digest('hex');
}

function deterministicEventId(prefix: string, messageId: string): string {
  const digest = createHash('sha256').update(messageId).digest('hex');
  return `wa-inbox-${prefix}-${digest}`;
}

function toClaimedMessage(
  row: ReceivedEventRow,
  consumer: string,
  claimedAt: Date,
): WhatsAppInboxMessage | null {
  const payload = asReceivedPayload(row.payload);
  if (!payload) return null;
  return {
    messageId: row.messageId,
    phoneNumberId: payload.phoneNumberId,
    senderWaId: payload.senderWaId,
    senderHash: payload.senderHash,
    messageType: payload.messageType,
    textBody: payload.textBody,
    providerTimestamp: payload.providerTimestamp ? new Date(payload.providerTimestamp) : null,
    metadata: payload.metadata,
    state: 'CLAIMED',
    claimOwner: consumer,
    claimedAt,
    processedAt: null,
    receivedAt: row.receivedAt,
    updatedAt: claimedAt,
  };
}

async function lockReceivedEvent(
  client: DatabaseTransaction,
  messageId: string,
): Promise<ReceivedEventRow | null> {
  const result = await client.query<ReceivedEventRow>(
    `select
       "aggregate_id" as "messageId",
       "payload",
       "occurred_at" as "receivedAt"
     from "audit_events"
     where "aggregate_type" = $1
       and "aggregate_id" = $2
       and "event_type" = $3
     order by "occurred_at" asc
     limit 1
     for update`,
    [AGGREGATE_TYPE, messageId, RECEIVED_EVENT],
  );
  return result.rows[0] ?? null;
}

@Injectable()
export class WhatsAppInboxRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async persist(
    messages: readonly WhatsAppInboundEnvelope[],
  ): Promise<{ inserted: number; duplicates: number }> {
    if (messages.length === 0) return { inserted: 0, duplicates: 0 };

    let inserted = 0;
    const receivedAt = new Date();
    await this.database.transaction(async (client) => {
      for (const message of messages) {
        const result = await client.query(
          `insert into "audit_events" (
            "id", "actor_id", "actor_type", "event_type", "aggregate_type",
            "aggregate_id", "correlation_id", "payload", "occurred_at"
          ) values ($1, null, 'SYSTEM', $2, $3, $4, $5, $6::jsonb, $7)
          on conflict ("id") do nothing
          returning "id"`,
          [
            deterministicEventId('received', message.messageId),
            RECEIVED_EVENT,
            AGGREGATE_TYPE,
            message.messageId,
            message.messageId,
            JSON.stringify({
              phoneNumberId: message.phoneNumberId,
              senderWaId: message.senderWaId,
              senderHash: hashSender(message.senderWaId),
              messageType: message.messageType,
              textBody: message.textBody,
              providerTimestamp: message.providerTimestamp?.toISOString() ?? null,
              metadata: message.metadata,
            }),
            receivedAt,
          ],
        );
        if (result.rowCount === 1) inserted += 1;
      }
    });

    return { inserted, duplicates: messages.length - inserted };
  }

  async claimPending(consumer: string, limit: number): Promise<WhatsAppInboxMessage[]> {
    return this.database.transaction(async (client) => {
      const candidates = await client.query<ReceivedEventRow>(
        `select
           received."aggregate_id" as "messageId",
           received."payload",
           received."occurred_at" as "receivedAt"
         from "audit_events" as received
         where received."aggregate_type" = $1
           and received."event_type" = $2
           and not exists (
             select 1
             from "audit_events" as processed
             where processed."aggregate_type" = received."aggregate_type"
               and processed."aggregate_id" = received."aggregate_id"
               and processed."event_type" = $3
           )
           and not exists (
             select 1
             from "audit_events" as claimed
             where claimed."aggregate_type" = received."aggregate_type"
               and claimed."aggregate_id" = received."aggregate_id"
               and claimed."event_type" = $4
               and claimed."occurred_at" >= now() - ${CLAIM_LEASE}
           )
         order by received."occurred_at" asc, received."aggregate_id" asc
         limit $5
         for update of received skip locked`,
        [AGGREGATE_TYPE, RECEIVED_EVENT, PROCESSED_EVENT, CLAIMED_EVENT, limit],
      );

      const claimed: WhatsAppInboxMessage[] = [];
      for (const candidate of candidates.rows) {
        const claimedAt = new Date();
        await client.query(
          `insert into "audit_events" (
            "id", "actor_id", "actor_type", "event_type", "aggregate_type",
            "aggregate_id", "correlation_id", "payload", "occurred_at"
          ) values ($1, null, 'SYSTEM', $2, $3, $4, $5, $6::jsonb, $7)`,
          [
            `wa-inbox-claim-${randomUUID()}`,
            CLAIMED_EVENT,
            AGGREGATE_TYPE,
            candidate.messageId,
            candidate.messageId,
            JSON.stringify({ consumer }),
            claimedAt,
          ],
        );
        const mapped = toClaimedMessage(candidate, consumer, claimedAt);
        if (mapped) claimed.push(mapped);
      }
      return claimed;
    });
  }

  async acknowledge(messageId: string, consumer: string): Promise<boolean> {
    return this.database.transaction(async (client) => {
      const received = await lockReceivedEvent(client, messageId);
      if (!received) return false;

      const processed = await client.query(
        `select 1
         from "audit_events"
         where "aggregate_type" = $1
           and "aggregate_id" = $2
           and "event_type" = $3
         limit 1`,
        [AGGREGATE_TYPE, messageId, PROCESSED_EVENT],
      );
      if ((processed.rowCount ?? 0) > 0) return false;

      const latestClaim = await client.query<ClaimEventRow>(
        `select
           "payload",
           "occurred_at" as "claimedAt"
         from "audit_events"
         where "aggregate_type" = $1
           and "aggregate_id" = $2
           and "event_type" = $3
         order by "occurred_at" desc
         limit 1`,
        [AGGREGATE_TYPE, messageId, CLAIMED_EVENT],
      );
      const claim = latestClaim.rows[0];
      if (!claim || claim.claimedAt.getTime() < Date.now() - 5 * 60 * 1_000) return false;
      if (asRecord(claim.payload).consumer !== consumer) return false;

      const result = await client.query(
        `insert into "audit_events" (
          "id", "actor_id", "actor_type", "event_type", "aggregate_type",
          "aggregate_id", "correlation_id", "payload", "occurred_at"
        ) values ($1, null, 'SYSTEM', $2, $3, $4, $5, $6::jsonb, now())
        on conflict ("id") do nothing
        returning "id"`,
        [
          deterministicEventId('processed', messageId),
          PROCESSED_EVENT,
          AGGREGATE_TYPE,
          messageId,
          messageId,
          JSON.stringify({ consumer }),
        ],
      );
      return result.rowCount === 1;
    });
  }
}
