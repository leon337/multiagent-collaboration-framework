import { describe, expect, it } from 'vitest';

import {
  parseMcfCapabilityGapRequest,
  parseMcfProjectBootstrapRequest,
} from './mcf-capability-gap.validation.js';

const base = {
  project_id: 'agente-logistica-obras-v1',
  requirements: [{
    capability_id: 'mcf.google.cloud.provision',
    required_operations: ['project.create', 'maps.enable'],
    environment: 'dev',
    resource: 'google-cloud/projects/mcf-obras-logistica-v1',
    mode: 'BOUNDED_WRITE',
    require_live_verification: true,
    max_verification_age_seconds: 300,
  }],
  live_verifications: [{
    capability_id: 'mcf.google.cloud.provision',
    connection_state: 'CONNECTED',
    runtime_state: 'ACTIVE',
    verification_state: 'VERIFIED',
    observed_at: '2026-11-25T17:59:30.000Z',
    source_ref: 'receipt://google-bridge/live-check-001',
  }],
};
const bootstrap = {
  ...base,
  project_name: 'Agente de Logística de Obras',
  objective: 'Entregar uma V1 validada',
  environment: 'dev',
  paid_services_required: false,
  allow_paid_services: false,
  external_actions_authorized: false,
  production_requested: false,
  production_authorized: false,
};

describe('MCF capability analysis input validation', () => {
  it('parses and normalizes a strict capability gap request', () => {
    expect(parseMcfCapabilityGapRequest(base)).toEqual(base);
  });

  it('rejects unknown fields, duplicate requirements and arbitrary operation names', () => {
    expect(() => parseMcfCapabilityGapRequest({ ...base, arbitrary: true })).toThrow(
      'MCF_CAPABILITY_ANALYSIS_INPUT_INVALID',
    );
    expect(() => parseMcfCapabilityGapRequest({
      ...base,
      requirements: [base.requirements[0], base.requirements[0]],
    })).toThrow('MCF_CAPABILITY_ANALYSIS_INPUT_INVALID');
    expect(() => parseMcfCapabilityGapRequest({
      ...base,
      requirements: [{ capability_id: 'mcf.google.cloud.provision', required_operations: ['billing.link!'] }],
    })).toThrow('MCF_CAPABILITY_ANALYSIS_INPUT_INVALID');
  });

  it('rejects live verification for capabilities outside the requirement set', () => {
    expect(() => parseMcfCapabilityGapRequest({
      ...base,
      live_verifications: [{ ...base.live_verifications[0], capability_id: 'other.capability' }],
    })).toThrow('MCF_CAPABILITY_ANALYSIS_INPUT_INVALID');
  });

  it('parses plan-only bootstrap requests and defaults every authorization to false', () => {
    const parsed = parseMcfProjectBootstrapRequest({
      project_id: 'agente-logistica-obras-v1',
      requirements: [{ capability_id: 'mcf.context.recovery.read' }],
      project_name: 'Agente de Logística de Obras',
      objective: 'Entregar V1',
      environment: 'dev',
    });
    expect(parsed).toMatchObject({
      paid_services_required: false,
      allow_paid_services: false,
      external_actions_authorized: false,
      production_requested: false,
      production_authorized: false,
    });
  });

  it('rejects invalid environments and non-boolean authorization flags', () => {
    expect(() => parseMcfProjectBootstrapRequest({ ...bootstrap, environment: 'production' })).toThrow(
      'MCF_CAPABILITY_ANALYSIS_INPUT_INVALID',
    );
    expect(() => parseMcfProjectBootstrapRequest({ ...bootstrap, production_authorized: 'yes' })).toThrow(
      'MCF_CAPABILITY_ANALYSIS_INPUT_INVALID',
    );
  });
});
