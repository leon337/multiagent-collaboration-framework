import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';

export interface WhatsAppWebhookConfig {
  enabled: boolean;
  verifyToken: string;
  appSecret: string;
}

export interface WhatsAppWebhookSummary {
  object: string | null;
  entryCount: number;
  changeCount: number;
  messageCount: number;
  statusCount: number;
  messageTypes: string[];
  phoneNumberIds: string[];
}

function equalDigest(left: string, right: string): boolean {
  const a = Buffer.from(left, 'utf8');
  const b = Buffer.from(right, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

@Injectable()
export class WhatsAppWebhookService {
  constructor(private readonly config: WhatsAppWebhookConfig) {}

  verifyChallenge(mode: unknown, token: unknown, challenge: unknown): string | null {
    if (!this.config.enabled) return null;
    if (
      mode !== 'subscribe' ||
      typeof token !== 'string' ||
      typeof challenge !== 'string' ||
      this.config.verifyToken.length < 16
    ) {
      return null;
    }
    return equalDigest(token, this.config.verifyToken) ? challenge : null;
  }

  verifySignature(rawBody: Buffer | undefined, signature: string | undefined): boolean {
    if (
      !this.config.enabled ||
      !rawBody ||
      !signature ||
      !signature.startsWith('sha256=') ||
      this.config.appSecret.length < 16
    ) {
      return false;
    }
    const expected =
      'sha256=' + createHmac('sha256', this.config.appSecret).update(rawBody).digest('hex');
    return equalDigest(expected, signature);
  }

  summarize(payload: unknown): WhatsAppWebhookSummary {
    const root = asRecord(payload);
    const entries = asArray(root?.entry);
    let changeCount = 0;
    let messageCount = 0;
    let statusCount = 0;
    const messageTypes = new Set<string>();
    const phoneNumberIds = new Set<string>();

    for (const entry of entries) {
      const entryRecord = asRecord(entry);
      for (const change of asArray(entryRecord?.changes)) {
        changeCount += 1;
        const value = asRecord(asRecord(change)?.value);
        if (!value) continue;

        const metadata = asRecord(value.metadata);
        const phoneNumberId = metadata?.phone_number_id;
        if (typeof phoneNumberId === 'string' && phoneNumberId.length > 0) {
          phoneNumberIds.add(phoneNumberId);
        }

        const messages = asArray(value.messages);
        messageCount += messages.length;
        for (const message of messages) {
          const type = asRecord(message)?.type;
          if (typeof type === 'string' && type.length > 0) messageTypes.add(type);
        }

        statusCount += asArray(value.statuses).length;
      }
    }

    return {
      object: typeof root?.object === 'string' ? root.object : null,
      entryCount: entries.length,
      changeCount,
      messageCount,
      statusCount,
      messageTypes: [...messageTypes].sort(),
      phoneNumberIds: [...phoneNumberIds].sort(),
    };
  }
}
