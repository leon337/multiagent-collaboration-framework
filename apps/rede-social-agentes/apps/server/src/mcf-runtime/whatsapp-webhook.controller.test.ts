import { createHmac } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import type { WhatsAppInboxRepository } from './whatsapp-inbox.repository.js';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller.js';
import { WhatsAppWebhookService } from './whatsapp-webhook.service.js';

const config = {
  enabled: true,
  verifyToken: 'verify-token-long-enough',
  appSecret: 'app-secret-long-enough',
};

function payload() {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            field: 'messages',
            value: {
              metadata: { phone_number_id: '123456789012345' },
              messages: [
                {
                  id: 'wamid.CONTROLLER123456',
                  from: '5581999999999',
                  timestamp: '1790597000',
                  type: 'text',
                  text: { body: 'mensagem privada' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe('WhatsAppWebhookController', () => {
  it('persists normalized inbound messages only after signature validation', async () => {
    const body = payload();
    const rawBody = Buffer.from(JSON.stringify(body), 'utf8');
    const signature =
      'sha256=' + createHmac('sha256', config.appSecret).update(rawBody).digest('hex');
    const persist = vi.fn(async (messages: unknown[]) => {
      void messages;
      return { inserted: 1, duplicates: 0 };
    });
    const inbox = { persist } as unknown as WhatsAppInboxRepository;
    const controller = new WhatsAppWebhookController(new WhatsAppWebhookService(config), inbox);

    await expect(controller.receive({ rawBody, body, id: 'corr-1' }, signature)).resolves.toEqual({
      received: true,
    });

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist.mock.calls[0]?.[0]).toEqual([
      expect.objectContaining({
        messageId: 'wamid.CONTROLLER123456',
        senderWaId: '5581999999999',
        textBody: 'mensagem privada',
      }),
    ]);
  });

  it('rejects an invalid signature before touching the inbox', async () => {
    const body = payload();
    const rawBody = Buffer.from(JSON.stringify(body), 'utf8');
    const persist = vi.fn();
    const inbox = { persist } as unknown as WhatsAppInboxRepository;
    const controller = new WhatsAppWebhookController(new WhatsAppWebhookService(config), inbox);

    await expect(
      controller.receive({ rawBody, body, id: 'corr-2' }, 'sha256=' + '0'.repeat(64)),
    ).rejects.toMatchObject({ status: 403 });
    expect(persist).not.toHaveBeenCalled();
  });
});
