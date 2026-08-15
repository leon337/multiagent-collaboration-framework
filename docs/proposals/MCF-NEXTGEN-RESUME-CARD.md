# MCF NextGen — Resume Card

**USE ESTE ARQUIVO PRIMEIRO AO RETOMAR EM OUTRO CHAT.**

## Identidade

- Projeto: MCF — Multiagent Collaboration Framework
- Repositório: `leon337/multiagent-collaboration-framework`
- Humano / autoridade final: **LEANDRO**
- Orquestrador: **MESTRE**
- LÉO é agente distinto de LEANDRO

## Fase atual

- Fase Zero — Construir para aprender: **COMPLETE_IN_MAIN**
- Fase atual: **MCF — Fase 1: Reestruturação e Evolução Pós-v1**
- Nome curto: **MCF NextGen**
- Estágio: **Discovery e Planejamento / ACTIVE_DISCOVERY**
- Arquitetura final aprovada: **não**
- Protótipo autorizado: **não**
- Implementação NextGen autorizada: **não**

## Questionário

```yaml
total_questions: 16
last_completed_question: 7
next_question: 8
Q1: COMPLETED
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: COMPLETED_APPROVED_BY_LEANDRO
Q8_started: false
implementation_authorized: false
```

**Não repetir Q1–Q7 salvo solicitação explícita de LEANDRO.**

Q8 é:

> **Qual documentação e estado persistente são realmente necessários?**

## Boundary terminal da Fase Zero

Snapshot terminal verificado em 2026-08-14:

```yaml
phase_zero:
  state: COMPLETE_IN_MAIN
  audited_candidate: 47f083d304b989b397b9e740228817af0c588346
  merge_main: b91823a947715e09d69c72999e2278523f2259be
  pr_136: MERGED
  issue_135: CLOSED
  P0: 0
  P1: 0
  P2: 0
  post_merge_ci: PASS
  rc3_terminal_noop: PASS
  production_health: PASS

durable_release_identity:
  stable_v1_0_0: 7f741e10d0e745a90c732e084400b11e3f5e6794
  rc3: 7f741e10d0e745a90c732e084400b11e3f5e6794
```

Estado mutável posterior deve ser relido no GitHub/provider live.

## Ordem de leitura

1. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-009.md`
2. `docs/proposals/MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`
3. `docs/proposals/MCF-MASTER-ROADMAP-001.md`
4. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-008.md` para Q6
5. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007.md` para Q5
6. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md` para Q4
7. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md` para Q3
8. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md` para Q2
9. GitHub/provider live para estado mutável

## Decisões consolidadas

### Q1 — Finalidade
Sistema pessoal de trabalho com IA para LEANDRO como foco inicial; continuidade durável de projetos; ChatGPT/MESTRE como camada cognitiva superior inicial; equipes especializadas; provar antes de generalizar.

### Q2 — Continuidade e memória
`LAYERED_CONTINUITY_ARCHITECTURE`; memória, evidência, autoridade e estado live são distintos; Project Capsule é derivado, não fonte de verdade; `UNKNOWN` permanece `UNKNOWN`; cold-start/Continuity Recovery Test.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`.

### Q3 — Agente MCF
`Agent Contract`; `AGENTE != MODELO`; `CAPABILITY != AUTHORITY`; `IDENTITY CONTINUITY != CAPABILITY CONTINUITY`; `AGENT OUTPUT != PROJECT TRUTH`.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md`.

### Q4 — Autonomia
`MISSION-BOUNDED + RISK-BASED AUTONOMY`; `Authority Envelope`; `UNKNOWN_AUTHORITY = DENY`; autoelevação proibida; `TEAM_FIRST`; retries limitados; R3/crítico → HUMAN_GATE exclusivamente de LEANDRO.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md`.

### Q5 — Roteador de Modelos
`CAPABILITY_AND_POLICY_BASED_ROUTER`; hard requirements antes de custo/latência/quota; `UNKNOWN_CAPABILITY = NOT_COMPATIBLE`; fallback compatível, limitado e sem loops; routing receipt auditável.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007.md`.

### Q6 — Independência e assurance
`INDEPENDENCE != DIVERSITY`; R2+ exige contexto separado, `BLIND_FIRST`, evidência própria, decisão própria e receipt inicial imutável; `CONSENSUS != TRUTH`; assurance `R0–R4` proporcional ao risco.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-008.md`.

### Q7 — Orquestração
LEANDRO aprovou `HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`.

Princípios:

- outer graph com dependências acíclicas;
- loops isolados e limitados com prova de progresso;
- paralelismo somente quando dependências permitirem;
- mutações conflitantes coordenadas;
- joins explícitos;
- falha parcial não avança silenciosamente;
- replanning versionado e histórico imutável;
- replan não amplia autoridade nem remove gates;
- `Complexity Budget` limita decomposição/spawning;
- outputs stale são rejeitados/revalidados/cancelados/superseded;
- `last writer wins` não é integração padrão;
- side effects exigem idempotência/controle equivalente e compensação quando aplicável;
- `GRAPH EXHAUSTION != MISSION COMPLETION`; Completion Contract define conclusão.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-009.md`.

## Próxima ação do Discovery

- Q1–Q7 concluídas e aprovadas por LEANDRO.
- Q8 ainda não começou.
- Próximo passo permitido: **LEANDRO + MESTRE iniciarem Q8 — “Qual documentação e estado persistente são realmente necessários?”**
- não iniciar implementação NextGen antes de Q1–Q16, consolidação, arquitetura alvo, plano de migração, critérios de aceite e aprovação final de LEANDRO.

## Comando mínimo de retomada

> `Mestre, retome o MCF pelo Resume Card e pelo checkpoint mais recente. Continue do ponto exato.`

Resultado esperado:

```yaml
phase_zero: COMPLETE_IN_MAIN
phase_1: ACTIVE_DISCOVERY
Q1: COMPLETED
Q2: COMPLETED_APPROVED
Q3: COMPLETED_APPROVED
Q4: COMPLETED_APPROVED
Q5: COMPLETED_APPROVED
Q6: COMPLETED_APPROVED
Q7: COMPLETED_APPROVED
Q8: NEXT_NOT_STARTED
implementation_authorized: false
```
