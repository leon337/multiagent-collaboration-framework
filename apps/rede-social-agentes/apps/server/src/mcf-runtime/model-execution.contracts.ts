export type ModelExecutionOperation = 'generate';

export type ModelExecutionFailureCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'RATE_LIMITED'
  | 'MODEL_TIMEOUT'
  | 'NETWORK_FAILURE'
  | 'INVALID_RESPONSE'
  | 'MODEL_BLOCKED'
  | 'MODEL_NOT_ALLOWED'
  | 'PROVIDER_DISABLED';

export interface ModelToolIntent {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ModelExecutionRequest {
  provider: string;
  model: string;
  operation: ModelExecutionOperation;
  input: unknown;
  executor: string;
  missionId?: string;
  phaseId?: string;
  agentId?: string;
}

export interface ModelExecutionReceipt {
  provider: string;
  model: string;
  operation: ModelExecutionOperation;
  executor: string;
  missionId?: string;
  phaseId?: string;
  agentId?: string;
  startedAt: string;
  completedAt: string;
  inputDigest: string;
  outputDigest?: string;
  finishReason: string;
  toolIntents: ModelToolIntent[];
  validationVerdict: 'PASS' | 'BLOCKED' | 'FAILED';
  failureCode?: ModelExecutionFailureCode;
  usage?: Record<string, number>;
}

export interface ModelExecutionProvider {
  providerId: string;
  supports(request: ModelExecutionRequest): boolean;
  execute(request: ModelExecutionRequest): Promise<ModelExecutionReceipt>;
}
