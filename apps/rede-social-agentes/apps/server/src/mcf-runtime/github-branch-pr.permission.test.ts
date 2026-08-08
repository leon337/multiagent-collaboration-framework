import { describe, expect, it } from 'vitest';

import type { McfSkillDefinition } from '@rsa/contracts';

import { McfPermissionDeniedError } from './mcf-runtime.errors.js';
import { PermissionEngine } from './permission-engine.js';

const skill: McfSkillDefinition = {
  skillId: 'MCF-GIT-PR-RELEASE',
  name: 'Git PR Release',
  version: '1.0.0',
  purpose: 'controlled GitHub release preparation',
  ownerAgents: ['Gabriel'],
  requiredInputs: [],
  allowedTools: ['github'],
  forbiddenTools: ['force-push', 'direct-main-write'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: [],
  requiredEvidence: [],
  acceptanceCriteria: [],
  failureModes: [],
  fallback: 'Mestre',
  handoffTo: 'Mestre',
};

const tool = {
  provider: 'github',
  operation: 'create-branch-pr',
  resource: 'leon337/multiagent-collaboration-framework',
};

function inputs(overrides: Record<string, unknown> = {}) {
  return {
    authorizedScope: true,
    branch_ref: 'feat/mcf-c1-test',
    ...overrides,
  };
}

describe('PermissionEngine create-branch-pr', () => {
  const permissions = new PermissionEngine();

  it('allows only the scoped GitHub release skill with authorizedScope', () => {
    expect(() => permissions.assertAllowed(skill, 'Gabriel', tool, inputs())).not.toThrow();
  });

  it('rejects missing authorizedScope', () => {
    expect(() =>
      permissions.assertAllowed(skill, 'Gabriel', tool, { branch_ref: 'feat/mcf-c1-test' }),
    ).toThrow(McfPermissionDeniedError);
  });

  it('rejects main and master as branch_ref', () => {
    expect(() =>
      permissions.assertAllowed(skill, 'Gabriel', tool, inputs({ branch_ref: 'main' })),
    ).toThrow(/main or master/u);
    expect(() =>
      permissions.assertAllowed(skill, 'Gabriel', tool, inputs({ branch_ref: 'master' })),
    ).toThrow(/main or master/u);
  });

  it('rejects the operation for another skill even with SCOPED_WRITE', () => {
    expect(() =>
      permissions.assertAllowed(
        { ...skill, skillId: 'MCF-IMPLEMENT-CHANGE' },
        'Gabriel',
        tool,
        inputs(),
      ),
    ).toThrow(/restricted to MCF-GIT-PR-RELEASE/u);
  });

  it('rejects non-canonical repository resources', () => {
    expect(() =>
      permissions.assertAllowed(
        skill,
        'Gabriel',
        {
          ...tool,
          resource: 'https://token@github.com/leon337/multiagent-collaboration-framework',
        },
        inputs(),
      ),
    ).toThrow(McfPermissionDeniedError);
  });
});
