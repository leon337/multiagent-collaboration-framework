import { createHash, randomUUID } from 'node:crypto';

export type McfContinuationState =
  'DISCOVERING' | 'BLOCKED_EXTERNAL' | 'WAITING_CANONICAL_GATE' | 'SUPERSEDED' | 'CANCELLED';

export interface McfMissionContinuation {
  id: string;
  dedupeKey: string;
  kind: 'RELEASE_OBSERVATION';
  goal: string;
  releaseSha: string;
  targetBindingId: string;
  state: McfContinuationState;
  version: number;
  progressFingerprint: string | null;
  blockers: string[];
  evidenceDigest: string | null;
  notificationCount: number;
  gateRequestCount: 0;
  observedAt: Date | null;
  changedAt: Date;
  createdAt: Date;
}

export interface CreateReadOnlyContinuation {
  id: string;
  dedupeKey: string;
  goal: string;
  releaseSha: string;
  targetBindingId: string;
}

export interface PersistReadOnlyObservation {
  id: string;
  state: Extract<McfContinuationState, 'BLOCKED_EXTERNAL' | 'WAITING_CANONICAL_GATE'>;
  progressFingerprint: string;
  blockers: readonly string[];
  evidenceDigest: string;
}

export interface McfMissionContinuationStore {
  register(input: CreateReadOnlyContinuation): Promise<McfMissionContinuation>;
  find(id: string): Promise<McfMissionContinuation | null>;
  observe(input: PersistReadOnlyObservation): Promise<McfMissionContinuation | null>;
}

export class McfContinuationInputError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'McfContinuationInputError';
  }
}

function sha256(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/** Restricted observer: not an authorization source or producer of production gates. */
export class MissionContinuationService {
  constructor(private readonly store: McfMissionContinuationStore) {}

  async register(input: { goal: string; releaseSha: string; targetBindingId: string }) {
    const { goal, releaseSha, targetBindingId } = input;
    if (typeof goal !== 'string' || goal.length < 15 || goal.length > 500) {
      throw new McfContinuationInputError('INVALID_GOAL');
    }
    if (typeof releaseSha !== 'string' || !/^[a-f0-9]{40}$/u.test(releaseSha)) {
      throw new McfContinuationInputError('INVALID_RELEASE_SHA');
    }
    if (typeof targetBindingId !== 'string' || !/^[A-Za-z0-9._:-]{3,100}$/u.test(targetBindingId)) {
      throw new McfContinuationInputError('INVALID_TARGET_BINDING');
    }
    return this.store.register({
      id: randomUUID(),
      dedupeKey: sha256(['RELEASE_OBSERVATION', goal, releaseSha, targetBindingId]),
      goal,
      releaseSha,
      targetBindingId,
    });
  }

  async read(id: string) {
    return this.store.find(id);
  }

  async observe(input: {
    continuationId: string;
    blockers: readonly string[];
    evidenceDigest: string;
  }) {
    if (
      !Array.isArray(input.blockers) ||
      input.blockers.length > 50 ||
      input.blockers.some((code) => typeof code !== 'string' || !/^[A-Z0-9_]{3,100}$/u.test(code))
    ) {
      throw new McfContinuationInputError('INVALID_BLOCKERS');
    }
    if (typeof input.evidenceDigest !== 'string' || !/^[a-f0-9]{64}$/u.test(input.evidenceDigest)) {
      throw new McfContinuationInputError('INVALID_EVIDENCE_DIGEST');
    }
    const current = await this.store.find(input.continuationId);
    if (!current) throw new McfContinuationInputError('CONTINUATION_NOT_FOUND');
    if (current.state === 'SUPERSEDED' || current.state === 'CANCELLED') {
      return current;
    }
    const blockers = [...new Set(input.blockers)].sort();
    const progressFingerprint = sha256([
      current.kind,
      current.releaseSha,
      current.targetBindingId,
      blockers,
      input.evidenceDigest,
    ]);
    return this.store.observe({
      id: current.id,
      state: blockers.length ? 'BLOCKED_EXTERNAL' : 'WAITING_CANONICAL_GATE',
      progressFingerprint,
      blockers,
      evidenceDigest: input.evidenceDigest,
    });
  }
}
