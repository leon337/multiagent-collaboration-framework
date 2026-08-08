import { describe, expect, it } from 'vitest';

import type { McfSkillDefinition } from '@rsa/contracts';

import { McfPermissionDeniedError } from './mcf-runtime.errors.js';
import { PermissionEngine } from './permission-engine.js';

const skill: McfSkillDefinition = {
  skillId: 'MCF-GIT-PR-RELEASE',
  name: 'Git PR Release',
  version: '1.0.0',
  purpose: 'controlled GitHub PR collaboration',
  ownerAgents: ['Gabriel'],
  requiredInputs: [],
  allowedTools: ['github'],
  forbiddenTools: ['force-push', 'merge-with-red-ci'],
  permissionProfile: 'SCOPED_WRITE',
  executionSteps: [],
  requiredEvidence: [],
  acceptanceCriteria: [],
  failureModes: [],
  fallback: 'Mestre',
  handoffTo: 'Mestre',
};

const resource = 'leon337/multiagent-collaboration-framework';

function tool(operation: string) {
  return { provider: 'github', operation, resource };
}

function inputs(overrides: Record<string, unknown> = {}) {
  return {
    authorizedScope: true,
    repository: resource,
    pull_request_number: 79,
    expected_head_sha: '2'.repeat(40),
    idempotency_key: 'mcf-c2-idempotency-0001',
    ...overrides,
  };
}

describe('PermissionEngine PR collaboration writes', () => {
  const permissions = new PermissionEngine();

  for (const operation of ['comment-pr', 'review-pr-comment', 'update-pr-text-metadata']) {
    it(`allows ${operation} only inside the scoped release skill`, () => {
      expect(() => permissions.assertAllowed(skill, 'Gabriel', tool(operation), inputs())).not.toThrow();
      expect(() =>
        permissions.assertAllowed(
          { ...skill, skillId: 'MCF-IMPLEMENT-CHANGE' },
          'Gabriel',
          tool(operation),
          inputs(),
        ),
      ).toThrow(/restricted to MCF-GIT-PR-RELEASE/u);
    });
  }

  it('requires authorizedScope for persistent collaboration writes', () => {
    const value = {
      repository: resource,
      pull_request_number: 79,
      expected_head_sha: '2'.repeat(40),
      idempotency_key: 'mcf-c2-idempotency-0001',
    };
    expect(() => permissions.assertAllowed(skill, 'Gabriel', tool('comment-pr'), value)).toThrow(
      McfPermissionDeniedError,
    );
  });

  it('requires a canonical repository resource', () => {
    expect(() =>
      permissions.assertAllowed(
        skill,
        'Gabriel',
        {
          provider: 'github',
          operation: 'comment-pr',
          resource: 'https://github.com/leon337/multiagent-collaboration-framework',
        },
        inputs(),
      ),
    ).toThrow(/canonical owner\/repository/u);
  });

  for (const forbidden of [
    'state',
    'base',
    'base_branch',
    'maintainer_can_modify',
    'merge',
    'merge_method',
    'review_event',
    'event',
  ]) {
    it(`rejects privilege escalation input ${forbidden}`, () => {
      expect(() =>
        permissions.assertAllowed(
          skill,
          'Gabriel',
          tool('update-pr-text-metadata'),
          inputs({ [forbidden]: 'forbidden' }),
        ),
      ).toThrow(/forbidden for controlled PR collaboration writes/u);
    });
  }
});
