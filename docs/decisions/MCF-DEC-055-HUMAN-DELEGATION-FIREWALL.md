# MCF-DEC-055 — Human Delegation Firewall

```yaml
decision_id: MCF-DEC-055
status: APPROVED_ACTIVE_ON_MERGE
date: 2026-08-04
authority_human: Leandro
authority_operational: Leo
coordinator: Mestre
scope: all_mcf_missions
```

## 1. Contexto

Durante a limpeza e recuperação do staging do MissionRuntime, Leandro foi utilizado como operador técnico em várias etapas de Render, GitHub, PostgreSQL e terminal. Parte dessas ações era realmente pessoal ou sensível, mas parte poderia ter sido automatizada ou reduzida.

O incidente demonstrou que a existência de agentes, skills e ferramentas não impede por si só a transferência precoce de trabalho ao humano.

## 2. Decisão

O MCF adota o **Human Delegation Firewall — HDF**.

```text
TEAM_FIRST
→ TENTATIVA REAL
→ EVIDÊNCIA DA LIMITAÇÃO
→ FALLBACK ESGOTADO
→ GATE DE LÉO
→ UMA AÇÃO HUMANA
→ RETORNO IMEDIATO À EQUIPE
```

Leandro permanece autoridade final e deixa de ser considerado operador técnico padrão.

## 3. Regras obrigatórias

1. `agentId: Leandro` é inválido no runtime.
2. A equipe deve tentar executar antes de escalar.
3. A limitação da ferramenta deve possuir evidência.
4. Um fallback executável impede a intervenção humana.
5. A intervenção exige gatilho reservado.
6. Léo deve aprovar a exceção.
7. Cada intervenção contém exatamente uma ação humana.
8. A equipe fornece link direto ou caminho exato.
9. A equipe informa risco e resultado esperado.
10. A missão retorna à equipe imediatamente depois da ação.

## 4. Gatilhos reservados

```yaml
allowed_triggers:
  - SECRET_ENTRY
  - PERSONAL_AUTHENTICATION
  - BILLING_OR_CONTRACT
  - IRREVERSIBLE_EXTERNAL_ACTION
  - PUBLIC_RELEASE
  - LEGAL_OBLIGATION
  - MATERIAL_STRATEGIC_DECISION
  - EXPLICIT_HUMAN_REQUEST
```

## 5. Implementação técnica

```yaml
runtime:
  guard: HumanDelegationGuard
  integration: PermissionEngine.assertAllowed
  blocks_human_as_agent: true
  validates_intervention_contract: true

tests:
  normal_agent_execution: required
  leandro_as_agent_blocked: required
  incomplete_request_blocked: required
  fallback_remaining_blocked: required
  unreserved_trigger_blocked: required
  multiple_human_actions_blocked: required
  reserved_single_action_allowed: required

project_bootstrap:
  canonical_policy: project-instructions/MCF-HUMAN-DELEGATION-FIREWALL.md
  intervention_template: templates/MCF-HUMAN-INTERVENTION-REQUEST.yaml
  unified_mission_template_updated: true
  short_instructions_updated: true
```

## 6. Tratamento do incidente atual

O arquivo temporário `tmp`, criado indevidamente na `main` durante esta própria correção, foi removido imediatamente. O evento reforça a necessidade de controles técnicos e de evidência visível, inclusive para o Mestre e para as ferramentas conectadas.

Nenhum segredo ou código funcional foi incluído pelo arquivo temporário.

## 7. Métricas de conformidade

```yaml
human_operator_actions_per_mission:
  target: 0
  max_per_reserved_intervention: 1

team_attempt_before_human:
  target: 100_percent

intervention_contract_complete:
  target: 100_percent
```

## 8. Compatibilidade

A decisão complementa MCF-DEC-050 a MCF-DEC-054. Em conflito operacional sobre delegação ao humano, MCF-DEC-055 prevalece por ser mais específica e posterior.

## 9. Critérios de aceitação

- guard integrado ao PermissionEngine;
- testes verdes;
- política canônica criada;
- instruções curtas atualizadas;
- template de intervenção criado;
- contrato unificado atualizado;
- PR revisado por Renato e Emily;
- merge somente após CI verde;
- nenhuma ação técnica adicional transferida a Leandro durante esta missão.

## 10. Gate de Léo

```yaml
leo_gate: APPROVED
merge_authorized: true
audit: PASS_WITH_MINOR_RESERVATIONS
critical_findings: 0
high_findings: 0
medium_findings: 0
low_findings: 2
validated_workflows:
  documentation_validation: 30955470237
  foundation: 30955470207
  container_smoke: 30955470185
activation: ON_MERGE_TO_MAIN
```
