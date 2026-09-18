import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseMcfSkillRegistry } from './skill-registry.loader.js';

describe('MCF-EXECUTE-LOCAL-TEAM registry contract', () => {
  it('loads the local team skill from the canonical registry', async () => {
    const registryPath = resolve(process.cwd(), '../../../../skills/registry.yaml');
    const skills = parseMcfSkillRegistry(await readFile(registryPath, 'utf8'));
    const skill = skills.find((candidate) => candidate.skillId === 'MCF-EXECUTE-LOCAL-TEAM');

    expect(skill).toMatchObject({
      version: '0.1.0',
      ownerAgents: ['Mestre'],
      permissionProfile: 'READ_AND_PROPOSE',
      allowedTools: ['local-agent-runtime'],
      handoffTo: 'Mestre',
    });
    expect(skill?.requiredInputs).toEqual(['objective', 'mission_selected_agents']);
  });
});
