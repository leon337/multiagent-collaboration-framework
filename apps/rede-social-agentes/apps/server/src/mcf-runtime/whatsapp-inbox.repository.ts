import { createHash } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import type { DatabaseRow } from '@rsa/database';

import { DatabaseService } from '../database.service.js';
import type {
  WhatsAppInboundEnvelope,
  WhatsAppInboxMessage,
  WhatsAppInboxState,
} from './whatsapp-channel.contracts.js';

interface InboxRow extends DatabaseRow {
  messageId: string;
  phoneNumberId: string;
  senderWaId: string;
  senderHash: string;
  messageType: string;
  textBody: string | null;
  providerTimestamp: Date | null;
  metadata: unknown;
  state: string;
  claimOwner: string | null;
  claimedAt: Date | null;
  processedAt: Date | null;
  receivedAt: Date;
  updatedAt: Date;
}

const inboxColumns = `
  inbox."message_id" as "messageId",
  inbox."phone_number_id" as "phoneNumberId",
  inbox."sender_wa_id" as "senderWaId",
  inbox."sender_hash" as "senderHash",
  inbox."message_type" as "messageType",
  inbox."text_body" as "textBody",
  inbox."provider_timestamp" as "providerTimestamp",
  inbox."metadata",
  inbox."state",
  inbox."claim_owner" as "claimOwner",
  inbox."claimed_at" as "claimedAt",
  inbox."processed_at" as "processedAt",
  inbox."received_at" as "receivedAt",
  inbox."updated_at" as "updatedAt"
`;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapRow(row: InboxRow): WhatsAppInboxMessage {
  return {
    messageId: row.messageId,
    phoneNumberId: row.phoneNumberId,
    senderWaId: row.senderWaId,
    senderHash: row.senderHash,
    messageType: row.messageType,
    textBody: row.textBody,
    providerTimestamp: row.providerTimestamp,
    metadata: asRecord(row.metadata),
    state: row.state as WhatsAppInboxState,
    claimOwner: row.claimOwner,
    claimedAt: row.claimedAt,
    processedAt: row.processedAt,
    receivedAt: row.receivedAt,
    updatedAt: row.updatedAt,
  };
}

function hashSender(senderWaId: string): string {
  return createHash('sha256').update(senderWaId).digest('hex');
}

@Injectable()
export class WhatsAppInboxRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async persist(
    messages: readonly WhatsAppInboundEnvelope[],
  ): Promise<{ inserted: number; duplicates: number }> {
    if (messages.length === 0) return { inserted: 0, duplicates: 0 };

    let inserted = 0;
    await this.database.transaction(async (client) => {
      for (const message of messages) {
        const result = await client.query(
          `insert into "mcf_whatsapp_inbox" (
            "message_id", "phone_number_id", "sender_wa_id", "sender_hash",
            "message_type", "text_body", "provider_timestamp", "metadata"
          ) values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
          on conflict ("message_id") do nothing
          returning "message_id"`,
          [
            message.messageId,
            message.phoneNumberId,
            message.senderWaId,
            hashSender(message.senderWaId),
            message.messageType,
            message.textBody,
            message.providerTimestamp,
            JSON.stringify(message.metadata),
          ],
        );
        if (result.rowCount === 1) inserted += 1;
      }
    });

    return { inserted, duplicates: messages.length - inserted };
  }

  async claimPending(consumer: string, limit: number): Promise<WhatsAppInboxMessage[]> {
    return this.database.transaction(async (client) => {
      const result = await client.query<InboxRow>(
        `with candidates as (
          select "message_id"
          from "mcf_whatsapp_inbox"
          where
            "state" = 'RECEIVED'
            or (
              "state" = 'CLAIMED'
              and "claimed_at" < now() - interval '5 minutes'
            )
          order by "received_at" asc, "message_id" asc
          for update skip locked
          limit $1
        )
        update "mcf_whatsapp_inbox" as inbox
        set
          "state" = 'CLAIMED',
          "claim_owner" = $2,
          "claimed_at" = now(),
          "updated_at" = now()
        from candidates
        where inbox."message_id" = candidates."message_id"
        returning ${inboxColumns}`,
        [limit, consumer],
      );
      return result.rows.map(mapRow);
    });
  }

  async acknowledge(messageId: string, consumer: string): Promise<boolean> {
    const result = await this.database.query(
      `update "mcf_whatsapp_inbox"
       set
         "state" = 'PROCESSED',
         "processed_at" = now(),
         "updated_at" = now()
       where "message_id" = $1
         and "state" = 'CLAIMED'
         and "claim_owner" = $2`,
      [messageId, consumer],
    );
    return result.rowCount === 1;
  }
}
