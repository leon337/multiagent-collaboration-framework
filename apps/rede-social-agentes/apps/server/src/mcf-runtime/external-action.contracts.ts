import type { McfSkillDefinition, McfToolReceipt } from '@rsa/contracts';

import type { McfToolRequest } from './permission-engine.js';

export type ExternalActionFailureCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'RATE_LIMITED'
  | 'TARGET_NOT_FOUND'
  | 'UNSUPPORTED_TARGET'
  | 'INVALID_RESPONSE'
  | 'NETWORK_FAILURE'
  | 'INVALID_CONTEXT'
  | 'RESERVATION_CONFLICT'
  | 'LEDGER_FAILURE'
  | 'ADAPTER_FAILURE';

export interface ExternalActionExecutionContext {
  missionId: string;
  phaseId: string;
  expectedMissionVersion: number;
}

export interface ExternalActionRequest {
  skill: McfSkillDefinition;
  agentId: string;
  inputs: Record<string, unknown>;
  tool: McfToolRequest;
  context?: ExternalActionExecutionContext | undefined;
}

export interface ExternalActionFailure {
  code: ExternalActionFailureCode;
  message: string;
  retryable: boolean;
  statusCode: number | null;
}

export interface ExternalActionAdapter {
  readonly adapterId: string;
  supports(request: ExternalActionRequest): boolean;
  execute(request: ExternalActionRequest): Promise<McfToolReceipt>;
}

export type ExternalActionDispatchResult =
  | {
      status: 'NOT_HANDLED';
      adapterId: null;
      attemptId: null;
    }
  | {
      status: 'EXECUTED';
      adapterId: string;
      attemptId: string;
      receipt: McfToolReceipt;
    }
  | {
      status: 'FAILED';
      adapterId: string;
      attemptId: string | null;
      failure: ExternalActionFailure;
    };

export interface ExternalActionTrace {
  status: ExternalActionDispatchResult['status'] | 'EXTERNAL_RECEIPT';
  adapterId: string | null;
  attemptId: string | null;
  failureCode: ExternalActionFailureCode | null;
  retryable: boolean | null;
}

export class ExternalActionAdapterError extends Error {
  constructor(
    readonly code: ExternalActionFailureCode,
    message: string,
    readonly retryable: boolean,
    readonly statusCode: number | null = null,
  ) {
    super(message);
    this.name = 'ExternalActionAdapterError';
  }
}
