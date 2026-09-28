import { createHmac } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { WhatsAppWebhookService } from './whatsapp-webhook.service.js';

const config = {
  enabled: true,
  verifyToken: 'verify-token-long-enough',
  appSecret: 'app-secret-long-enough',
};

describe('WhatsAppWebhookService', () => {
  it('accepts only the configured Meta verification token', () => {
    const service = new WhatsAppWebhookService(config);
    expect(service.verifyChallenge('subscribe', config.verifyToken, '12345')).toBe('12345');
    expect(service.verifyChallenge('subscribe', 'wrong-token', '12345')).toBeNull();
    expect(service.verifyChallenge('wrong-mode', config.verifyToken, '12345')).toBeNull();
  });

  it('validates X-Hub-Signature-256 against the exact raw body', () => {
    const service = new WhatsAppWebhookService(config);
    const raw = Buffer.from('{"object":"whatsapp_business_account"}', 'utf8');
    const signature = 'sha256=' + createHmac('sha256', config.appSecret).update(raw).digest('hex');

    expect(service.verifySignature(raw, signature)).toBe(true);
    expect(service.verifySignature(Buffer.from('{}'), signature)).toBe(false);
  });

  it('summarizes message and delivery events without logging message bodies', () => {
    const service = new WhatsAppWebhookService(config);
    const summary = service.summarize({
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: '123456789012345' },
                messages: [
                  { id: 'wamid.1', type: 'text', text: { body: 'private text' } },
                  { id: 'wamid.2', type: 'audio' },
                ],
                statuses: [{ id: 'wamid.0', status: 'delivered' }],
              },
            },
          ],
        },
      ],
    });

    expect(summary).toEqual({
      object: 'whatsapp_business_account',
      entryCount: 1,
      changeCount: 1,
      messageCount: 2,
      statusCount: 1,
      messageTypes: ['audio', 'text'],
      phoneNumberIds: ['123456789012345'],
    });
    expect(JSON.stringify(summary)).not.toContain('private text');
  });
});
