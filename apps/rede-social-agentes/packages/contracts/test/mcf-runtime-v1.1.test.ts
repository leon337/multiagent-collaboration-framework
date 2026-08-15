import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { Ajv2020, type AnySchema, type ValidateFunction } from 'ajv/dist/2020.js';
import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  IntentAlignmentReceiptV1,
  McfCheckpointV11Extension,
  McfMissionContract,
  McfMissionContractV11Extension,
  McfProjectEntryMode,
  McfResumeRoute,
  McfStandingAuthorization,
  ProjectIntentPackageV1,
  ProjectRealityReportV1,
} from '../src/mcf-runtime.js';

const schemasDirectory = fileURLToPath(new URL('../../../../../schemas/', import.meta.url));
const fixturesDirectory = fileURLToPath(
  new URL('../../../../../schemas/fixtures/v1.1/', import.meta.url),
);

function readJson<T = unknown>(directory: string, filename: string): T {
  return JSON.parse(readFileSync(`${directory}${filename}`, 'utf8')) as T;
}

function cloneFixture(filename: string): Record<string, unknown> {
  return structuredClone(readJson(fixturesDirectory, filename)) as Record<string, unknown>;
}

function createValidator(schemaFilename: string): ValidateFunction {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  ajv.addFormat('date-time', {
    type: 'string',
    validate: (value: string) => !Number.isNaN(Date.parse(value)),
  });
  ajv.addSchema(readJson<AnySchema>(schemasDirectory, 'mcf-artifact-ref.schema.json'));
  return ajv.compile(readJson<AnySchema>(schemasDirectory, schemaFilename));
}

function expectValid(validator: ValidateFunction, value: unknown): void {
  expect(validator(value), JSON.stringify(validator.errors, null, 2)).toBe(true);
}

describe('MCF v1.1 TypeScript contracts', () => {
  it('keeps the legacy v1.0 Mission Contract shape valid', () => {
    const legacyContract: McfMissionContract = {
      title: 'Legacy mission contract',
      objective: 'Prove the original required fields remain sufficient.',
      expectedOutcome: 'The legacy contract compiles without v1.1 metadata.',
      scope: ['contracts'],
      outOfScope: ['runtime behavior'],
      acceptanceCriteria: ['TypeScript compilation passes'],
      riskClass: 'A',
      selectedAgents: ['CODEX_LOCAL'],
      selectedSkills: ['MCF-RUN-TESTS'],
      sourceOfTruth: ['v1.0 contract'],
    };

    expect(legacyContract).not.toHaveProperty('contractSchemaVersion');
  });

  it('exposes additive v1.1 mission metadata and project routing types', () => {
    const standingAuthorization: McfStandingAuthorization = {
      authorizationId: 'auth-001',
      projectId: 'mcf-v1.1',
      grantedBy: 'LEANDRO',
      grantedAt: '2026-08-15T12:00:00Z',
      actionClasses: ['LOCAL_CODE_CHANGE'],
      environments: ['LOCAL'],
      maximumCost: null,
      reversibleOnly: true,
      exclusions: ['MERGE_MAIN'],
      evidenceRequirements: ['TEST_RESULTS'],
      sourceDecisionRef: 'MCF-V1.1-IMPLEMENTATION-AUTHORIZATION-001',
      status: 'ACTIVE',
    };
    const extension: McfMissionContractV11Extension = {
      contractSchemaVersion: '1.1',
      projectId: 'mcf-v1.1',
      projectEntryMode: 'RESUME_MCF_PROJECT',
      standingAuthorizations: [standingAuthorization],
    };
    const checkpointExtension: McfCheckpointV11Extension = {
      schemaVersion: '1.1',
      resumeRouteHint: 'RECONCILE',
      transferability: 'BLOCKED_LOCAL_ONLY_STATE',
    };

    expect(extension.contractSchemaVersion).toBe('1.1');
    expect(checkpointExtension.resumeRouteHint).toBe('RECONCILE');
    expectTypeOf<McfProjectEntryMode>().toEqualTypeOf<
      'NEW_PROJECT' | 'ADOPT_EXISTING_PROJECT' | 'RESUME_MCF_PROJECT'
    >();
    expectTypeOf<McfResumeRoute>().toEqualTypeOf<
      'FAST_RESUME' | 'RECONCILE' | 'RECOVER_MCF_PROJECT'
    >();
    expectTypeOf<ProjectIntentPackageV1['schemaVersion']>().toEqualTypeOf<'1.0'>();
    expectTypeOf<ProjectRealityReportV1['schemaVersion']>().toEqualTypeOf<'1.0'>();
    expectTypeOf<IntentAlignmentReceiptV1['humanAuthority']>().toEqualTypeOf<'LEANDRO'>();
  });
});

