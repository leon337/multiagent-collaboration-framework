import { describe, expect, it, vi } from 'vitest';

import type { McfSkillDefinition } from '@rsa/contracts';

import type { McfCapabilityRegistryApiService } from '../mcf-context/mcf-capability-registry-api.service.js';
import type { EvidenceValidator } from './evidence-validator.js';
import type { ExternalActionRequest } from './external-action.contracts.js';
import { McfContextAnalysisAdapter } from './mcf-context-analysis.adapter.js';

const gapReport = {
  schema_version: 1 as const,
  analyzed_at: '2026-11-25T18:00:00.000Z',
  project_id: 'agente-logistica-obras-v1',
  read_only: true as const,
  evidence_only: true as const,
  summary: { total: 1, ready: 0, missing: 1, blocked: 0, needs_verification: 0 },
  requirements: [{
    capability_id: 'mcf.google.cloud.provision',
    status: 'MISSING' as const,
    gaps: [{
      code: 'CAPABILITY_NOT_REGISTERED' as const,
      blocking: true,
      recommended_action: 'Register the capability',
      required_gate: 'CAPABILITY_REGISTRATION_REVIEW',
    }],
    provider_project_id: null,
    mode: null,
    allowed_operations: [],
    source_refs: [],
  }],
};
const bootstrapPlan = {
  schema_version: 1 as const,
  generated_at: '2026-11-25T18:00:00.000Z',
  project_id: 'agente-logistica-obras-v1',
  project_name: 'Agente de Logística de Obras',
  objective: 'Entregar uma V1 validada',
  environment: 'dev' as const,
  read_only: true as const,
  evidence_only: true as const,
  execution_started: false as const,
  summary: { total_tasks: 12, ready: 8, blocked: 3, skipped: 1, requires_human_gates: 3 },
  capability_gaps: gapReport,
  tasks: [],
};
const capabilitySkill: McfSkillDefinition = {
  skillId: 'MCF-CAPABILITY-GAP-ANALYSIS',
  name: 'Analisar gaps de capacidade',
  version: '0.1.0',
  purpose: 'Comparar requisitos com o capability registry sem mutação.',
  ownerAgents: ['Mestre'],
  requiredInputs: ['project_id', 'requirements'],
  optionalInputs: ['live_verifications'],
  allowedTools: ['mcf-context'],
  forbiddenTools: ['authorize', 'mutate', 'execute', 'deploy', 'write'],
  permissionProfile: 'READ_ONLY',
  executionSteps: ['load_registry', 'compare_requirements', 'classify_gaps', 'emit_read_only_report'],
  requiredEvidence: ['capability_gap_report'],
  acceptanceCriteria: ['all_requirements_classified', 'no_registry_mutation'],
  failureModes: ['registry_unavailable', 'invalid_request', 'live_verification_missing'],
  fallback: 'Return the gap report with explicit blockers; do not mutate capability state.',
  handoffTo: 'Mestre',
};
const bootstrapSkill: McfSkillDefinition = {
  ...capabilitySkill,
  skillId: 'MCF-PROJECT-BOOTSTRAP',
  name: 'Planejar bootstrap de projeto',
  purpose: 'Compor plano de bootstrap com dependências e gates, sem executar ações.',
  requiredInputs: ['project_id', 'project_name', 'objective', 'environment', 'requirements'],
  optionalInputs: [
    'live_verifications',
    'paid_services_required',
    'allow_paid_services',
    'external_actions_authorized',
    'production_requested',
    'production_authorized',
  ],
  executionSteps: ['analyze_capability_gaps', 'compose_tasks', 'apply_human_gates', 'emit_plan_only_receipt'],
  requiredEvidence: ['capability_gap_report', 'bootstrap_task_graph', 'human_gates'],
  acceptanceCriteria: ['plan_is_read_only', 'no_external_actions_started', 'all_gates_explicit'],
};
function gapInputs() {
  return {
    project_id: 'agente-logistica-obras-v1',
    requirements: [{
      capability_id: 'mcf.google.cloud.provision',
      required_operations: ['project.create'],
      environment: 'dev',
      resource: 'google-cloud',
      mode: 'BOUNDED_WRITE',
    }],
  };
}
function bootstrapInputs() {
  return {
    ...gapInputs(),
    project_name: 'Agente de Logística de Obras',
    objective: 'Entregar uma V1 validada',
    environment: 'dev',
    external_actions_authorized: false,
    allow_paid_services: false,
    production_requested: false,
  };
}
function request(skill: McfSkillDefinition, operation: string, resource: string, inputs: Record<string, unknown>): ExternalActionRequest {
  return {
    skill,
    agentId: 'Mestre',
    inputs,
    tool: { provider: 'mcf-context', operation, resource },
  };
}
function evidence(): EvidenceValidator {
  return {
    createTrustedReceipt: vi.fn((input) => ({
      ...input,
      receiptId: 'test-receipt',
      signature: 'test-signature',
      payloadDigest: 'test-digest',
    })),
  } as unknown as EvidenceValidator;
}

