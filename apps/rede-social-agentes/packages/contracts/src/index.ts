export type ActorType = 'HUMAN' | 'AGENT' | 'SYSTEM';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';

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

export interface RegisterHumanAccountRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface HumanAccountResponse {
  id: string;
  email: string;
  displayName: string;
  status: AccountStatus;
  createdAt: string;
}

export interface CreateSessionRequest {
  email: string;
  password: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  token: string;
  expiresAt: string;
  account: HumanAccountResponse;
}
