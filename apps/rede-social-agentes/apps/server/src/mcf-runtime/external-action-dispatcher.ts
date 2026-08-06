import { Injectable } from '@nestjs/common';

import type { AdapterRegistry } from './adapter-registry.js';
import {
  ExternalActionAdapterError,
  type ExternalActionDispatchResult,
  type ExternalActionRequest,
} from './external-action.contracts.js';

@Injectable()
export class ExternalActionDispatcher {
  constructor(private readonly registry: AdapterRegistry) {}

  async dispatch(request: ExternalActionRequest): Promise<ExternalActionDispatchResult> {
    const adapter = this.registry.resolve(request);
    if (!adapter) {
      return { status: 'NOT_HANDLED', adapterId: null };
    }

    try {
      const receipt = await adapter.execute(request);
      return { status: 'EXECUTED', adapterId: adapter.adapterId, receipt };
    } catch (error) {
      if (error instanceof ExternalActionAdapterError) {
        return {
          status: 'FAILED',
          adapterId: adapter.adapterId,
          failure: {
            code: error.code,
            message: error.message,
            retryable: error.retryable,
            statusCode: error.statusCode,
          },
        };
      }

      return {
        status: 'FAILED',
        adapterId: adapter.adapterId,
        failure: {
          code: 'ADAPTER_FAILURE',
          message: error instanceof Error ? error.message : 'unknown external adapter failure',
          retryable: false,
          statusCode: null,
        },
      };
    }
  }
}
