import { describe, expect, it } from 'vitest';

import {
  LOCAL_AGENT_TEAM_AGENTS,
  assertLocalAgentTeamWithinMission,
  selectLocalAgentTeam,
} from './local-agent-team.router.js';

describe('local agent team router', () => {
  it('uses only canonical MCF identities for full capacity', () => {
    expect(selectLocalAgentTeam('Executar capacidade total com oito agentes')).toEqual([
      ...LOCAL_AGENT_TEAM_AGENTS,
    ]);
  });

  it('routes domain work and adds evaluation when multiple specialists are needed', () => {
    const selected = selectLocalAgentTeam(
      'Validar GitHub webhook com segurança, testes e auditoria.',
    );
    expect(selected).toContain('Gabriel');
    expect(selected).toContain('Ricardo');
    expect(selected).toContain('Renato');
    expect(selected).toContain('Emily');
    expect(selected).toContain('Beatriz');
    expect(selected).not.toContain('Bruno');
  });

  it('fails closed when a routed worker is outside the mission contract', () => {
    expect(() =>
      assertLocalAgentTeamWithinMission('github webhook segurança', ['Mestre', 'Gabriel']),
    ).toThrow(/not selected by mission contract/i);
  });
});
