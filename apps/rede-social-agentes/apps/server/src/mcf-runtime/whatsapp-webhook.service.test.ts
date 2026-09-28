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
  it('extracts only valid inbound messages into normalized envelopes', () => {
    const service = new WhatsAppWebhookService(config);
    const messages = service.extractInboundMessages({
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
                    id: 'wamid.INBOUND123456',
                    from: '5581999999999',
                    timestamp: '1790597000',
                    type: 'text',
                    text: { body: '  Oi, Mestre  ' },
                    context: { id: 'wamid.PARENT123456' },
                  },
                  {
                    id: 'wamid.AUDIO1234567',
                    from: '5581888888888',
                    timestamp: '1790597001',
                    type: 'audio',
                    audio: { id: 'media-1' },
                  },
                  {
                    id: 'bad',
                    from: 'not-a-number',
                    type: 'text',
                    text: { body: 'ignored' },
                  },
                ],
                statuses: [{ id: 'wamid.STATUS', status: 'delivered' }],
              },
            },
          ],
        },
      ],
    });

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      messageId: 'wamid.INBOUND123456',
      phoneNumberId: '123456789012345',
      senderWaId: '5581999999999',
      messageType: 'text',
      textBody: 'Oi, Mestre',
      metadata: {
        webhookField: 'messages',
        contextMessageId: 'wamid.PARENT123456',
      },
    });
    expect(messages[0]?.providerTimestamp).toBeInstanceOf(Date);
    expect(messages[1]).toMatchObject({
      messageId: 'wamid.AUDIO1234567',
      senderWaId: '5581888888888',
      messageType: 'audio',
      textBody: null,
    });
  });
});
