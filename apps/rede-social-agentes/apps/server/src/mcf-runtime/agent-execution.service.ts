import { Injectable } from '@nestjs/common';

import {
  assertAuthorityEnvelope,
  assertRequestedCapabilities,
  type AgentExecutionEvidence,
  type AgentExecutionHandle,
  type AgentExecutionRequest,
  type AgentExecutionStatus,
} from './agent-execution.contracts.js';
import { ProviderAdapterRegistry } from './provider-adapter.registry.js';

@Injectable()
export class AgentExecutionService {
  constructor(private readonly providers: ProviderAdapterRegistry) {}

  async start(request: AgentExecutionRequest): Promise<AgentExecutionHandle> {
    assertAuthorityEnvelope(request);
    assertRequestedCapabilities(request);
    return this.providers
      .resolve({
        providerId: request.provider.providerId,
        requiredCapabilities: request.requestedCapabilities,
      })
      .start(request);
  }

  async resume(handle: AgentExecutionHandle): Promise<AgentExecutionStatus> {
    return this.providers.resolve({ providerId: handle.providerId }).resume(handle);
  }

  async interrupt(handle: AgentExecutionHandle): Promise<AgentExecutionStatus> {
    return this.providers.resolve({ providerId: handle.providerId }).interrupt(handle);
  }

  async cancel(handle: AgentExecutionHandle): Promise<AgentExecutionStatus> {
    return this.providers.resolve({ providerId: handle.providerId }).cancel(handle);
  }

  async status(handle: AgentExecutionHandle): Promise<AgentExecutionStatus> {
    return this.providers.resolve({ providerId: handle.providerId }).status(handle);
  }

  async collectEvidence(handle: AgentExecutionHandle): Promise<readonly AgentExecutionEvidence[]> {
    return this.providers.resolve({ providerId: handle.providerId }).collectEvidence(handle);
  }
}
