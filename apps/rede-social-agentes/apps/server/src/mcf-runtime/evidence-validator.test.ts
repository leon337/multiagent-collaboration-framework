import { beforeEach, describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';

beforeEach(() => {
  process.env.DATABASE_URL = 'postgresql://rsa:rsa@127.0.0.1:5432/rsa';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

describe('EvidenceValidator', () => {
  it('accepts an untampered signed receipt', () => {
    const validator = new EvidenceValidator();
    const request = {
      provider: 'internal',
      operation: 'create-contract',
      resource: 'mission/test',
    };
    const receipt = validator.createInternalReceipt(request, { missionId: 'mission-1' });

    expect(() => validator.verify(receipt, request)).not.toThrow();
  });

  it('rejects metadata changed after signing', () => {
    const validator = new EvidenceValidator();
    const request = {
      provider: 'internal',
      operation: 'create-contract',
      resource: 'mission/test',
    };
    const receipt = validator.createInternalReceipt(request, { missionId: 'mission-1' });
    const forged = { ...receipt, metadata: { missionId: 'mission-forged' } };

    expect(() => validator.verify(forged, request)).toThrow(/signature is invalid/u);
  });

  it('requires GitHub Actions workflow and commit identifiers', () => {
    const validator = new EvidenceValidator();
    const receipt = validator.createTrustedReceipt({
      provider: 'github-actions',
      operation: 'workflow-result',
      resource: 'leon337/multiagent-collaboration-framework',
      externalId: null,
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: { conclusion: 'success' },
    });

    expect(() =>
      validator.verify(receipt, {
        provider: 'github-actions',
        operation: 'workflow-result',
        resource: 'leon337/multiagent-collaboration-framework',
      }),
    ).toThrow(/requires workflow run id and commit SHA/u);
  });
});
