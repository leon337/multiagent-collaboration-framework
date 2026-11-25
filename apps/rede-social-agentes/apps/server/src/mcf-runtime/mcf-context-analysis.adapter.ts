import { randomUUID } from 'node:crypto';

import type { McfToolReceipt } from '@rsa/contracts';

import type { McfCapabilityRegistryApiService } from '../mcf-context/mcf-capability-registry-api.service.js';
import {
  parseMcfCapabilityGapRequest,
  parseMcfProjectBootstrapRequest,
} from '../mcf-context/mcf-capability-gap.validation.js';
import type { EvidenceValidator } from './evidence-validator.js';
import {
  ExternalActionAdapterError,
  type ExternalActionAdapter,
  type ExternalActionRequest,
} from './external-action.contracts.js';
import { canonicalizeProvider, canonicalizeToolValue } from './permission-engine.js';

export const MCF_CONTEXT_ANALYSIS_PROVIDER = 'mcf-context';
export const MCF_CAPABILITY_GAP_SKILL = 'MCF-CAPABILITY-GAP-ANALYSIS';
export const MCF_PROJECT_BOOTSTRAP_SKILL = 'MCF-PROJECT-BOOTSTRAP';

export class McfContextAnalysisAdapter implements ExternalActionAdapter {
  readonly adapterId = 'mcf-context-analysis-local-v1';

  constructor(
    private readonly evidence: EvidenceValidator,
    private readonly capabilities: McfCapabilityRegistryApiService,
  ) {}

  supports(request: ExternalActionRequest): boolean {
    const provider = canonicalizeProvider(request.tool.provider);
    const resource = canonicalizeToolValue(request.tool.resource);
    const operation = canonicalizeToolValue(request.tool.operation);
    return (
      (request.skill.skillId === MCF_CAPABILITY_GAP_SKILL &&
        provider === MCF_CONTEXT_ANALYSIS_PROVIDER &&
        resource === 'capability-registry' &&
        operation === 'analyze-gaps') ||
      (request.skill.skillId === MCF_PROJECT_BOOTSTRAP_SKILL &&
        provider === MCF_CONTEXT_ANALYSIS_PROVIDER &&
        resource === 'project-bootstrap' &&
        operation === 'build-plan')
    );
  }

  async execute(request: ExternalActionRequest): Promise<McfToolReceipt> {
    if (!this.supports(request)) {
      throw new ExternalActionAdapterError(
        'UNSUPPORTED_TARGET',
        'MCF context analysis target is not allowlisted',
        false,
      );
    }

    const externalId = randomUUID();
    const operation = canonicalizeToolValue(request.tool.operation);
    const metadata: Record<string, unknown> = {
      adapterId: this.adapterId,
      readOnly: true,
      evidenceOnly: true,
      executionStarted: false,
      externalActionsStarted: false,
    };

    try {
      if (request.skill.skillId === MCF_CAPABILITY_GAP_SKILL && operation === 'analyze-gaps') {
        const parsed = parseMcfCapabilityGapRequest(request.inputs);
        const report = this.capabilities.analyzeGaps(parsed);
        metadata.projectId = report.project_id;
        metadata.gapReport = report;
      } else if (request.skill.skillId === MCF_PROJECT_BOOTSTRAP_SKILL && operation === 'build-plan') {
        const parsed = parseMcfProjectBootstrapRequest(request.inputs);
        const plan = this.capabilities.buildBootstrapPlan(parsed);
        metadata.projectId = plan.project_id;
        metadata.bootstrapPlan = plan;
      } else {
        throw new ExternalActionAdapterError('UNSUPPORTED_TARGET', 'MCF context operation is not allowlisted', false);
      }
    } catch (error) {
      if (error instanceof ExternalActionAdapterError) throw error;
      if (error instanceof Error && error.message === 'MCF_CAPABILITY_ANALYSIS_INPUT_INVALID') {
        throw new ExternalActionAdapterError('INVALID_CONTEXT', 'MCF context analysis input is invalid', false, 400);
      }
      throw new ExternalActionAdapterError('ADAPTER_FAILURE', 'MCF context analysis is unavailable', false, 503);
    }

    return this.evidence.createTrustedReceipt({
      provider: MCF_CONTEXT_ANALYSIS_PROVIDER,
      operation,
      resource: request.tool.resource,
      externalId,
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata,
    });
  }
}
