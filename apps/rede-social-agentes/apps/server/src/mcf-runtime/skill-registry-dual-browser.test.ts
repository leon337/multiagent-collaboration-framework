import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseMcfSkillRegistry } from './skill-registry.loader.js';

describe('MCF-OPERATE-DUAL-BROWSER registry contract', () => {
  it('loads the canonical executable skill contract', async () => {
    const registryPath = resolve(process.cwd(), '../../../../skills/registry.yaml');
    const content = await readFile(registryPath, 'utf8');
    const skills = parseMcfSkillRegistry(content);

    expect(skills.find((skill) => skill.skillId === 'MCF-OPERATE-DUAL-BROWSER')).toMatchObject({
      ownerAgents: ['Mestre'],
      permissionProfile: 'SCOPED_WRITE',
      requiredInputs: ['interaction_goal', 'target_surface', 'authorizedScope'],
      requiredEvidence: [
        'target_instance',
        'interaction_policy',
        'actions_performed',
        'capture_evidence',
        'privacy_disposition',
        'human_gate_state',
      ],
      handoffTo: 'Beatriz',
    });
  });
});
