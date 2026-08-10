import type { McfCiCallbackResponse } from '@rsa/contracts';
import type { DatabaseRow } from '@rsa/database';

import type { DatabaseService } from '../database.service.js';
import type { ExternalActionLedger } from './external-action-ledger.js';
import type { GitHubActionsStagingDeployAdapter } from './github-staging-deploy.adapter.js';
import { McfEvidenceRejectedError } from './mcf-runtime.errors.js';
import type { McfRuntimeRepository } from './mcf-runtime.repository.js';
import type { SkillExecutor } from './skill-executor.js';
import type { SkillRegistryLoader } from './skill-registry.loader.js';
import {
  type McfStagingDeployCallbackRequest,
  StagingDeployReconciliationService,
} from './staging-deploy-reconciliation.service.js';
import { canonicalizeStagingRuntimeUrl } from './staging-runtime-origin.js';

interface BoundOriginRow extends DatabaseRow {
  payload: unknown;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function callbackOrigin(value: string): string {
  try {
    return canonicalizeStagingRuntimeUrl(value);
  } catch {
    throw new McfEvidenceRejectedError('staging callback supplied an invalid runtime origin');
  }
}

export class BoundStagingDeployReconciliationService extends StagingDeployReconciliationService {
  constructor(
    repository: McfRuntimeRepository,
    executor: SkillExecutor,
    registry: SkillRegistryLoader,
    private readonly boundLedger: ExternalActionLedger,
    adapter: GitHubActionsStagingDeployAdapter,
    private readonly boundDatabase: DatabaseService,
  ) {
    super(repository, executor, registry, boundLedger, adapter, boundDatabase);
  }

  override async accept(request: McfStagingDeployCallbackRequest): Promise<McfCiCallbackResponse> {
    const attempt = await this.boundLedger.loadStagingDeployReconciliationAttempt(
      request.missionId,
      request.phaseId,
      request.requestId,
    );
    if (!attempt) {
      throw new McfEvidenceRejectedError('staging callback has no durable deployment attempt');
    }

    if (attempt.status === 'EVIDENCE_VALIDATED' || attempt.status === 'EVIDENCE_REJECTED') {
      return super.accept(request);
    }

    const result = await this.boundDatabase.query<BoundOriginRow>(
      `select "payload"
       from "mcf_events"
       where "mission_id" = $1
         and "phase_id" = $2
         and "event_type" = 'EXTERNAL_ACTION_ALLOWED'
         and "payload"->>'kind' = 'STAGING_ORIGIN_BOUND'
         and "payload"->>'attemptId' = $3
         and "payload"->>'stagingOriginBound' = 'true'
       order by "sequence" asc
       limit 2`,
      [request.missionId, request.phaseId, attempt.attemptId],
    );
    if (result.rows.length !== 1) {
      throw new McfEvidenceRejectedError(
        'staging callback requires exactly one durable authorized runtime origin',
      );
    }

    const payload = asRecord(result.rows[0]?.payload);
    const durableValue = payload.stagingRuntimeUrl;
    if (
      payload.attemptId !== attempt.attemptId ||
      payload.idempotencyKey !== request.requestId ||
      typeof payload.repository !== 'string' ||
      payload.repository.toLowerCase() !== request.repository.toLowerCase() ||
      typeof durableValue !== 'string'
    ) {
      throw new McfEvidenceRejectedError(
        'staging callback origin binding does not match the durable deployment attempt',
      );
    }

    const durableOrigin = callbackOrigin(durableValue);
    const suppliedOrigin = callbackOrigin(request.stagingRuntimeUrl);
    if (durableOrigin !== durableValue || suppliedOrigin !== durableOrigin) {
      throw new McfEvidenceRejectedError(
        'staging callback runtime origin does not match the durable authorized staging origin',
      );
    }

    return super.accept({ ...request, stagingRuntimeUrl: durableOrigin });
  }
}
