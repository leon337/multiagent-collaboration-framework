import { createHash } from 'node:crypto';
import type { McfToolReceipt } from '@rsa/contracts';
import type { EvidenceValidator } from './evidence-validator.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';

export type GeminiReadOperation = 'read-status' | 'read-reply';
export interface GeminiReadEnvelope {
  mission_id: string;
  request_id: string;
  correlation_id: string;
  idempotency_key: string;
  policy_scope: 'approved-conversation';
  evidence_ref: string;
  operation: GeminiReadOperation;
}
/** Implementations must bind identity and conversation in private configuration, never agent input. */
export interface GeminiConversationReadTransport {
  read(envelope: GeminiReadEnvelope, signal: AbortSignal): Promise<unknown>;
}
const keys = [
  'mission_id',
  'request_id',
  'correlation_id',
  'idempotency_key',
  'policy_scope',
  'evidence_ref',
] as const;
const identifier = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/u;
const fail = (
  code:
    | 'INVALID_CONTEXT'
    | 'INVALID_RESPONSE'
    | 'UNSUPPORTED_TARGET'
    | 'ADAPTER_TIMEOUT'
    | 'NETWORK_FAILURE'
    | 'RESERVATION_CONFLICT',
): never => {
  throw new ExternalActionAdapterError(code, 'Gemini conversation read rejected', false);
};
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export class GeminiConversationReadAdapter implements ExternalActionAdapter {
  readonly adapterId = 'mcf-gemini-conversation-read-v1';
  private readonly usedKeys = new Map<string, string>();
  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly enabled: boolean,
    private readonly transport?: GeminiConversationReadTransport,
    private readonly timeoutMs = 10_000,
  ) {}
  supports(request: ExternalActionRequest): boolean {
    return (
      request.skill.skillId === 'MCF-GEMINI-CONVERSATION-READ' &&
      canonicalizeProvider(request.tool.provider) === 'mcf-gemini-conversation' &&
      canonicalizeToolValue(request.tool.resource) === 'approved-conversation' &&
      ['read-status', 'read-reply'].includes(canonicalizeToolValue(request.tool.operation))
    );
  }
  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    if (!this.supports(request) || !this.enabled || !this.transport)
      return fail('UNSUPPORTED_TARGET');
    if (
      request.agentId !== 'Mestre' ||
      request.skill.permissionProfile !== 'READ_ONLY' ||
      Object.keys(request.inputs).length !== keys.length ||
      keys.some((k) => !Object.hasOwn(request.inputs, k))
    )
      return fail('INVALID_CONTEXT');
    const inputs = request.inputs;
    if (
      keys.some((k) => typeof inputs[k] !== 'string' || !identifier.test(inputs[k] as string)) ||
      inputs.policy_scope !== 'approved-conversation' ||
      !request.context ||
      request.context.missionId !== inputs.mission_id
    )
      return fail('INVALID_CONTEXT');
    const envelope: GeminiReadEnvelope = {
      mission_id: inputs.mission_id as string,
      request_id: inputs.request_id as string,
      correlation_id: inputs.correlation_id as string,
      idempotency_key: inputs.idempotency_key as string,
      policy_scope: 'approved-conversation',
      evidence_ref: inputs.evidence_ref as string,
      operation: canonicalizeToolValue(request.tool.operation) as GeminiReadOperation,
    };
    // Process-local replay guard; durable cross-process idempotency requires a future broker/ledger contract.
    const key = `${envelope.mission_id}:${envelope.idempotency_key}`;
    const requestDigest = createHash('sha256').update(JSON.stringify(envelope)).digest('hex');
    const knownDigest = this.usedKeys.get(key);
    // Repeating the same READ is safe and required for pending-reply reconciliation.
    // A reused key with different parameters is not the same logical request.
    if (
      (knownDigest && knownDigest !== requestDigest) ||
      (!knownDigest && this.usedKeys.size >= 10_000)
    )
      return fail('RESERVATION_CONFLICT');
    if (!knownDigest) this.usedKeys.set(key, requestDigest);
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let result: unknown;
    try {
      result = await Promise.race([
        this.transport.read(envelope, controller.signal),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error('timeout'));
          }, this.timeoutMs);
        }),
      ]);
    } catch {
      if (controller.signal.aborted) return fail('ADAPTER_TIMEOUT');
      return fail('NETWORK_FAILURE');
    } finally {
      if (timer) clearTimeout(timer);
    }
    if (
      !record(result) ||
      result.identity_verified !== true ||
      result.conversation_verified !== true ||
      result.mission_id !== envelope.mission_id ||
      result.request_id !== envelope.request_id ||
      result.correlation_id !== envelope.correlation_id ||
      result.idempotency_key !== envelope.idempotency_key ||
      result.operation !== envelope.operation ||
      (result.status !== 'complete' &&
        !(envelope.operation === 'read-status' && result.status === 'pending')) ||
      (envelope.operation === 'read-reply' &&
        (typeof result.reply !== 'string' ||
          result.reply.length === 0 ||
          result.reply.length > 65536))
    )
      return fail('INVALID_RESPONSE');
    const replyHash =
      envelope.operation === 'read-reply'
        ? createHash('sha256')
            .update(result.reply as string)
            .digest('hex')
        : null;
    return this.evidence.createTrustedReceipt({
      provider: 'mcf-gemini-conversation',
      operation: envelope.operation,
      resource: 'approved-conversation',
      externalId: createHash('sha256').update(envelope.request_id).digest('hex'),
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: {
        adapterId: this.adapterId,
        readOnly: true,
        status: result.status as string,
        replySha256: replyHash,
        correlationSha256: createHash('sha256').update(envelope.correlation_id).digest('hex'),
        evidenceRefSha256: createHash('sha256').update(envelope.evidence_ref).digest('hex'),
      },
    });
  }
}
