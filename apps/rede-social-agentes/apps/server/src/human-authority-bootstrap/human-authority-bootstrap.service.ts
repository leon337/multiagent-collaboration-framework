import { createHmac, randomBytes, randomUUID } from 'node:crypto';

export type HumanAuthorityBootstrapTarget = 'STAGING';
export type HumanAuthorityBootstrapState =
  | 'PENDING'
  | 'APPLYING'
  | 'PROVIDER_APPLIED'
  | 'VERIFYING'
  | 'RUNTIME_VERIFIED'
  | 'RECONCILIATION_REQUIRED'
  | 'BOUND'
  | 'CONFLICT'
  | 'FAILED';

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
  markProviderApplied?(input: {
    intentRef: string;
    claimRef: string;
    providerMutationDigest: string;
    now: Date;
  }): Promise<boolean>;
  markReconciliationRequired?(input: {
    intentRef: string;
    claimRef: string;
    reconciliationDigest: string;
    reason: 'PROVIDER_ATOMIC_CREATE_UNAVAILABLE' | 'PROVIDER_STATE_DRIFT';
    now: Date;
  }): Promise<boolean>;
  markVerifying?(input: { intentRef: string; claimRef: string; now: Date }): Promise<boolean>;
  markRuntimeVerified?(input: {
    intentRef: string;
    claimRef: string;
    runtimeEvidenceDigest: string;
    now: Date;
  }): Promise<boolean>;
  finalizeIntent?(input: {
    intentRef: string;
    claimRef: string;
    outcome: 'CONFLICT' | 'FAILED';
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
    const sealedBinding = await this.seal({
      intentRef,
      target: request.target,
      accountId: authenticatedHuman.accountId,
      nonce: randomBytes(32).toString('base64url'),
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
    if (reserved.status === 'CONFLICT') throw new HumanAuthorityBootstrapConflictError();
    return publicIntent(reserved.intent);
  }

  async claimIntent(intentRef: string, principalFingerprint: string, now = new Date()) {
    if (!this.repository.claimIntent) throw new Error('Bootstrap repository cannot claim intents.');
    const claimed = await this.repository.claimIntent({
      intentRef,
      claimRef: randomUUID(),
      principalFingerprint,
      claimExpiresAt: new Date(now.getTime() + this.claimLeaseMs),
      now,
    });
    if (!claimed?.claimRef || !claimed.claimExpiresAt)
      throw new Error('Authority-binding intent is not claimable.');
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

  async markProviderApplied(
    intentRef: string,
    claimRef: string,
    providerMutationDigest: string,
    now = new Date(),
  ): Promise<void> {
    if (!this.repository.markProviderApplied)
      throw new Error('Bootstrap repository cannot record provider application.');
    if (
      !(await this.repository.markProviderApplied({
        intentRef,
        claimRef,
        providerMutationDigest,
        now,
      }))
    )
      throw new Error('Authority-binding claim is stale or not applying.');
  }

  async markReconciliationRequired(
    intentRef: string,
    claimRef: string,
    reconciliationDigest: string,
    reason: 'PROVIDER_ATOMIC_CREATE_UNAVAILABLE' | 'PROVIDER_STATE_DRIFT',
    now = new Date(),
  ): Promise<void> {
    if (!this.repository.markReconciliationRequired)
      throw new Error('Bootstrap repository cannot record reconciliation.');
    if (
      !(await this.repository.markReconciliationRequired({
        intentRef,
        claimRef,
        reconciliationDigest,
        reason,
        now,
      }))
    )
      throw new Error('Authority-binding claim is stale or not reconcilable.');
  }

  async markVerifying(intentRef: string, claimRef: string, now = new Date()): Promise<void> {
    if (!this.repository.markVerifying)
      throw new Error('Bootstrap repository cannot verify intents.');
    if (!(await this.repository.markVerifying({ intentRef, claimRef, now })))
      throw new Error('Authority-binding claim is stale or provider application is unproven.');
  }

  async markRuntimeVerified(
    intentRef: string,
    claimRef: string,
    runtimeEvidenceDigest: string,
    now = new Date(),
  ): Promise<void> {
    if (!this.repository.markRuntimeVerified)
      throw new Error('Bootstrap repository cannot record runtime verification.');
    if (
      !(await this.repository.markRuntimeVerified({
        intentRef,
        claimRef,
        runtimeEvidenceDigest,
        now,
      }))
    )
      throw new Error(
        'Authority-binding claim is stale or runtime verification is out of sequence.',
      );
  }

  async finalizeIntent(
    intentRef: string,
    claimRef: string,
    outcome: 'CONFLICT' | 'FAILED',
    receiptDigest: string,
    now = new Date(),
  ): Promise<void> {
    if (!this.repository.finalizeIntent)
      throw new Error('Bootstrap repository cannot finalize intents.');
    if (
      !(await this.repository.finalizeIntent({ intentRef, claimRef, outcome, receiptDigest, now }))
    )
      throw new Error('Authority-binding claim is stale or not finalizable.');
  }
}
