import { createHash } from 'node:crypto';

import type { McfSkillDefinition } from '@rsa/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { EvidenceValidator } from './evidence-validator.js';

beforeEach(() => {
  process.env.DATABASE_URL = 'postgres://127.0.0.1:5432/mcf';
  process.env.MCF_RECEIPT_SECRET = 'test-only-mcf-receipt-secret-0000000001';
});

const astryxSkill: McfSkillDefinition = {
  skillId: 'MCF-ASTRYX-COMPONENT-DISCOVERY',
  name: 'Astryx component discovery',
  version: '0.1.0',
  purpose: 'Read the official Astryx component catalog and documentation.',
  ownerAgents: ['Mestre'],
  requiredInputs: [],
  allowedTools: ['mcf-astryx-cli'],
  forbiddenTools: ['write', 'delete', 'publish', 'deploy'],
  permissionProfile: 'READ_ONLY',
  executionSteps: ['list_or_read_components'],
  requiredEvidence: ['signed_json_output', 'package_versions', 'read_only_provenance'],
  acceptanceCriteria: ['receipt_semantically_valid'],
  failureModes: ['invalid_cli_output'],
  fallback: 'Return to the approved design workflow.',
  handoffTo: 'Mestre',
};

function astryxReceiptMetadata(cliCopy = 'project') {
  const stdout = JSON.stringify({
    apiVersion: 1,
    type: 'component.list',
    data: { components: { actions: [] } },
    meta: { answeredBy: { cli: '0.7.2', core: '0.7.2', copy: cliCopy } },
  });
  const workspace = '/tmp/astryx-workspace';
  const cliPackageRoot = `${workspace}/node_modules/@astryxdesign/cli`;
  const corePackageRoot = `${workspace}/node_modules/@astryxdesign/core`;
  const cliBinary = `${cliPackageRoot}/clients/cli/bin/astryx.mjs`;
  return {
    adapterId: 'mcf-astryx-cli-readonly-v1',
    cliPackage: '@astryxdesign/cli',
    corePackage: '@astryxdesign/core',
    cliVersion: '0.7.2',
    coreVersion: '0.7.2',
    cliCopy,
    cliPackageRoot,
    corePackageRoot,
    cliBinary,
    readOnly: true,
    command: [process.execPath, cliBinary, '--json', 'component', '--list'],
    workspace,
    stdout,
    stderr: '',
    exitCode: 0,
    outputBytes: Buffer.byteLength(stdout, 'utf8'),
    outputDigest: createHash('sha256').update(stdout).digest('hex'),
  };
}

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

  it('validates Astryx CLI package provenance and the signed JSON output', () => {
    const validator = new EvidenceValidator();
    const expected = {
      provider: 'mcf-astryx-cli',
      operation: 'list-components',
      resource: 'astryx-design-system',
    };
    const receipt = validator.createTrustedReceipt({
      ...expected,
      externalId: null,
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: astryxReceiptMetadata(),
    });

    expect(() => validator.verifyForSkill(receipt, expected, astryxSkill, {})).not.toThrow();
  });

  it('rejects a CLI binary outside the project-local package', () => {
    const validator = new EvidenceValidator();
    const expected = {
      provider: 'mcf-astryx-cli',
      operation: 'list-components',
      resource: 'astryx-design-system',
    };
    const metadata = astryxReceiptMetadata();
    metadata.cliBinary = '/usr/local/bin/astryx';
    metadata.command[1] = metadata.cliBinary;
    const receipt = validator.createTrustedReceipt({
      ...expected,
      externalId: null,
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata,
    });

    expect(() => validator.verifyForSkill(receipt, expected, astryxSkill, {})).toThrow(
      /workspace-local CLI outside the runtime checkout/u,
    );
  });

  it('rejects a Core package outside the isolated project workspace', () => {
    const validator = new EvidenceValidator();
    const expected = {
      provider: 'mcf-astryx-cli',
      operation: 'list-components',
      resource: 'astryx-design-system',
    };
    const metadata = astryxReceiptMetadata();
    metadata.corePackageRoot = '/opt/astryx-core';
    const receipt = validator.createTrustedReceipt({
      ...expected,
      externalId: null,
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata,
    });

    expect(() => validator.verifyForSkill(receipt, expected, astryxSkill, {})).toThrow(
      /workspace-local CLI and Core packages/u,
    );
  });

  it('rejects Astryx receipts answered by a global or fallback CLI copy', () => {
    const validator = new EvidenceValidator();
    const expected = {
      provider: 'mcf-astryx-cli',
      operation: 'list-components',
      resource: 'astryx-design-system',
    };
    const receipt = validator.createTrustedReceipt({
      ...expected,
      externalId: null,
      commitSha: null,
      status: 'SUCCEEDED',
      observedAt: new Date().toISOString(),
      metadata: astryxReceiptMetadata('global'),
    });

    expect(() => validator.verifyForSkill(receipt, expected, astryxSkill, {})).toThrow(
      /project-local CLI and Core versions/u,
    );
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
