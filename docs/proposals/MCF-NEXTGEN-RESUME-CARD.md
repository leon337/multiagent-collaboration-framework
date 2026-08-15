# MCF NextGen — Resume Card

**USE ESTE ARQUIVO PRIMEIRO AO RETOMAR EM OUTRO CHAT.**

## Identidade

- Projeto: MCF — Multiagent Collaboration Framework
- Repositório: `leon337/multiagent-collaboration-framework`
- Humano / autoridade final: **LEANDRO**
- Orquestrador: **MESTRE**
- LÉO é agente distinto de LEANDRO

## Fase atual

```yaml
phase_zero: COMPLETE_IN_MAIN
phase_1: ACTIVE_DISCOVERY
architecture_final_approved: false
prototype_authorized: false
implementation_authorized: false
```

## Questionário

```yaml
total_questions: 16
last_completed_question: 10
next_question: 11
Q1: COMPLETED
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: COMPLETED_APPROVED_BY_LEANDRO
Q8: COMPLETED_APPROVED_BY_LEANDRO
Q9: COMPLETED_APPROVED_BY_LEANDRO
Q10: COMPLETED_APPROVED_BY_LEANDRO
Q11_started: false
implementation_authorized: false
```

**Não repetir Q1–Q10 salvo solicitação explícita de LEANDRO.**

Q11 é:

> **Como deve funcionar a infraestrutura e o placement de serviços?**

## Ordem de leitura

1. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-012.md`
2. `docs/proposals/MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`
3. `docs/proposals/MCF-MASTER-ROADMAP-001.md`
4. checkpoints anteriores conforme necessário
5. GitHub/provider live para estado mutável

## Decisões consolidadas

- Q1: finalidade e foco inicial pessoal de LEANDRO.
- Q2: `LAYERED_CONTINUITY_ARCHITECTURE`.
- Q3: `Agent Contract`; `AGENTE != MODELO`.
- Q4: `MISSION-BOUNDED + RISK-BASED AUTONOMY`.
- Q5: `CAPABILITY_AND_POLICY_BASED_ROUTER`.
- Q6: independência auditável; `INDEPENDENCE != DIVERSITY`.
- Q7: `HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`.
- Q8: `LAYERED_CANONICAL_PERSISTENCE`.
- Q9: `ACTIONABLE_PROGRESSIVE_OBSERVABILITY`.
- Q10: `MINIMAL_STABLE_CORE_WITH_GOVERNED_EXTENSIONS`.

Invariantes centrais da Q10:

```text
EXTENSION -> CORE CONTRACTS = ALLOWED
CORE -> SPECIFIC EXTENSION = FORBIDDEN
INSTALLED != ENABLED != AUTHORIZED
PLUGIN_CAPABILITY != AGENT_AUTHORITY
PROFILE = DECLARATIVE_CONFIGURATION
FACTORY = BLUEPRINT_GENERATOR, NOT_RUNTIME_AUTHORITY
UNKNOWN_EXTENSION_COMPATIBILITY = NOT_LOADABLE
NUMERIC_R_LABEL_WITHOUT_NAMESPACE = FORBIDDEN
```

O checkpoint Q6 permanece como registro histórico aprovado; novas especificações devem distinguir explicitamente `risk` de `assurance` por namespace ou nomes semânticos.

Checkpoint detalhado da Q10: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-012.md`.

## Próxima ação

- Q1–Q10 concluídas e aprovadas por LEANDRO.
- Q11 ainda não começou.
- Próximo passo permitido: iniciar Q11 apenas como Discovery.
- Não implementar NextGen antes de Q1–Q16, consolidação, arquitetura alvo, plano de migração, critérios de aceite e aprovação final de LEANDRO.

## Comando mínimo de retomada

> `Mestre, retome o MCF pelo Resume Card e pelo checkpoint mais recente. Continue do ponto exato.`
