import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { ContextSchemaValidator } from './context-schema.validator.js';

const schemasDirectory = fileURLToPath(
  new URL('../../../../../../schemas/context/', import.meta.url),
);

function validator(filename: string): ContextSchemaValidator {
  return new ContextSchemaValidator(join(schemasDirectory, filename));
}

function registryEntry(): Record<string, unknown> {
  return {
    schema_version: 1,
    project: {
      id: 'multiagent-collaboration-framework',
      lifecycle: 'REGISTERED',
    },
    identity: {
      canonical_repository: 'leon337/multiagent-collaboration-framework',
      aliases: ['MCF'],
    },
    ownership: { project_owner: 'LEANDRO' },
    context: {
      capsule_path: '.mcf/project-capsule.yaml',
      canonical_entrypoints: ['README.md', 'docs/MCF-CURRENT-STATE.md'],
    },
    freshness: {
      operational_state: 'LIVE_REQUIRED',
      project_identity: 'DURABLE',
    },
  };
}

function capsule(): Record<string, unknown> {
  return {
    schema_version: 1,
    project_id: 'multiagent-collaboration-framework',
    purpose: 'Coordinate governed multi-agent work.',
    lifecycle: 'ACTIVE',
    snapshot: {
      current_workstream: 'context-fabric',
      current_status: 'CF0_CF1_IMPLEMENTATION_IN_PROGRESS',
      next_action: 'Implement CF-0 and minimal CF-1',
      blockers: [],
    },
    sources: { current_state: 'docs/MCF-CURRENT-STATE.md' },
    observed_at: '2026-08-23T00:00:00Z',
  };
}

function truthClaim(type = 'IDENTITY', freshness = 'DURABLE'): Record<string, unknown> {
  return {
    claim_key: 'project.id',
    type,
    value: 'multiagent-collaboration-framework',
    owner: 'MCF_PROJECT_REGISTRY',
    source_ref: 'context/projects/multiagent-collaboration-framework.yaml',
    freshness,
    ...(freshness === 'SNAPSHOT' ? { observed_at: '2026-08-23T00:00:00Z' } : {}),
    provenance: [
      {
        source_ref: 'context/projects/multiagent-collaboration-framework.yaml',
        source_revision: 'a'.repeat(40),
      },
    ],
    requires_live_verification: freshness === 'LIVE_REQUIRED',
  };
}

function receipt(): Record<string, unknown> {
  return {
    schema_version: 1,
    receipt_id: 'context-recovery-001',
    project_id: 'multiagent-collaboration-framework',
    recovery_state: 'RECOVERED',
    recovered_at: '2026-08-23T00:00:00Z',
    read_only: true,
    material_action: false,
    sources: [
      {
        role: 'REGISTRY',
        source_ref: 'context/projects/multiagent-collaboration-framework.yaml',
        source_revision: 'a'.repeat(40),
      },
      {
        role: 'CAPSULE',
        source_ref: '.mcf/project-capsule.yaml',
        source_revision: 'a'.repeat(40),
      },
    ],
    claims: [truthClaim()],
    warnings: [],
    evidence_only: true,
  };
}

