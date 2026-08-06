import { Injectable } from '@nestjs/common';

import type { AdapterRegistry } from './adapter-registry.js';
import {
  ExternalActionAdapterError,
  type ExternalActionDispatchResult,
  type ExternalActionFailure,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import type { ExternalActionLedger } from './external-action-ledger.js';

function failureFromError(error: unknown): ExternalActionFailure {
  if (error instanceof ExternalActionAdapterError) {
    return {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      statusCode: error.statusCode,
    };
  }

  return {
    code: 'ADAPTER_FAILURE',
    message: error instanceof Error ? error.message : 'unknown external adapter failure',
    retryable: false,
    statusCode: null,
  };
}

@Injectable()
export class ExternalActionDispatcher {
  constructor(
    private readonly registry: AdapterRegistry,
    private readonly ledger: ExternalActionLedger,
  ) {}

  async dispatch(request: ExternalActionRequest): Promise<ExternalActionDispatchResult> {
    const adapter = this.registry.resolve(request);
    if (!adapter) {
      return { status: 'NOT_HANDLED', adapterId: null, attemptId: null };
    }

    let attemptId: string | null = null;
    try {
      attemptId = await this.ledger.reserve(request, adapter.adapterId);
      const receipt = await adapter.execute(request);
      await this.ledger.recordExecuted(attemptId, receipt);
      return { status: 'EXECUTED', adapterId: adapter.adapterId, attemptId, receipt };
    } catch (error) {
      const failure = failureFromError(error);
      if (attemptId) {
        try {
          await this.ledger.recordFailed(attemptId, failure);
        } catch (ledgerError) {
          return {
            status: 'FAILED',
            adapterId: adapter.adapterId,
            attemptId,
            failure: failureFromError(ledgerError),
          };
        }
      }
      return { status: 'FAILED', adapterId: adapter.adapterId, attemptId, failure };
    }
  }

  async recordEvidenceValidated(attemptId: string, receiptId: string): Promise<void> {
    await this.ledger.recordEvidenceValidated(attemptId, receiptId);
  }

  async recordEvidenceRejected(
    attemptId: string,
    receiptId: string | null,
    reason: string,
  ): Promise<void> {
    await this.ledger.recordEvidenceRejected(attemptId, receiptId, reason);
  }
}
