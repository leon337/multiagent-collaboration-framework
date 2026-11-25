import { describe, expect, it } from 'vitest';

import type {
  McfCapabilityGapReport,
  McfProjectBootstrapRequest,
} from '@rsa/contracts';

import { McfProjectBootstrapPlanner } from './project-bootstrap-planner.js';

const now = '2026-11-25T18:00:00.000Z';
function report(
  projectId: string,
  capabilityId: string,
  status: 'READY' | 'MISSING' | 'BLOCKED' | 'NEEDS_VERIFICATION',
): McfCapabilityGapReport {
  return {
    schema_version: 1,
    analyzed_at: now,
    project_id: projectId,
    read_only: true,
    evidence_only: true,
    summary: {
      total: 1,
      ready: status === 'READY' ? 1 : 0,
      missing: status === 'MISSING' ? 1 : 0,
      blocked: status === 'BLOCKED' ? 1 : 0,
      needs_verification: status === 'NEEDS_VERIFICATION' ? 1 : 0,
    },
    requirements: [{
      capability_id: capabilityId,
      status,
      gaps: [],
      provider_project_id: status === 'READY' ? 'multiagent-collaboration-framework' : null,
      mode: status === 'READY' ? 'BOUNDED_WRITE' : null,
      allowed_operations: status === 'READY' ? ['project.create'] : [],
      source_refs: [],
    }],
  };
}
function request(overrides: Partial<McfProjectBootstrapRequest> = {}): McfProjectBootstrapRequest {
  return {
    project_id: 'agente-logistica-obras-v1',
    project_name: 'Agente de Logística de Obras',
    objective: 'Entregar V1 validada com integrações homologadas',
    environment: 'dev',
    requirements: [{ capability_id: 'mcf.context.recovery.read' }],
    paid_services_required: false,
    allow_paid_services: false,
    external_actions_authorized: false,
    production_requested: false,
    production_authorized: false,
    ...overrides,
  };
}
function getTask(plan: ReturnType<McfProjectBootstrapPlanner['plan']>, id: string) {
  return plan.tasks.find((task) => task.id === id);
}

describe('McfProjectBootstrapPlanner', () => {
  const planner = new McfProjectBootstrapPlanner();

  it('creates a deterministic plan-only graph and skips unrequested cloud provisioning and production', () => {
    const input = request();
    const plan = planner.plan(
      input,
      report(input.project_id, 'mcf.context.recovery.read', 'READY'),
      now,
    );
    expect(plan).toMatchObject({
      read_only: true,
      evidence_only: true,
      execution_started: false,
      project_id: input.project_id,
      summary: { total_tasks: 12, skipped: 2 },
    });
    expect(getTask(plan, 'bootstrap-05-provisioning')?.status).toBe('SKIPPED');
    expect(getTask(plan, 'bootstrap-11-deployment')?.status).toBe('SKIPPED');
    expect(getTask(plan, 'bootstrap-12-closeout')?.status).toBe('READY');
  });

  it('blocks provisioning when the capability itself is missing', () => {
    const input = request({
      requirements: [{ capability_id: 'mcf.google.cloud.provision' }],
      external_actions_authorized: true,
    });
    const plan = planner.plan(
      input,
      report(input.project_id, 'mcf.google.cloud.provision', 'MISSING'),
      now,
    );
    expect(getTask(plan, 'bootstrap-05-provisioning')).toMatchObject({
      status: 'BLOCKED',
      gate: 'GOOGLE_CLOUD_PROVISION_CAPABILITY_NOT_READY',
    });
    expect(getTask(plan, 'bootstrap-09-end-to-end')?.status).toBe('BLOCKED');
    expect(getTask(plan, 'bootstrap-10-release')?.status).toBe('BLOCKED');
    expect(getTask(plan, 'bootstrap-12-closeout')?.status).toBe('BLOCKED');
  });

  it('requires explicit external-action authorization before provisioning', () => {
    const input = request({
      requirements: [{ capability_id: 'mcf.google.cloud.provision' }],
      external_actions_authorized: false,
    });
    const plan = planner.plan(
      input,
      report(input.project_id, 'mcf.google.cloud.provision', 'READY'),
      now,
    );
    expect(getTask(plan, 'bootstrap-05-provisioning')).toMatchObject({
      status: 'BLOCKED',
      gate: 'EXTERNAL_ACTION_AUTHORIZATION',
    });
  });

  it('blocks paid-service prerequisites unless billing is explicitly allowed', () => {
    const input = request({
      requirements: [{ capability_id: 'mcf.google.cloud.provision' }],
      external_actions_authorized: true,
      paid_services_required: true,
      allow_paid_services: false,
    });
    const plan = planner.plan(
      input,
      report(input.project_id, 'mcf.google.cloud.provision', 'READY'),
      now,
    );
    expect(getTask(plan, 'bootstrap-05-provisioning')).toMatchObject({
      status: 'BLOCKED',
      gate: 'BILLING_APPROVAL_REQUIRED',
    });
  });

  it('keeps production deployment blocked until explicit authorization and release readiness', () => {
    const input = request({
      production_requested: true,
      production_authorized: false,
    });
    const plan = planner.plan(
      input,
      report(input.project_id, 'mcf.context.recovery.read', 'READY'),
      now,
    );
    expect(getTask(plan, 'bootstrap-11-deployment')).toMatchObject({
      status: 'BLOCKED',
      gate: 'PRODUCTION_AUTHORIZATION',
    });
    expect(plan.summary.requires_human_gates).toBeGreaterThan(0);
  });

  it('rejects capability reports from a different project', () => {
    const input = request();
    expect(() => planner.plan(
      input,
      report('another-project', 'mcf.context.recovery.read', 'READY'),
      now,
    )).toThrow('PROJECT_BOOTSTRAP_CAPABILITY_SCOPE_MISMATCH');
  });
});