describe('ContextSchemaValidator', () => {
  it('accepts a minimal Registry entry and rejects a missing stable project id', () => {
    const validate = validator('project-registry-entry.schema.json');
    expect(validate.validate(registryEntry())).toEqual({ valid: true, errors: [] });

    const invalid = registryEntry();
    delete (invalid.project as Record<string, unknown>).id;
    const result = validate.validate(invalid);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ instancePath: '/project' })]),
    );
  });

  it('requires timestamped Capsule snapshots and rejects unsafe project ids', () => {
    const validate = validator('project-capsule.schema.json');
    expect(validate.validate(capsule()).valid).toBe(true);

    const missingObservation = capsule();
    delete missingObservation.observed_at;
    expect(validate.validate(missingObservation).valid).toBe(false);

    const unsafeIdentity = capsule();
    unsafeIdentity.project_id = '../other-project';
    expect(validate.validate(unsafeIdentity).valid).toBe(false);

    for (const unsafePath of ['../outside.yaml', '..\\outside.yaml', 'C:\\outside.yaml']) {
      const unsafeSource = capsule();
      (unsafeSource.sources as Record<string, unknown>).current_state = unsafePath;
      expect(validate.validate(unsafeSource).valid, unsafePath).toBe(false);
    }
  });

  it('accepts only calendar-valid RFC 3339 timestamps', () => {
    const validate = validator('project-capsule.schema.json');

    for (const invalidTimestamp of [
      '2026-08-23',
      '2026-08-23 00:00:00Z',
      '2026-08-23T00:00:00',
      '2026-02-30T00:00:00Z',
    ]) {
      expect(
        validate.validate({ ...capsule(), observed_at: invalidTimestamp }).valid,
        invalidTimestamp,
      ).toBe(false);
    }

    expect(
      validate.validate({ ...capsule(), observed_at: '2024-02-29T23:59:59.123-03:00' }).valid,
    ).toBe(true);
  });

  it('accepts every Context Fabric claim and freshness literal', () => {
    const validate = validator('truth-contract.schema.json');
    const types = ['IDENTITY', 'NORMATIVE', 'OPERATIONAL', 'DERIVED'];
    const freshnessClasses = ['DURABLE', 'SNAPSHOT', 'LIVE_REQUIRED', 'DERIVED'];

    for (const type of types) {
      for (const freshness of freshnessClasses) {
        expect(validate.validate(truthClaim(type, freshness)), `${type}/${freshness}`).toEqual({
          valid: true,
          errors: [],
        });
      }
    }
  });

  it('rejects artifact-only claim literals and inconsistent live-verification flags', () => {
    const validate = validator('truth-contract.schema.json');

    expect(validate.validate(truthClaim('OBSERVED')).valid).toBe(false);
    expect(
      validate.validate({
        ...truthClaim('OPERATIONAL', 'LIVE_REQUIRED'),
        requires_live_verification: false,
      }).valid,
    ).toBe(false);
  });

  it('rejects values that cannot be represented as finite acyclic JSON', () => {
    const validate = validator('truth-contract.schema.json');
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;

    for (const value of [undefined, Number.NaN, 1n, new Date(), cyclic]) {
      expect(validate.validate({ ...truthClaim(), value }).valid).toBe(false);
    }
  });

  it('accepts evidence-only Receipts and rejects truth-owner fields or ambiguous modes', () => {
    const validate = validator('context-recovery-receipt.schema.json');
    expect(validate.validate(receipt())).toEqual({ valid: true, errors: [] });

    expect(validate.validate({ ...receipt(), owner: 'MCF' }).valid).toBe(false);
    expect(validate.validate({ ...receipt(), evidence_only: false }).valid).toBe(false);
    expect(validate.validate({ ...receipt(), read_only: true, material_action: true }).valid).toBe(
      false,
    );

    expect(validate.validate({ ...receipt(), project_id: null }).valid).toBe(false);
    expect(validate.validate({ ...receipt(), sources: [] }).valid).toBe(false);
    expect(validate.validate({ ...receipt(), claims: [] }).valid).toBe(false);

    expect(
      validate.validate({
        ...receipt(),
        recovery_state: 'PARTIAL_RECOVERY',
        read_only: false,
        material_action: true,
      }).valid,
    ).toBe(false);

    const liveSourceWithoutTimestamp = receipt();
    liveSourceWithoutTimestamp.sources = [
      ...(liveSourceWithoutTimestamp.sources as unknown[]),
      {
        role: 'LIVE_VERIFICATION',
        source_ref: 'provider://deployment',
        source_revision: 'live-check-1',
      },
    ];
    expect(validate.validate(liveSourceWithoutTimestamp).valid).toBe(false);
  });

  it('does not mutate inputs and returns stable validation errors', () => {
    const validate = validator('project-registry-entry.schema.json');
    const input = registryEntry();
    (input.identity as Record<string, unknown>).unexpected = true;
    const before = structuredClone(input);

    const first = validate.validate(input);
    const second = validate.validate(input);

    expect(input).toEqual(before);
    expect(first).toEqual(second);
    expect(first.valid).toBe(false);
  });
});
