import type { McfToolReceipt } from '@rsa/contracts';

import type { EvidenceValidator } from './evidence-validator.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import { parseChatGptShareDocument, validateChatGptShareUrl } from './chatgpt-share-recovery.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const CHATGPT_SHARE_FETCH_TIMEOUT_MS = 20_000;
export const CHATGPT_SHARE_MAX_HTML_BYTES = 5 * 1024 * 1024;

function adapterError(
  code: ConstructorParameters<typeof ExternalActionAdapterError>[0],
  message: string,
  retryable = false,
  statusCode: number | null = null,
): never {
  throw new ExternalActionAdapterError(code, message, retryable, statusCode);
}

async function readBoundedHtml(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > CHATGPT_SHARE_MAX_HTML_BYTES) {
    return adapterError('INVALID_RESPONSE', 'ChatGPT share HTML exceeds the configured size limit');
  }
  if (!response.body) {
    return adapterError('INVALID_RESPONSE', 'ChatGPT share response has no body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let html = '';
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > CHATGPT_SHARE_MAX_HTML_BYTES) {
      await reader.cancel();
      return adapterError(
        'INVALID_RESPONSE',
        'ChatGPT share HTML exceeds the configured size limit',
      );
    }
    html += decoder.decode(chunk.value, { stream: true });
  }
  html += decoder.decode();
  return html;
}

export class ChatGptShareReadClient {
  constructor(private readonly fetcher: FetchLike = globalThis.fetch) {}

  async fetchDocument(sourceUrl: string): Promise<string> {
    const { canonicalUrl } = validateChatGptShareUrl(sourceUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CHATGPT_SHARE_FETCH_TIMEOUT_MS);
    try {
      let response: Response;
      try {
        response = await this.fetcher(canonicalUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'User-Agent': 'mcf-chatgpt-share-recovery/1.0',
          },
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return adapterError('ADAPTER_TIMEOUT', 'ChatGPT share fetch exceeded its deadline', true);
        }
        return adapterError(
          'NETWORK_FAILURE',
          error instanceof Error ? error.message : 'ChatGPT share fetch failed',
          true,
        );
      }

      if (response.status === 404 || response.status === 410) {
        return adapterError(
          'TARGET_NOT_FOUND',
          'ChatGPT share was not found',
          false,
          response.status,
        );
      }
      if (response.status === 429) {
        return adapterError(
          'RATE_LIMITED',
          'ChatGPT share endpoint rate limited the request',
          true,
          429,
        );
      }
      if (response.status === 401 || response.status === 403) {
        return adapterError(
          'AUTHENTICATION_REQUIRED',
          'ChatGPT share is not publicly readable',
          false,
          response.status,
        );
      }
      if (!response.ok || response.status >= 300) {
        return adapterError(
          'INVALID_RESPONSE',
          `ChatGPT share endpoint returned HTTP ${response.status}`,
          response.status >= 500,
          response.status,
        );
      }
      const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        return adapterError('INVALID_RESPONSE', 'ChatGPT share endpoint did not return HTML');
      }
      return await readBoundedHtml(response);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function requireShareUrl(request: ExternalActionRequest): string {
  const value = request.inputs.share_url;
  if (typeof value !== 'string' || value.trim().length === 0) {
    return adapterError('INVALID_CONTEXT', 'MCF-RECOVER-CHATGPT-SHARE requires share_url');
  }
  return validateChatGptShareUrl(value).canonicalUrl;
}

function receiptDomain(request: ExternalActionRequest): Record<string, unknown> {
  const context = request.context;
  if (!context) {
    return adapterError(
      'INVALID_CONTEXT',
      'ChatGPT share recovery requires governed mission context',
    );
  }
  if (
    !context.missionId.trim() ||
    !context.phaseId.trim() ||
    !Number.isInteger(context.expectedMissionVersion) ||
    context.expectedMissionVersion < 1
  ) {
    return adapterError(
      'INVALID_CONTEXT',
      'ChatGPT share recovery received invalid mission context',
    );
  }
  return {
    skill_id: request.skill.skillId,
    skill_version: request.skill.version,
    agent_id: request.agentId,
    mission_id: context.missionId,
    phase_id: context.phaseId,
    expected_mission_version: context.expectedMissionVersion,
  };
}

export class ChatGptShareRecoveryAdapter implements ExternalActionAdapter {
  readonly adapterId = 'chatgpt-share-recovery-read-only-v1';

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly client: ChatGptShareReadClient = new ChatGptShareReadClient(),
  ) {}

  supports(request: ExternalActionRequest): boolean {
    return (
      request.skill.skillId === 'MCF-RECOVER-CHATGPT-SHARE' &&
      canonicalizeProvider(request.tool.provider) === 'chatgpt-share' &&
      canonicalizeToolValue(request.tool.operation) === 'fetch-share'
    );
  }

  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    const sourceUrl = requireShareUrl(request);
    const domain = receiptDomain(request);
    const html = await this.client.fetchDocument(sourceUrl);
    const recovered = parseChatGptShareDocument(html, sourceUrl);
    const metadata: Record<string, unknown> = {
      source_url: recovered.sourceUrl,
      share_id: recovered.shareId,
      title: recovered.title,
      model: recovered.model,
      current_node: recovered.currentNode,
      is_public: recovered.isPublic,
      is_read_only: recovered.isReadOnly,
      node_count: recovered.nodeCount,
      text_node_count: recovered.textNodeCount,
      technical_node_count: recovered.technicalNodeCount,
      messages: recovered.messages,
      parser_version: recovered.parserVersion,
      warnings: recovered.warnings,
      content_trust: 'UNTRUSTED_REMOTE_CONTENT',
      receipt_domain: domain,
    };

    return this.evidence.createTrustedReceipt({
      provider: 'chatgpt-share',
      operation: 'fetch-share',
      resource: 'public-chatgpt-share',
      externalId: recovered.shareId,
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata,
    });
  }
}
