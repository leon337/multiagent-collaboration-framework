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
last_completed_question: 11
next_question: 12
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
Q11: COMPLETED_APPROVED_BY_LEANDRO
Q12_started: false
implementation_authorized: false
```

**Não repetir Q1–Q11 salvo solicitação explícita de LEANDRO.**

Q12 é:

> **Quais controles de segurança, permissões e gates são essenciais?**

## Ordem de leitura

1. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-013.md`
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
- Q11: `PORTABLE_POLICY_DRIVEN_HYBRID_PLACEMENT`.

Invariantes centrais da Q11:

```text
LOGICAL_PLANE != PHYSICAL_SERVICE
SINGLE_LOGICAL_AUTHORITY != SINGLE_MACHINE_FOREVER
LEASE_ALONE != SPLIT_BRAIN_PROTECTION
QUEUE != TASK SOURCE_OF_TRUTH
WORKER_PRIVATE_SCRATCH != PROJECT_TRUTH
LOCAL_STATE_PLANE_MAY_BE_CANONICAL
PLACEMENT != AUTHORITY
UNKNOWN_AUTHORITY = DENY
BLIND_RETRY = FORBIDDEN
APP_REDEPLOY != DATA_RESTORE
PORTABLE != ACTIVE_MULTI_CLOUD
WORKER_ALIVE != TASK_PROGRESSING
```

Checkpoint detalhado da Q11: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-013.md`.

## Próxima ação

- Q1–Q11 concluídas e aprovadas por LEANDRO.
- Q12 ainda não começou.
- Próximo passo permitido: iniciar Q12 apenas como Discovery.
- Não implementar NextGen antes de Q1–Q16, consolidação, arquitetura alvo, plano de migração, critérios de aceite e aprovação final de LEANDRO.

## Comando mínimo de retomada

> `Mestre, retome o MCF pelo Resume Card e pelo checkpoint mais recente. Continue do ponto exato.`
