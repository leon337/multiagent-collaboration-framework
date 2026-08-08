import { Injectable } from '@nestjs/common';
import type { McfToolReceipt } from '@rsa/contracts';

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

function unknownFailure(error: unknown): ExternalActionFailure {
  const failure = failureFromError(error);
  return { ...failure, retryable: false };
}

function partialReceiptFailure(receipt: McfToolReceipt): ExternalActionFailure {
  return {
    code: 'EXTERNAL_EFFECT_UNKNOWN',
    message: `External adapter returned ${receipt.status}; provider effect must be reconciled before retry`,
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

    let attemptId: string;
    try {
      attemptId = await this.ledger.reserve(request, adapter.adapterId);
    } catch (error) {
      return {
        status: 'FAILED',
        adapterId: adapter.adapterId,
        attemptId: null,
        failure: failureFromError(error),
      };
    }

    // Establish a durable boundary before the adapter is allowed to perform any
    // external mutation. An expired EXECUTING attempt is recovered as UNKNOWN,
    // never as retryable/abandoned, so its global idempotency binding survives.
    try {
      await this.ledger.recordExecuting(attemptId);
    } catch (error) {
      const failure = failureFromError(error);
      try {
        // No adapter call has occurred yet, so this is definitively pre-write.
        await this.ledger.recordFailed(attemptId, failure);
      } catch (ledgerError) {
        return {
          status: 'FAILED',
          adapterId: adapter.adapterId,
          attemptId,
          failure: failureFromError(ledgerError),
        };
      }
      return { status: 'FAILED', adapterId: adapter.adapterId, attemptId, failure };
    }

    let receipt: McfToolReceipt;
    try {
      receipt = await adapter.execute(request);
    } catch (error) {
      const failure = failureFromError(error);
      try {
        // Adapter errors are required to represent definitively-not-applied
        // failures. Ambiguous/post-write outcomes must be returned as PARTIAL.
        await this.ledger.recordFailed(attemptId, failure);
      } catch (ledgerError) {
        return {
          status: 'FAILED',
          adapterId: adapter.adapterId,
          attemptId,
          failure: failureFromError(ledgerError),
        };
      }
      return { status: 'FAILED', adapterId: adapter.adapterId, attemptId, failure };
    }

    if (receipt.status !== 'SUCCEEDED') {
      const failure = partialReceiptFailure(receipt);
      try {
        await this.ledger.recordUnknown(attemptId, receipt, failure);
      } catch (ledgerError) {
        return {
          status: 'UNKNOWN',
          adapterId: adapter.adapterId,
          attemptId,
          receipt,
          failure: unknownFailure(ledgerError),
        };
      }
      return { status: 'UNKNOWN', adapterId: adapter.adapterId, attemptId, receipt, failure };
    }

    try {
      await this.ledger.recordExecuted(attemptId, receipt);
      return { status: 'EXECUTED', adapterId: adapter.adapterId, attemptId, receipt };
    } catch (error) {
      // The adapter already returned a receipt. Never convert a persistence
      // failure here into FAILED: the provider mutation may be fully applied.
      const failure = unknownFailure(error);
      try {
        await this.ledger.recordUnknown(attemptId, receipt, failure);
      } catch (ledgerError) {
        return {
          status: 'UNKNOWN',
          adapterId: adapter.adapterId,
          attemptId,
          receipt,
          failure: unknownFailure(ledgerError),
        };
      }
      return { status: 'UNKNOWN', adapterId: adapter.adapterId, attemptId, receipt, failure };
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