describe('MCF v1.1 JSON schemas', () => {
  it('validates PIP v1 and rejects machine inference as the sole human-decision provenance', () => {
    const validate = createValidator('project-intent-package-v1.schema.json');
    const valid = readJson(fixturesDirectory, 'project-intent-package.valid.json');
    expectValid(validate, valid);

    const invalid = cloneFixture('project-intent-package.valid.json');
    const humanDecisions = invalid.humanDecisions as Array<Record<string, unknown>>;
    humanDecisions[0]!.provenance = [
      {
        type: 'MACHINE_INFERENCE',
        sourceRef: 'machine:guess',
        capturedAt: '2026-08-15T12:00:00Z',
        actor: 'CODEX_LOCAL',
      },
    ];
    expect(validate(invalid)).toBe(false);
  });

  it('rejects an intent dimension with empty provenance', () => {
    const validate = createValidator('project-intent-package-v1.schema.json');
    const invalid = cloneFixture('project-intent-package.valid.json');
    const dimensions = invalid.dimensions as Record<string, Record<string, unknown>>;
    dimensions.PROBLEM!.provenance = [];

    expect(validate(invalid)).toBe(false);
  });

  it('rejects a technical delegation with empty provenance', () => {
    const validate = createValidator('project-intent-package-v1.schema.json');
    const invalid = cloneFixture('project-intent-package.valid.json');
    invalid.technicalDelegations = [
      {
        delegationId: 'delegation-001',
        domain: 'schema implementation',
        scope: 'Choose compatible validation tooling.',
        provenance: [],
      },
    ];

    expect(validate(invalid)).toBe(false);
  });

  it('rejects an assumption with empty provenance', () => {
    const validate = createValidator('project-intent-package-v1.schema.json');
    const invalid = cloneFixture('project-intent-package.valid.json');
    invalid.assumptions = [
      {
        id: 'assumption-001',
        statement: 'The repository validation tool remains available.',
        provenance: [],
      },
    ];

    expect(validate(invalid)).toBe(false);
  });

  it('validates PRR v1 and rejects a FACT without evidence', () => {
    const validate = createValidator('project-reality-report-v1.schema.json');
    expectValid(validate, readJson(fixturesDirectory, 'project-reality-report.valid.json'));

    const invalid = cloneFixture('project-reality-report.valid.json');
    const observations = invalid.observations as Array<Record<string, unknown>>;
    observations[0]!.evidenceRefs = [];
    expect(validate(invalid)).toBe(false);
  });

  it('rejects a PRR observation with empty provenance', () => {
    const validate = createValidator('project-reality-report-v1.schema.json');
    const invalid = cloneFixture('project-reality-report.valid.json');
    const observations = invalid.observations as Array<Record<string, unknown>>;
    observations[0]!.provenance = [];

    expect(validate(invalid)).toBe(false);
  });

  it('validates an alignment receipt bound to a PIP artifact reference', () => {
    const validate = createValidator('intent-alignment-receipt-v1.schema.json');
    expectValid(validate, readJson(fixturesDirectory, 'intent-alignment-receipt.valid.json'));

    const invalid = cloneFixture('intent-alignment-receipt.valid.json');
    (invalid.pipRef as Record<string, unknown>).artifactType = 'PROJECT_REALITY_REPORT';
    expect(validate(invalid)).toBe(false);
  });

  it('validates bounded standing authorization and rejects an empty action scope', () => {
    const validate = createValidator('mcf-standing-authorization.schema.json');
    expectValid(validate, readJson(fixturesDirectory, 'standing-authorization.valid.json'));

    const invalid = cloneFixture('standing-authorization.valid.json');
    invalid.actionClasses = [];
    expect(validate(invalid)).toBe(false);
  });

  it('accepts both a legacy checkpoint and the additive v1.1 extension', () => {
    const validate = createValidator('caf-flow-checkpoint.schema.json');
    expectValid(validate, readJson(fixturesDirectory, 'caf-checkpoint-legacy.valid.json'));
    expectValid(validate, readJson(fixturesDirectory, 'caf-checkpoint-v1.1.valid.json'));

    const invalid = cloneFixture('caf-checkpoint-v1.1.valid.json');
    (invalid.repositoryState as Record<string, unknown>).volatile = false;
    expect(validate(invalid)).toBe(false);
  });
});
