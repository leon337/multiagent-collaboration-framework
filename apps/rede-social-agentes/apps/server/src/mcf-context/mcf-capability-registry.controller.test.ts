import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import type {
  McfCapabilityGapReport,
  McfCapabilityRegistrySnapshot,
  McfProjectBootstrapPlan,
} from '@rsa/contracts';
import { describe, expect, it, vi } from 'vitest';

import {
  McfCapabilityRegistryUnavailableError,
  type McfCapabilityRegistryApiService,
} from './mcf-capability-registry-api.service.js';
import { McfCapabilityRegistryController } from './mcf-capability-registry.controller.js';

const snapshot: McfCapabilityRegistrySnapshot = {
  schema_version: 1,
  retrieved_at: '2026-08-23T08:00:00.000Z',
  project_id: null,
  read_only: true,
  evidence_only: true,
  entries: [],
  sources: [],
};



const gapReport: McfCapabilityGapReport = {
  schema_version: 1,
  analyzed_at: '2026-11-25T18:00:00.000Z',
  project_id: 'agente-logistica-obras-v1',
  read_only: true,
  evidence_only: true,
  summary: { total: 1, ready: 0, missing: 1, blocked: 0, needs_verification: 0 },
  requirements: [{
    capability_id: 'mcf.google.cloud.provision',
    status: 'MISSING',
    gaps: [{
      code: 'CAPABILITY_NOT_REGISTERED',
      blocking: true,
      recommended_action: 'Register capability',
      required_gate: 'CAPABILITY_REGISTRATION_REVIEW',
    }],
    provider_project_id: null,
    mode: null,
    allowed_operations: [],
    source_refs: [],
  }],
};
const bootstrapPlan: McfProjectBootstrapPlan = {
  schema_version: 1,
  generated_at: '2026-11-25T18:00:00.000Z',
  project_id: 'agente-logistica-obras-v1',
  project_name: 'Agente de Logística de Obras',
  objective: 'Entregar V1 validada',
  environment: 'dev',
  read_only: true,
  evidence_only: true,
  execution_started: false,
  summary: { total_tasks: 12, ready: 8, blocked: 3, skipped: 1, requires_human_gates: 3 },
  capability_gaps: gapReport,
  tasks: [],
};
const gapRequest = {
  project_id: 'agente-logistica-obras-v1',
  requirements: [{ capability_id: 'mcf.google.cloud.provision' }],
};
const bootstrapRequest = {
  ...gapRequest,
  project_name: 'Agente de Logística de Obras',
  objective: 'Entregar V1 validada',
  environment: 'dev',
};

describe('McfCapabilityRegistryController', () => {
  it('exposes only the read-only listing shape', () => {
    const listReadOnly = vi.fn().mockReturnValue(snapshot);
    const controller = new McfCapabilityRegistryController({
      listReadOnly,
    } as unknown as McfCapabilityRegistryApiService);

    expect(controller.listReadOnly('triview-workspace-linux')).toBe(snapshot);
    expect(listReadOnly).toHaveBeenCalledWith('triview-workspace-linux');
  });

  it('rejects malformed project identifiers', () => {
    const controller = new McfCapabilityRegistryController({
      listReadOnly: vi.fn(),
    } as unknown as McfCapabilityRegistryApiService);

    for (const value of ['', ' TriView ', 'TriView', '../triview']) {
      expect(() => controller.listReadOnly(value)).toThrow(BadRequestException);
    }
  });


  it('returns a read-only capability gap report from a strict request', () => {
    const analyzeGaps = vi.fn().mockReturnValue(gapReport);
    const controller = new McfCapabilityRegistryController({
      listReadOnly: vi.fn().mockReturnValue(snapshot),
      analyzeGaps,
    } as unknown as McfCapabilityRegistryApiService);
    expect(controller.analyzeGaps(gapRequest)).toBe(gapReport);
    expect(analyzeGaps).toHaveBeenCalledWith(gapRequest);
  });

  it('returns a plan-only bootstrap graph with no execution', () => {
    const buildBootstrapPlan = vi.fn().mockReturnValue(bootstrapPlan);
    const controller = new McfCapabilityRegistryController({
      listReadOnly: vi.fn().mockReturnValue(snapshot),
      buildBootstrapPlan,
    } as unknown as McfCapabilityRegistryApiService);
    expect(controller.buildBootstrapPlan(bootstrapRequest)).toBe(bootstrapPlan);
    expect(buildBootstrapPlan).toHaveBeenCalledWith(bootstrapRequest);
    expect(bootstrapPlan.execution_started).toBe(false);
  });

  it('rejects malformed capability and bootstrap analysis requests', () => {
    const controller = new McfCapabilityRegistryController({
      listReadOnly: vi.fn().mockReturnValue(snapshot),
      analyzeGaps: vi.fn(),
      buildBootstrapPlan: vi.fn(),
    } as unknown as McfCapabilityRegistryApiService);
    expect(() => controller.analyzeGaps({ ...gapRequest, unexpected: true })).toThrow(BadRequestException);
    expect(() => controller.buildBootstrapPlan({ ...bootstrapRequest, environment: 'production' })).toThrow(BadRequestException);
  });

  it('returns controlled unavailable responses for analysis when registry sources are absent', () => {
    const unavailable = () => { throw new McfCapabilityRegistryUnavailableError(); };
    const controller = new McfCapabilityRegistryController({
      listReadOnly: vi.fn().mockReturnValue(snapshot),
      analyzeGaps: unavailable,
      buildBootstrapPlan: unavailable,
    } as unknown as McfCapabilityRegistryApiService);
    expect(() => controller.analyzeGaps(gapRequest)).toThrow(ServiceUnavailableException);
    expect(() => controller.buildBootstrapPlan(bootstrapRequest)).toThrow(ServiceUnavailableException);
  });

  it('returns a controlled unavailable response when sources are not configured', () => {
    const controller = new McfCapabilityRegistryController({
      listReadOnly: () => {
        throw new McfCapabilityRegistryUnavailableError();
      },
    } as unknown as McfCapabilityRegistryApiService);

    expect(() => controller.listReadOnly(undefined)).toThrow(ServiceUnavailableException);
  });
});
