import { randomUUID } from 'node:crypto';

import type { DatabaseRow } from '@rsa/database';

import type { DatabaseService } from '../database.service.js';
import {
  ExternalActionAdapterError,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import { ExternalActionLedger } from './external-action-ledger.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';
import { canonicalizeStagingRuntimeUrl } from './staging-runtime-origin.js';

const STAGING_ADAPTER_ID = 'github-actions-staging-deploy-v1';
const STAGING_OPERATION = 'deploy-staging';

interface EventRow extends DatabaseRow {
  id: string;
}

function isStagingRequest(request: ExternalActionRequest, adapterId: string): boolean {
  return (
    adapterId === STAGING_ADAPTER_ID &&
    request.skill.skillId === 'MCF-DEPLOY-VALIDATE' &&
    canonicalizeProvider(request.tool.provider) === 'github' &&
    canonicalizeToolValue(request.tool.operation) === STAGING_OPERATION
  );
}

function canonicalizeStagingRequest(request: ExternalActionRequest): ExternalActionRequest {
  const inputs = { ...request.inputs };
  if (typeof inputs.repository === 'string') {
    inputs.repository = inputs.repository.trim().toLowerCase();
  }
  if (typeof inputs.artifact_or_commit === 'string') {
    inputs.artifact_or_commit = inputs.artifact_or_commit.trim().toLowerCase();
  }
  if (typeof inputs.target_environment === 'string') {
    inputs.target_environment = canonicalizeToolValue(inputs.target_environment);
  }

  return {
    ...request,
    inputs,
    tool: {
      provider: canonicalizeProvider(request.tool.provider),
      operation: canonicalizeToolValue(request.tool.operation),
      resource: request.tool.resource.trim().toLowerCase(),
    },
  };
}

export class CanonicalExternalActionLedger extends ExternalActionLedger {
  private readonly authorizedStagingRuntimeUrl: string | null;

  constructor(
    private readonly durableDatabase: DatabaseService,
    configuredStagingRuntimeUrl: string | undefined = process.env.MCF_STAGING_RUNTIME_URL,
  ) {
    super(durableDatabase);
    this.authorizedStagingRuntimeUrl = configuredStagingRuntimeUrl
      ? canonicalizeStagingRuntimeUrl(configuredStagingRuntimeUrl)
      : null;
  }

  override async reserve(request: ExternalActionRequest, adapterId: string): Promise<string> {
    const stagingRequest = isStagingRequest(request, adapterId);
    if (stagingRequest && !this.authorizedStagingRuntimeUrl) {
      throw new ExternalActionAdapterError(
        'INVALID_CONTEXT',
        'MCF_STAGING_RUNTIME_URL is required before reserving a staging deployment',
        false,
      );
    }

    const durableRequest = stagingRequest ? canonicalizeStagingRequest(request) : request;
    const attemptId = await super.reserve(durableRequest, adapterId);
    if (!stagingRequest) return attemptId;

    const occurredAt = new Date();
    try {
      const result = await this.durableDatabase.query<EventRow>(
        `insert into "mcf_events" (
          "id", "mission_id", "phase_id", "agent_id", "event_type", "payload",
          "idempotency_key", "occurred_at"
        )
        select $1, "mission_id", "phase_id", "agent_id", 'EXTERNAL_ACTION_ALLOWED', $2::jsonb, $3, $4
        from "mcf_external_action_attempts"
        where "attempt_id" = $5
          and "adapter_id" = $6
          and "provider" = 'github'
          and "operation" = 'deploy-staging'
        returning "id"`,
        [
          randomUUID(),
          JSON.stringify({
            kind: 'STAGING_ORIGIN_BOUND',
            attemptId,
            adapterId: STAGING_ADAPTER_ID,
            provider: 'github',
            operation: STAGING_OPERATION,
            repository: durableRequest.tool.resource,
            idempotencyKey: durableRequest.inputs.idempotency_key ?? null,
            stagingRuntimeUrl: this.authorizedStagingRuntimeUrl,
            stagingOriginBound: true,
            externalEffectState: 'MUTATION_NOT_STARTED',
            retryWithoutReconciliation: false,
          }),
          `external-action:${attemptId}:staging-origin-bound`,
          occurredAt,
          attemptId,
          STAGING_ADAPTER_ID,
        ],
      );
      if (result.rows.length !== 1) {
        throw new ExternalActionAdapterError(
          'LEDGER_FAILURE',
          'staging deployment origin binding did not match the reserved attempt',
          true,
        );
      }
    } catch (error) {
      if (error instanceof ExternalActionAdapterError) throw error;
      throw new ExternalActionAdapterError(
        'LEDGER_FAILURE',
        error instanceof Error
          ? error.message
          : 'Failed to persist authorized staging runtime origin',
        true,
      );
    }

    return attemptId;
  }
}