describe('McfContextAnalysisAdapter', () => {
  it('supports only the dedicated read-only analysis skills and targets', () => {
    const subject = new McfContextAnalysisAdapter(
      evidence(),
      {
        analyzeGaps: vi.fn().mockReturnValue(gapReport),
        buildBootstrapPlan: vi.fn().mockReturnValue(bootstrapPlan),
      } as unknown as McfCapabilityRegistryApiService,
    );
    expect(subject.supports(request(capabilitySkill, 'analyze-gaps', 'capability-registry', gapInputs()))).toBe(true);
    expect(subject.supports(request(bootstrapSkill, 'build-plan', 'project-bootstrap', bootstrapInputs()))).toBe(true);
    expect(subject.supports(request(capabilitySkill, 'authorize', 'capability-registry', gapInputs()))).toBe(false);
    expect(subject.supports(request(bootstrapSkill, 'build-plan', 'google-cloud', bootstrapInputs()))).toBe(false);
  });

  it('returns a signed evidence receipt for a read-only capability gap report', async () => {
    const service = {
      analyzeGaps: vi.fn().mockReturnValue(gapReport),
      buildBootstrapPlan: vi.fn(),
    };
    const validator = evidence();
    const subject = new McfContextAnalysisAdapter(validator, service as unknown as McfCapabilityRegistryApiService);
    const receipt = await subject.execute(
      request(capabilitySkill, 'analyze-gaps', 'capability-registry', gapInputs()),
    );
    expect(receipt).toMatchObject({
      provider: 'mcf-context',
      operation: 'analyze-gaps',
      resource: 'capability-registry',
      status: 'SUCCEEDED',
      metadata: {
        readOnly: true,
        evidenceOnly: true,
        executionStarted: false,
        externalActionsStarted: false,
        projectId: 'agente-logistica-obras-v1',
        gapReport,
      },
    });
    expect(service.analyzeGaps).toHaveBeenCalledWith(gapInputs());
    expect(service.buildBootstrapPlan).not.toHaveBeenCalled();
  });

  it('returns a plan-only bootstrap receipt without executing any task', async () => {
    const service = {
      analyzeGaps: vi.fn(),
      buildBootstrapPlan: vi.fn().mockReturnValue(bootstrapPlan),
    };
    const subject = new McfContextAnalysisAdapter(evidence(), service as unknown as McfCapabilityRegistryApiService);
    const receipt = await subject.execute(
      request(bootstrapSkill, 'build-plan', 'project-bootstrap', bootstrapInputs()),
    );
    expect(receipt.metadata).toMatchObject({
      readOnly: true,
      evidenceOnly: true,
      executionStarted: false,
      externalActionsStarted: false,
      bootstrapPlan,
    });
    expect(service.buildBootstrapPlan).toHaveBeenCalledWith(bootstrapInputs());
  });

  it('rejects extra input properties and never forwards them to the context service', async () => {
    const service = { analyzeGaps: vi.fn().mockReturnValue(gapReport) };
    const subject = new McfContextAnalysisAdapter(evidence(), service as unknown as McfCapabilityRegistryApiService);
    await expect(subject.execute(
      request(capabilitySkill, 'analyze-gaps', 'capability-registry', { ...gapInputs(), arbitrary_write: true }),
    )).rejects.toMatchObject({ code: 'INVALID_CONTEXT' });
    expect(service.analyzeGaps).not.toHaveBeenCalled();
  });

  it('fails closed when the capability registry is unavailable', async () => {
    const subject = new McfContextAnalysisAdapter(evidence(), {
      analyzeGaps: vi.fn(() => { throw new Error('registry down'); }),
    } as unknown as McfCapabilityRegistryApiService);
    await expect(subject.execute(
      request(capabilitySkill, 'analyze-gaps', 'capability-registry', gapInputs()),
    )).rejects.toMatchObject({ code: 'ADAPTER_FAILURE', statusCode: 503 });
  });
});
