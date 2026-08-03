export type ActorType = 'HUMAN' | 'AGENT' | 'SYSTEM';

export interface CommandEnvelope<TPayload> {
  commandId: string;
  correlationId: string;
  actorId: string;
  actorType: ActorType;
  issuedAt: string;
  payload: TPayload;
}

export interface DomainEvent<TPayload> {
  eventId: string;
  eventType: string;
  schemaVersion: number;
  aggregateType: string;
  aggregateId: string;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  actorId: string;
  actorType: ActorType;
  payload: TPayload;
}

export interface PublicError {
  code: string;
  message: string;
  correlationId: string;
  details?: Record<string, unknown>;
}

export interface HealthResponse {
  status: 'ok';
  service: 'rede-social-agentes';
  component: 'server' | 'worker';
  timestamp: string;
}
