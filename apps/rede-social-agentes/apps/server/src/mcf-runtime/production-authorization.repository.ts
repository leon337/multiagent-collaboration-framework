import { Injectable } from '@nestjs/common';

import type { DatabaseService } from '../database.service.js';
import type { McfEventInput } from './mcf-runtime.repository.js';
import type { ProductionGateEventStore } from './production-authorization.service.js';

@Injectable()
export class ProductionAuthorizationRepository implements ProductionGateEventStore {
  constructor(private readonly database: DatabaseService) {}

  async appendGateEvent(event: McfEventInput): Promise<boolean> {
    const result = await this.database.query<{ id: string }>(
      `insert into mcf_events (
         id,
         mission_id,
         phase_id,
         agent_id,
         event_type,
         payload,
         idempotency_key,
         occurred_at
       ) values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
       on conflict (idempotency_key) do nothing
       returning id`,
      [
        event.id,
        event.missionId,
        event.phaseId,
        event.agentId,
        event.eventType,
        JSON.stringify(event.payload),
        event.idempotencyKey,
        event.occurredAt,
      ],
    );
    return result.rows.length === 1;
  }
}
