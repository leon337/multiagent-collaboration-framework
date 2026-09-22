import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { McfMissionContract } from '@rsa/contracts';

import { MissionV11ContextGuard } from '../mcf-runtime/mission-v11-context.guard.js';
import { RepositoryProjectArtifactStore } from '../project-artifacts/repository-project-artifact.store.js';
import { IntentAlignmentService } from './intent-alignment.service.js';

describe('canonical MCF v1.1 project intent', () => {
  it('verifies the repository-backed aligned PIP and exact receipt pair', async () => {
    const repositoryRoot = resolve(process.cwd(), '../../../..');
    const store = new RepositoryProjectArtifactStore({
      repositoryRoot,
      schemaDirectory: resolve(repositoryRoot, 'schemas'),
      repository: 'leon337/multiagent-collaboration-framework',
    });
    const alignment = new IntentAlignmentService(store);

    const reference = {
      artifactType: 'PROJECT_INTENT_PACKAGE' as const,
      schemaVersion: '1.0' as const,
      projectId: 'multiagent-collaboration-framework',
      revisionId: 'v1.1-canonical-001',
      path: '.mcf/intent/pip-v1.1-canonical-001.json',
      contentDigest: 'sha256:4469d5f4d2b0f06e0a834a5cb0874e5df4f59a553e711b76040e30fa2e521371',
      repository: 'leon337/multiagent-collaboration-framework',
      commitSha: null,
    };

    const verified = await alignment.verifyAlignmentPair(reference);

    expect(verified.state).toBe('PASS_VERIFIED');
    if (verified.state !== 'PASS_VERIFIED') return;
    expect(verified.alignedPip.artifact).toMatchObject({
      projectId: 'multiagent-collaboration-framework',
      lifecycle: 'ALIGNED',
      methodologyPin: {
        version: '1.1.0',
        immutableRef: 'git:5dc055cb7d402e5774b40b82723a8f008cd00e80',
      },
      alignment: {
        status: 'ALIGNED',
      },
    });
    expect(verified.receipt.artifact).toMatchObject({
      projectId: 'multiagent-collaboration-framework',
      decision: 'PASS',
      humanAuthority: 'LEANDRO',
      confirmationSourceRef: 'MCF-V1.1-DECISION-LEDGER-001#V11-Q20',
    });

    const guard = new MissionV11ContextGuard(store, alignment);
    const contract: McfMissionContract = {
      title: 'Governed production promotion',
      objective:
        'Promote one exact qualified MCF revision through the governed production boundary.',
      expectedOutcome: 'Exact-SHA production health is verified or the promotion fails closed.',
      scope: ['exact-SHA governed production promotion'],
      outOfScope: ['unrelated project changes'],
      acceptanceCriteria: ['production health/version equals the authorized release SHA'],
      riskClass: 'C',
      selectedAgents: ['LÉO'],
      selectedSkills: ['MCF-DEPLOY-VALIDATE'],
      sourceOfTruth: ['leon337/multiagent-collaboration-framework'],
      contractSchemaVersion: '1.1',
      projectId: 'multiagent-collaboration-framework',
      projectEntryMode: 'ADOPT_EXISTING_PROJECT',
      methodologyPin: {
        version: '1.1.0',
        immutableRef: 'git:5dc055cb7d402e5774b40b82723a8f008cd00e80',
      },
      alignedPipRef: reference,
    };

    await expect(guard.validate(contract)).resolves.toMatchObject({
      contractSchemaVersion: '1.1',
      projectId: 'multiagent-collaboration-framework',
      projectEntryMode: 'ADOPT_EXISTING_PROJECT',
      alignedPipRef: reference,
    });
  });
});
