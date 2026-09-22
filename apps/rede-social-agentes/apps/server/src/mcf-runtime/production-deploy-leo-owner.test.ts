import { describe, expect, it } from 'vitest';

import { PermissionEngine } from './permission-engine.js';
import { SkillRegistryLoader } from './skill-registry.loader.js';

describe('MCF-DEPLOY-VALIDATE production authority compatibility', () => {
  it('keeps existing deployment owners and allows LÉO to own the governed staging validation phase', async () => {
    const skill = await new SkillRegistryLoader().load('MCF-DEPLOY-VALIDATE');

    expect(skill.ownerAgents).toEqual(['Bruno', 'Gabriel', 'LÉO']);

    expect(() =>
      new PermissionEngine().assertAllowed(
        skill,
        'LÉO',
        {
          provider: 'github',
          operation: 'deploy-staging',
          resource: 'leon337/multiagent-collaboration-framework',
        },
        {
          artifact_or_commit: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          target_environment: 'staging',
          authorizedScope: true,
        },
      ),
    ).not.toThrow();
  });
});
