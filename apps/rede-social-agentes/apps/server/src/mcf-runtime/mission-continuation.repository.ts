import type { DatabaseService } from '../database.service.js';
import type {
  CreateReadOnlyContinuation,
  McfMissionContinuation,
  McfMissionContinuationStore,
  PersistReadOnlyObservation,
} from './mission-continuation.service.js';

type Row = Record<string, unknown>;

function mapRow(row: Row): McfMissionContinuation {
  return {
    id: String(row.id),
    dedupeKey: String(row.dedupe_key),
    kind: 'RELEASE_OBSERVATION',
    goal: String(row.goal),
    releaseSha: String(row.release_sha),
    targetBindingId: String(row.target_binding_id),
    state: row.state as McfMissionContinuation['state'],
    version: Number(row.version),
    progressFingerprint:
      row.progress_fingerprint === null ? null : String(row.progress_fingerprint),
    blockers: row.blockers as string[],
    evidenceDigest: row.evidence_digest === null ? null : String(row.evidence_digest),
    notificationCount: Number(row.notification_count),
    gateRequestCount: 0,
    observedAt: row.observed_at === null ? null : new Date(row.observed_at as string),
    changedAt: new Date(row.changed_at as string),
    createdAt: new Date(row.created_at as string),
  };
}

/**
 * Persistence uses one atomic UPDATE. Concurrent polling cannot duplicate a
 * notification or a gate request. No release/deploy authorization is stored.
 */
export class PostgresMissionContinuationRepository implements McfMissionContinuationStore {
  constructor(private readonly db: DatabaseService) {}

  async register(input: CreateReadOnlyContinuation): Promise<McfMissionContinuation> {
    await this.db.query(
      `insert into mcf_mission_continuations
        (id, dedupe_key, kind, goal, release_sha, target_binding_id)
       values ($1, $2, 'RELEASE_OBSERVATION', $3, $4, $5)
       on conflict (dedupe_key) do nothing`,
      [input.id, input.dedupeKey, input.goal, input.releaseSha, input.targetBindingId],
    );
    const result = await this.db.query<Row>(
      'select * from mcf_mission_continuations where dedupe_key = $1',
      [input.dedupeKey],
    );
    if (!result.rows[0]) throw new Error('CONTINUATION_INSERT_NOT_VISIBLE');
    return mapRow(result.rows[0]);
  }

  async find(id: string): Promise<McfMissionContinuation | null> {
    const result = await this.db.query<Row>(
      'select * from mcf_mission_continuations where id = $1',
      [id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async observe(input: PersistReadOnlyObservation): Promise<McfMissionContinuation | null> {
    const result = await this.db.query<Row>(
      `with first_seen as (
         insert into mcf_mission_continuation_fingerprints
           (continuation_id, fingerprint)
         select $1, $3 where exists (
           select 1 from mcf_mission_continuations
           where id = $1 and state not in ('SUPERSEDED','CANCELLED')
         )
         on conflict do nothing
         returning fingerprint
       )
       update mcf_mission_continuations set
         state = $2,
         progress_fingerprint = $3,
         blockers = $4::jsonb,
         evidence_digest = $5,
         notification_count = notification_count
           + case when $6::boolean and exists (select 1 from first_seen)
                  then 1 else 0 end,
         version = version + 1,
         observed_at = now(),
         changed_at = case
           when progress_fingerprint is distinct from $3 or state is distinct from $2
           then now() else changed_at end
       where id = $1
         and state not in ('SUPERSEDED', 'CANCELLED')
       returning *`,
      [
        input.id,
        input.state,
        input.progressFingerprint,
        JSON.stringify(input.blockers),
        input.evidenceDigest,
        input.blockers.length > 0,
      ],
    );
    if (result.rows[0]) return mapRow(result.rows[0]);
    return this.find(input.id);
  }
}
