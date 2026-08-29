import { createHmac, randomBytes, randomUUID } from 'node:crypto';

export type HumanAuthorityBootstrapTarget = 'STAGING';
export type HumanAuthorityBootstrapState =
  'PENDING' | 'APPLYING' | 'VERIFYING' | 'BOUND' | 'CONFLICT' | 'FAILED';

export interface HumanAuthorityBootstrapIntentRecord {
  intentRef: string;
  target: HumanAuthorityBootstrapTarget;
  state: HumanAuthorityBootstrapState;
  subjectFingerprint: string;
  sealedBinding: string;
  expiresAt: Date;
  createdAt: Date;
  claimRef?: string | null;
  claimExpiresAt?: Date | null;
}

export interface HumanAuthorityBootstrapRepository {
  reserveIntent(
    candidate: HumanAuthorityBootstrapIntentRecord,
    now: Date,
  ): Promise<{
    status: 'CREATED' | 'REUSED' | 'CONFLICT';
    intent: HumanAuthorityBootstrapIntentRecord;
  }>;
  claimIntent?(input: {
    intentRef: string;
    claimRef: string;
    principalFingerprint: string;
    claimExpiresAt: Date;
    now: Date;
  }): Promise<HumanAuthorityBootstrapIntentRecord | null>;
  markVerifying?(input: {
    intentRef: string;
    claimRef: string;
    providerMutationDigest: string;
    now: Date;
  }): Promise<boolean>;
  finalizeIntent?(input: {
    intentRef: string;
    claimRef: string;
    outcome: 'BOUND' | 'CONFLICT' | 'FAILED';
    receiptDigest: string;
    now: Date;
  }): Promise<boolean>;
}

export class HumanAuthorityBootstrapConflictError extends Error {
  constructor() {
    super('A different authenticated human already owns the active authority-binding intent.');
  }
}

function publicIntent(intent: HumanAuthorityBootstrapIntentRecord) {
  return {
    intentRef: intent.intentRef,
    target: intent.target,
    state: intent.state,
    createdAt: intent.createdAt.toISOString(),
    expiresAt: intent.expiresAt.toISOString(),
    humanApprovalRequired: true as const,
    identityDisclosed: false as const,
  };
}

export class HumanAuthorityBootstrapService {
  constructor(
    private readonly repository: HumanAuthorityBootstrapRepository,
    private readonly seal: (input: Record<string, unknown>) => Promise<string>,
    private readonly subjectPepper: string,
    private readonly intentTtlMs: number,
    private readonly claimLeaseMs = 300_000,
  ) {}

  private fingerprint(accountId: string): string {
    return createHmac('sha256', this.subjectPepper).update(accountId).digest('hex');
  }

  async createIntent(
    authenticatedHuman: { accountId: string },
    request: { target: HumanAuthorityBootstrapTarget },
    now = new Date(),
  ) {
    const subjectFingerprint = this.fingerprint(authenticatedHuman.accountId);
    const intentRef = randomUUID();
    const expiresAt = new Date(now.getTime() + this.intentTtlMs);
    const nonce = randomBytes(32).toString('base64url');
    const sealedBinding = await this.seal({
      intentRef,
      target: request.target,
      accountId: authenticatedHuman.accountId,
      nonce,
      issuedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    const reserved = await this.repository.reserveIntent(
      {
        intentRef,
        target: request.target,
        state: 'PENDING',
        subjectFingerprint,
        sealedBinding,
        expiresAt,
        createdAt: now,
      },
      now,
    );
    if (reserved.status === 'CONFLICT') {
      throw new HumanAuthorityBootstrapConflictError();
    }
    return publicIntent(reserved.intent);
  }

  async claimIntent(intentRef: string, principalFingerprint: string, now = new Date()) {
    if (!this.repository.claimIntent) throw new Error('Bootstrap repository cannot claim intents.');
    const claimRef = randomUUID();
    const claimed = await this.repository.claimIntent({
      intentRef,
      claimRef,
      principalFingerprint,
      claimExpiresAt: new Date(now.getTime() + this.claimLeaseMs),
      now,
    });
    if (!claimed?.claimRef || !claimed.claimExpiresAt) {
      throw new Error('Authority-binding intent is not claimable.');
    }
    return {
      intentRef: claimed.intentRef,
      target: claimed.target,
      state: claimed.state,
      sealedBinding: claimed.sealedBinding,
      claimRef: claimed.claimRef,
      claimExpiresAt: claimed.claimExpiresAt.toISOString(),
      expiresAt: claimed.expiresAt.toISOString(),
      identityDisclosed: false as const,
    };
  }

  async markVerifying(
    intentRef: string,
    claimRef: string,
    providerMutationDigest: string,
    now = new Date(),
  ): Promise<void> {
    if (!this.repository.markVerifying)
      throw new Error('Bootstrap repository cannot verify intents.');
    const updated = await this.repository.markVerifying({
      intentRef,
      claimRef,
      providerMutationDigest,
      now,
    });
    if (!updated) throw new Error('Authority-binding claim is stale or not applying.');
  }

  async finalizeIntent(
    intentRef: string,
    claimRef: string,
    outcome: 'BOUND' | 'CONFLICT' | 'FAILED',
    receiptDigest: string,
    now = new Date(),
  ): Promise<void> {
    if (!this.repository.finalizeIntent)
      throw new Error('Bootstrap repository cannot finalize intents.');
    const updated = await this.repository.finalizeIntent({
      intentRef,
      claimRef,
      outcome,
      receiptDigest,
      now,
    });
    if (!updated) throw new Error('Authority-binding claim is stale or not finalizable.');
  }
}
