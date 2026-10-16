import { createHash } from 'node:crypto';

import type { McfToolReceipt } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionMutationBoundary,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface WhatsAppCloudConfig {
  enabled: boolean;
  apiVersion: string;
  phoneNumberId: string;
  accessToken: string;
}

interface WhatsAppSendResponse {
  messaging_product?: string;
  contacts?: Array<{ input?: string; wa_id?: string }>;
  messages?: Array<{ id?: string }>;
}

const E164 = /^\+[1-9]\d{7,14}$/u;
const PHONE_NUMBER_ID = /^\d{5,32}$/u;
const API_VERSION = /^v\d+\.\d+$/u;
const MAX_TEXT_LENGTH = 4096;

function requiredString(inputs: Record<string, unknown>, key: string, maxLength: number): string {
  const value = inputs[key];
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim() ||
    value.length > maxLength
  ) {
    throw new ExternalActionAdapterError(
      'INVALID_CONTEXT',
      key + ' must be a non-empty trimmed string within ' + maxLength + ' characters',
      false,
    );
  }
  return value;
}

function recipientHash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export class WhatsAppCloudClient {
  constructor(
    private readonly config: WhatsAppCloudConfig,
    private readonly fetcher: FetchLike = globalThis.fetch,
  ) {}

  async sendText(to: string, body: string): Promise<{ messageId: string; waId: string | null }> {
    if (!this.config.enabled) {
      throw new ExternalActionAdapterError(
        'AUTHENTICATION_REQUIRED',
        'WhatsApp Cloud API adapter is disabled',
        false,
        503,
      );
    }
    if (
      !API_VERSION.test(this.config.apiVersion) ||
      !PHONE_NUMBER_ID.test(this.config.phoneNumberId) ||
      this.config.accessToken.trim().length < 20
    ) {
      throw new ExternalActionAdapterError(
        'AUTHENTICATION_REQUIRED',
        'WhatsApp Cloud API configuration is incomplete',
        false,
        503,
      );
    }

    let response: Response;
    try {
      response = await this.fetcher(
        'https://graph.facebook.com/' +
          this.config.apiVersion +
          '/' +
          this.config.phoneNumberId +
          '/messages',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + this.config.accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: {
              preview_url: false,
              body,
            },
          }),
        },
      );
    } catch (error) {
      throw new ExternalActionAdapterError(
        'EXTERNAL_EFFECT_UNKNOWN',
        error instanceof Error
          ? 'WhatsApp Cloud API write outcome is unknown: ' + error.message
          : 'WhatsApp Cloud API write outcome is unknown after a network failure',
        false,
      );
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new ExternalActionAdapterError(
          'AUTHENTICATION_REQUIRED',
          'WhatsApp Cloud API authentication or permission is required',
          false,
          response.status,
        );
      }
      if (response.status === 429) {
        throw new ExternalActionAdapterError(
          'RATE_LIMITED',
          'WhatsApp Cloud API rate limit was reached',
          true,
          response.status,
        );
      }
      if (response.status >= 500) {
        throw new ExternalActionAdapterError(
          'EXTERNAL_EFFECT_UNKNOWN',
          'WhatsApp Cloud API returned HTTP ' + response.status + ' after write submission',
          false,
          response.status,
        );
      }
      throw new ExternalActionAdapterError(
        'INVALID_RESPONSE',
        'WhatsApp Cloud API returned HTTP ' + response.status,
        false,
        response.status,
      );
    }

    let payload: WhatsAppSendResponse;
    try {
      payload = (await response.json()) as WhatsAppSendResponse;
    } catch {
      throw new ExternalActionAdapterError(
        'EXTERNAL_EFFECT_UNKNOWN',
        'WhatsApp Cloud API accepted the request but returned invalid JSON',
        false,
        response.status,
      );
    }

    const messageId = payload.messages?.[0]?.id;
    if (
      payload.messaging_product !== 'whatsapp' ||
      typeof messageId !== 'string' ||
      messageId.length < 8
    ) {
      throw new ExternalActionAdapterError(
        'EXTERNAL_EFFECT_UNKNOWN',
        'WhatsApp Cloud API response did not include an accepted message identifier',
        false,
        response.status,
      );
    }

    const waId = payload.contacts?.[0]?.wa_id;
    return {
      messageId,
      waId: typeof waId === 'string' && waId.length > 0 ? waId : null,
    };
  }
}

export class WhatsAppCloudAdapter implements ExternalActionAdapter {
  readonly adapterId = 'whatsapp-cloud-send-text-v1';

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly client: WhatsAppCloudClient,
  ) {}

  supports(request: ExternalActionRequest): boolean {
    return (
      request.skill.skillId === 'MCF-WHATSAPP-COMMUNICATE' &&
      canonicalizeProvider(request.tool.provider) === 'whatsapp' &&
      canonicalizeToolValue(request.tool.operation) === 'send-text' &&
      canonicalizeToolValue(request.tool.resource) === 'whatsapp-cloud-api'
    );
  }

  async execute(
    request: ExternalActionRequest,
    mutationBoundary?: ExternalActionMutationBoundary,
  ): Promise<McfToolReceipt> {
    if (!request.context) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'WhatsApp send requires governed mission and phase context',
        false,
      );
    }

    const to = requiredString(request.inputs, 'to', 16);
    if (!E164.test(to)) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'WhatsApp destination must use E.164 format including the leading plus sign',
        false,
      );
    }
    const body = requiredString(request.inputs, 'body', MAX_TEXT_LENGTH);
    if (!mutationBoundary) {
      throw new ExternalActionAdapterError(
        'LEDGER_FAILURE',
        'WhatsApp provider mutation requires a durable reconciliation boundary',
        false,
      );
    }

    const hashedRecipient = recipientHash(to);
    const bodyDigest = createHash('sha256').update(body).digest('hex');
    await mutationBoundary.persistReconciliationMetadata({
      provider: 'whatsapp',
      operation: 'send-text',
      resource: request.tool.resource,
      recipientHash: hashedRecipient,
      bodyDigest,
      bodyLength: body.length,
      reconciliationEligible: false,
      duplicateRiskOnUnknown: true,
    });

    try {
      const result = await this.client.sendText(to, body);
      return this.evidence.createTrustedReceipt({
        provider: 'whatsapp',
        operation: 'send-text',
        resource: request.tool.resource,
        externalId: result.messageId,
        commitSha: null,
        status: 'SUCCEEDED',
        observedAt: new Date().toISOString(),
        metadata: {
          adapterId: this.adapterId,
          messagingProduct: 'whatsapp',
          messageId: result.messageId,
          recipientHash: hashedRecipient,
          bodyDigest,
          providerWaIdPresent: result.waId !== null,
          bodyLength: body.length,
          acceptedByProvider: true,
          deliveryConfirmed: false,
        },
      });
    } catch (error) {
      if (error instanceof ExternalActionAdapterError && error.code === 'EXTERNAL_EFFECT_UNKNOWN') {
        return this.evidence.createTrustedReceipt({
          provider: 'whatsapp',
          operation: 'send-text',
          resource: request.tool.resource,
          externalId: null,
          commitSha: null,
          status: 'PARTIAL',
          observedAt: new Date().toISOString(),
          metadata: {
            adapterId: this.adapterId,
            messagingProduct: 'whatsapp',
            recipientHash: hashedRecipient,
            bodyDigest,
            bodyLength: body.length,
            providerAcceptance: 'UNKNOWN',
            deliveryConfirmed: false,
            unknownExternalEffect: true,
            failureCode: error.code,
          },
        });
      }
      throw error;
    }
  }
}
