import type { McfSkillDefinition } from '@rsa/contracts';
import { describe, expect, it } from 'vitest';

import { PermissionEngine } from './permission-engine.js';

const REPOSITORY = 'leon337/multiagent-collaboration-framework';

const deploySkill: McfSkillDefinition = {
  skillId: 'MCF-DEPLOY-VALIDATE',
  name: 'Deploy Validate',
  version: '1.0.0',
  purpose: 'verified staging deployment',
  ownerAgents: ['Gabriel'],
  requiredInputs: ['artifact_or_commit', 'target_environment'],
  allowedTools: ['GitHub', 'Render'],
  forbiddenTools: ['public_production_without_gate'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: [],
  requiredEvidence: [],
  acceptanceCriteria: [],
  failureModes: [],
  fallback: 'Mestre',
  handoffTo: 'Mestre',
};

const inputs = {
  artifact_or_commit: 'a'.repeat(40),
  target_environment: 'staging',
  authorizedScope: true,
};

describe('Gate D deploy permissions', () => {
  const permissions = new PermissionEngine();

  it('allows scoped GitHub control-plane deployment to staging', () => {
    expect(() =>
      permissions.assertAllowed(
        deploySkill,
        'Gabriel',
        { provider: 'github', operation: 'deploy-staging', resource: REPOSITORY },
        inputs,
      ),
    ).not.toThrow();
  });

  it('rejects production for deploy-staging even if a human gate flag is present', () => {
    expect(() =>
      permissions.assertAllowed(
        deploySkill,
        'Gabriel',
        { provider: 'github', operation: 'deploy-staging', resource: REPOSITORY },
        { ...inputs, target_environment: 'production', humanGateApproved: true },
      ),
    ).toThrow(/restricted to staging/u);
  });

  it('rejects non-GitHub control plane for deploy-staging', () => {
    expect(() =>
      permissions.assertAllowed(
        deploySkill,
        'Gabriel',
        { provider: 'render', operation: 'deploy-staging', resource: REPOSITORY },
        inputs,
      ),
    ).toThrow(/restricted to MCF-DEPLOY-VALIDATE using GitHub Actions control plane/u);
  });

  it('rejects noncanonical repository resources', () => {
    expect(() =>
      permissions.assertAllowed(
        deploySkill,
        'Gabriel',
        {
          provider: 'github',
          operation: 'deploy-staging',
          resource: 'https://github.com/leon337/multiagent-collaboration-framework',
        },
        inputs,
      ),
    ).toThrow(/canonical owner\/repository resource/u);
  });

  it('requires authorized scope before staging mutation', () => {
    expect(() =>
      permissions.assertAllowed(
        deploySkill,
        'Gabriel',
        { provider: 'github', operation: 'deploy-staging', resource: REPOSITORY },
        { ...inputs, authorizedScope: false },
      ),
    ).toThrow(/SCOPED_WRITE requires inputs.authorizedScope=true/u);
  });
});
