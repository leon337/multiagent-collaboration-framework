import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import { WhatsAppCloudAdapter, WhatsAppCloudClient } from './whatsapp-cloud.adapter.js';

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function request(overrides: Partial<ExternalActionRequest['inputs']> = {}): ExternalActionRequest {
  return {
    skill: {
      skillId: 'MCF-WHATSAPP-COMMUNICATE',
      name: 'WhatsApp',
      version: '1.0.0',
      purpose: 'Send governed WhatsApp message',
      ownerAgents: ['Mestre'],
      requiredInputs: ['to', 'body', 'authorizedScope'],
      allowedTools: ['WhatsApp'],
      forbiddenTools: ['bulk-broadcast'],
      permissionProfile: 'SCOPED_WRITE',
      executionSteps: [],
      requiredEvidence: [],
      acceptanceCriteria: [],
      failureModes: [],
      fallback: 'ADB',
      handoffTo: 'Mestre',
    },
    agentId: 'Mestre',
    inputs: {
      authorizedScope: true,
      to: '+5581999999999',
      body: 'Mensagem de teste',
      ...overrides,
    },
    tool: {
      provider: 'whatsapp',
      operation: 'send-text',
      resource: 'whatsapp-cloud-api',
    },
    context: {
      missionId: 'mission-whatsapp',
      phaseId: 'phase-whatsapp',
      expectedMissionVersion: 1,
    },
  };
}

describe('WhatsAppCloudAdapter', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://rsa:rsa_test@127.0.0.1:5432/rsa';
    process.env.MCF_RECEIPT_SECRET = 'test-secret-that-is-long-enough-for-mcf-runtime';
  });

  it('sends text through the official Messages API and returns a signed receipt', async () => {
    const fetcher = vi.fn(async (input: string, init?: RequestInit) => {
      expect(input).toBe('https://graph.facebook.com/v26.0/123456789012345/messages');
      expect(init?.method).toBe('POST');
      expect(new Headers(init?.headers).get('authorization')).toBe(
        'Bearer token-value-long-enough',
      );
      expect(JSON.parse(String(init?.body))).toEqual({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '+5581999999999',
        type: 'text',
        text: { preview_url: false, body: 'Mensagem de teste' },
      });
      return response({
        messaging_product: 'whatsapp',
        contacts: [{ input: '+5581999999999', wa_id: '5581999999999' }],
        messages: [{ id: 'wamid.TEST123456789' }],
      });
    });

    const adapter = new WhatsAppCloudAdapter(
      new EvidenceValidator(),
      new WhatsAppCloudClient(
        {
          enabled: true,
          apiVersion: 'v26.0',
          phoneNumberId: '123456789012345',
          accessToken: 'token-value-long-enough',
        },
        fetcher,
      ),
    );

    const persisted: Record<string, unknown>[] = [];
    const receipt = await adapter.execute(request(), {
      persistReconciliationMetadata: async (metadata) => {
        persisted.push(metadata);
      },
    });

    expect(receipt.status).toBe('SUCCEEDED');
    expect(receipt.externalId).toBe('wamid.TEST123456789');
    expect(receipt.provider).toBe('whatsapp');
    expect(receipt.metadata).toMatchObject({
      adapterId: 'whatsapp-cloud-send-text-v1',
      acceptedByProvider: true,
      deliveryConfirmed: false,
      bodyLength: 17,
      providerWaIdPresent: true,
    });
    expect(receipt.metadata.recipientHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toMatchObject({
      provider: 'whatsapp',
      operation: 'send-text',
      bodyLength: 17,
      duplicateRiskOnUnknown: true,
    });
    expect(String(persisted[0]?.recipientHash)).toMatch(/^[a-f0-9]{64}$/u);
    expect(String(persisted[0]?.bodyDigest)).toMatch(/^[a-f0-9]{64}$/u);
  });

  it('rejects a destination outside E.164 before any provider call', async () => {
    const fetcher = vi.fn();
    const adapter = new WhatsAppCloudAdapter(
      new EvidenceValidator(),
      new WhatsAppCloudClient(
        {
          enabled: true,
          apiVersion: 'v26.0',
          phoneNumberId: '123456789012345',
          accessToken: 'token-value-long-enough',
        },
        fetcher,
      ),
    );

    await expect(
      adapter.execute(request({ to: '81999999999' }), {
        persistReconciliationMetadata: async () => {},
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_CONTEXT',
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('maps Meta authentication rejection to AUTHENTICATION_REQUIRED', async () => {
    const adapter = new WhatsAppCloudAdapter(
      new EvidenceValidator(),
      new WhatsAppCloudClient(
        {
          enabled: true,
          apiVersion: 'v26.0',
          phoneNumberId: '123456789012345',
          accessToken: 'token-value-long-enough',
        },
        async () => response({ error: { message: 'bad token' } }, 401),
      ),
    );

    await expect(
      adapter.execute(request(), {
        persistReconciliationMetadata: async () => {},
      }),
    ).rejects.toMatchObject({
      code: 'AUTHENTICATION_REQUIRED',
      statusCode: 401,
    });
  });

  it('returns a PARTIAL receipt for ambiguous network failure so the ledger can persist UNKNOWN', async () => {
    const adapter = new WhatsAppCloudAdapter(
      new EvidenceValidator(),
      new WhatsAppCloudClient(
        {
          enabled: true,
          apiVersion: 'v26.0',
          phoneNumberId: '123456789012345',
          accessToken: 'token-value-long-enough',
        },
        async () => {
          throw new Error('socket closed after request write');
        },
      ),
    );

    const persisted: Record<string, unknown>[] = [];
    const receipt = await adapter.execute(request(), {
      persistReconciliationMetadata: async (metadata) => {
        persisted.push(metadata);
      },
    });

    expect(receipt).toMatchObject({
      status: 'PARTIAL',
      externalId: null,
      metadata: {
        providerAcceptance: 'UNKNOWN',
        unknownExternalEffect: true,
        failureCode: 'EXTERNAL_EFFECT_UNKNOWN',
      },
    });
    expect(persisted).toHaveLength(1);
  });
});
