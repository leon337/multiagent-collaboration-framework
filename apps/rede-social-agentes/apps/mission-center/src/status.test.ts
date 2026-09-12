import { describe, expect, it } from 'vitest';

import { parseMissionStatus } from './status.js';

const valid = {
  schemaVersion: 1,
  missionId: 'MCF-GAMA-FUND-2026-001',
  title: 'Gama Fund',
  state: 'IN_PROGRESS',
  deadline: '2026-09-28',
  humanAuthority: 'LEANDRO',
  orchestrator: 'MESTRE',
  currentStage: { id: 'G3', label: 'Gemini', status: 'IN_PROGRESS' },
  stages: [
    {
      id: 'G0',
      label: 'Readiness',
      status: 'ENTREGUE',
      evidence: [{ type: 'commit', value: 'abc123' }],
    },
    { id: 'G3', label: 'Gemini', status: 'IN_PROGRESS', evidence: [] },
  ],
  lastAction: {
    at: '2026-09-12T18:00:00Z',
    executor: 'MESTRE',
    summary: 'Implemented provider',
    evidence: [{ type: 'commit', value: 'def456' }],
  },
  blockers: [],
  nextStep: 'Run full suite',
  humanGates: { g3: 'AUTHORIZED', externalSubmission: 'NOT_AUTHORIZED' },
  updatedAt: '2026-09-12T18:00:00Z',
};

describe('parseMissionStatus', () => {
  it('accepts a valid mission projection', () => {
    expect(parseMissionStatus(valid)).toEqual(valid);
  });

  it('rejects delivered stages without attributable evidence', () => {
    const invalid = structuredClone(valid);
    invalid.stages[0].evidence = [];

    expect(() => parseMissionStatus(invalid)).toThrow(/ENTREGUE.*evidence/u);
  });

  it('rejects malformed stage identifiers and duplicate stage ids', () => {
    const malformed = structuredClone(valid);
    malformed.stages[1].id = 'bad';
    expect(() => parseMissionStatus(malformed)).toThrow(/stage id/u);

    const duplicate = structuredClone(valid);
    duplicate.stages[1].id = 'G0';
    expect(() => parseMissionStatus(duplicate)).toThrow(/duplicate stage/u);
  });

  it('rejects a last real action without evidence', () => {
    const invalid = structuredClone(valid);
    invalid.lastAction.evidence = [];

    expect(() => parseMissionStatus(invalid)).toThrow(/lastAction.*evidence/u);
  });
});
