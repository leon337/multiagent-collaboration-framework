import { createHash } from 'node:crypto';

const key = 'RESERVED_HUMAN_AUTHORITY_ACCOUNT_ID';

export type RenderBindingOutcome =
  | { outcome: 'ALREADY_BOUND'; mutated: false; providerMutationDigest: string }
  | { outcome: 'CONFLICT'; mutated: false; providerMutationDigest: string }
  | {
      outcome: 'RECONCILIATION_REQUIRED';
      mutated: false;
      reason: 'PROVIDER_ATOMIC_CREATE_UNAVAILABLE';
      providerMutationDigest: string;
    };

function digest(value: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export class RenderAuthorityBindingClient {
  constructor(
    private readonly fetchImpl: typeof fetch,
    private readonly serviceId: string,
    private readonly apiKey: string,
  ) {}

  private endpoint(): string {
    return `https://api.render.com/v1/services/${encodeURIComponent(this.serviceId)}/env-vars/${key}`;
  }

  private async get(): Promise<{ status: 'ABSENT' } | { status: 'PRESENT'; value: string }> {
    const response = await this.fetchImpl(this.endpoint(), {
      method: 'GET',
      headers: { authorization: `Bearer ${this.apiKey}`, accept: 'application/json' },
    });
    if (response.status === 404) return { status: 'ABSENT' };
    if (!response.ok)
      throw new Error(`Render environment read failed with HTTP ${response.status}.`);
    const body = (await response.json()) as { key?: unknown; value?: unknown };
    if (body.key !== key || typeof body.value !== 'string') {
      throw new Error('Render environment response did not match the reserved binding contract.');
    }
    return { status: 'PRESENT', value: body.value };
  }

  async reconcile(accountId: string): Promise<RenderBindingOutcome> {
    const current = await this.get();
    if (current.status === 'PRESENT') {
      const matches = current.value === accountId;
      return {
        outcome: matches ? 'ALREADY_BOUND' : 'CONFLICT',
        mutated: false,
        providerMutationDigest: digest({
          provider: 'render',
          key,
          result: matches ? 'ALREADY_BOUND' : 'CONFLICT',
        }),
      } as RenderBindingOutcome;
    }

    return {
      outcome: 'RECONCILIATION_REQUIRED',
      mutated: false,
      reason: 'PROVIDER_ATOMIC_CREATE_UNAVAILABLE',
      providerMutationDigest: digest({
        provider: 'render',
        key,
        result: 'ABSENT_AT_READ_NO_ATOMIC_CREATE',
      }),
    };
  }
}
