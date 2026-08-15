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
last_completed_question: 8
next_question: 9
Q1: COMPLETED
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: COMPLETED_APPROVED_BY_LEANDRO
Q8: COMPLETED_APPROVED_BY_LEANDRO
Q9_started: false
implementation_authorized: false
```

**Não repetir Q1–Q8 salvo solicitação explícita de LEANDRO.**

Q9 é:

> **Como deve ser a experiência humana e a observabilidade?**

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

1. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-010.md`
2. `docs/proposals/MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`
3. `docs/proposals/MCF-MASTER-ROADMAP-001.md`
4. checkpoints 009→004 conforme histórico necessário
5. GitHub/provider live para estado mutável

## Decisões consolidadas

### Q1 — Finalidade
Sistema pessoal de trabalho com IA para LEANDRO como foco inicial; continuidade durável; provar antes de generalizar.

### Q2 — Continuidade e memória
`LAYERED_CONTINUITY_ARCHITECTURE`; memória, evidência, autoridade e live state separados; Project Capsule derivado; `UNKNOWN` permanece `UNKNOWN`.

### Q3 — Agente MCF
`Agent Contract`; `AGENTE != MODELO`; `CAPABILITY != AUTHORITY`; `AGENT OUTPUT != PROJECT TRUTH`.

### Q4 — Autonomia
`MISSION-BOUNDED + RISK-BASED AUTONOMY`; `Authority Envelope`; `UNKNOWN_AUTHORITY = DENY`; HUMAN_GATE exclusivamente de LEANDRO em R3/crítico.

### Q5 — Roteador
`CAPABILITY_AND_POLICY_BASED_ROUTER`; hard requirements; `UNKNOWN_CAPABILITY = NOT_COMPATIBLE`; fallback compatível/limitado; routing receipt.

### Q6 — Independência
`INDEPENDENCE != DIVERSITY`; R2+ = contexto separado + `BLIND_FIRST` + evidência/decisão próprias + receipt; `CONSENSUS != TRUTH`; assurance R0–R4 por risco.

### Q7 — Orquestração
`HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`; outer graph acíclico; loops isolados/limitados; paralelismo seguro; joins; replan versionado; Complexity Budget; staleness control; Completion Contract.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-009.md`.

### Q8 — Documentação e estado persistente
LEANDRO aprovou `LAYERED_CANONICAL_PERSISTENCE`.

Princípios:

```text
ONE CLAIM CLASS -> ONE AUTHORITATIVE RESOLUTION POLICY
LIVE_OPERATIONAL_STATE != DOCUMENTATION
CONVERSATION != PROJECT_TRUTH
DERIVED_VIEW != SOURCE_OF_TRUTH
BACKUP_EXISTS != RECOVERY_WORKS
```

- camadas lógicas: canonical knowledge, operational state, transition ledger, evidence, derived views;
- não exige cinco sistemas físicos;
- estado + transição exigem boundary atômico ou garantia equivalente;
- full Event Sourcing não é obrigatório;
- derived views são regeneráveis e possuem freshness;
- checkpoints/snapshots são ancorados em versões/cursors;
- evidence refs preservam integridade/proveniência;
- Raw Archive é governado; retenção não é infinita;
- secrets não são promovidos à memória geral;
- schema versioning, supersession lineage e human approval provenance são requisitos;
- restorability deve ser testada;
- tecnologia/placement/RPO/RTO/security enforcement ficam para Q11/Q12/Q16.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-010.md`.

## Próxima ação do Discovery

- Q1–Q8 concluídas e aprovadas por LEANDRO.
- Q9 ainda não começou.
- Próximo passo permitido: **LEANDRO + MESTRE iniciarem Q9 — “Como deve ser a experiência humana e a observabilidade?”**
- implementação NextGen continua proibida até Q1–Q16, consolidação, arquitetura alvo, plano de migração, critérios de aceite e aprovação final de LEANDRO.

## Comando mínimo de retomada

> `Mestre, retome o MCF pelo Resume Card e pelo checkpoint mais recente. Continue do ponto exato.`

```yaml
phase_zero: COMPLETE_IN_MAIN
phase_1: ACTIVE_DISCOVERY
Q1_Q8: COMPLETED_APPROVED
Q9: NEXT_NOT_STARTED
implementation_authorized: false
```
