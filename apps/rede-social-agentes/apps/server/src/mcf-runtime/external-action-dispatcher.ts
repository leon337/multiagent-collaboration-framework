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

const durableExecutionBoundaryAdapters = new Set([
  'github-pr-collaboration-write-v1',
  'github-actions-staging-deploy-v1',
]);
const unknownPersistenceAttempts = 3;

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

  private async recordUnknownDurably(
    attemptId: string,
    receipt: McfToolReceipt,
    failure: ExternalActionFailure,
  ): Promise<void> {
    for (
      let persistenceAttempt = 1;
      persistenceAttempt <= unknownPersistenceAttempts;
      persistenceAttempt += 1
    ) {
      try {
        await this.ledger.recordUnknown(attemptId, receipt, failure);
        return;
      } catch (error) {
        const ledgerFailure = failureFromError(error);
        if (!ledgerFailure.retryable || persistenceAttempt === unknownPersistenceAttempts) {
          throw new ExternalActionAdapterError(
            'LEDGER_FAILURE',
            `Unable to durably persist UNKNOWN external action state; reconciliation is required before retry: ${ledgerFailure.message}`,
            false,
            ledgerFailure.statusCode,
          );
        }
      }
    }
  }

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

    if (durableExecutionBoundaryAdapters.has(adapter.adapterId)) {
      // Establish a durable boundary before adapters that can trigger an
      // externally mutating workflow are allowed to execute. An expired
      // EXECUTING attempt is reconciled as UNKNOWN, never blindly retried.
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
      await this.recordUnknownDurably(attemptId, receipt, failure);
      return { status: 'UNKNOWN', adapterId: adapter.adapterId, attemptId, receipt, failure };
    }

    try {
      await this.ledger.recordExecuted(attemptId, receipt);
      return { status: 'EXECUTED', adapterId: adapter.adapterId, attemptId, receipt };
    } catch (error) {
      // The adapter already returned a receipt. Never convert a persistence
      // failure here into FAILED: the provider mutation may be fully applied.
      // UNKNOWN is returned only after that ambiguity is durable in the ledger.
      const failure = unknownFailure(error);
      await this.recordUnknownDurably(attemptId, receipt, failure);
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
