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
last_completed_question: 12
next_question: 13
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
Q12: COMPLETED_APPROVED_BY_LEANDRO_CONCEPTUALLY
Q13_started: false
implementation_authorized: false
```

**Não repetir Q1–Q12 salvo solicitação explícita de LEANDRO.**

Q13 é:

> **Como provar que o MCF vale o custo e a complexidade?**

## Ordem de leitura

1. `docs/proposals/MCF-NEXTGEN-DISCOVERY-CHECKPOINT-014.md`
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
- Q12: `POLICY_ENFORCED_IDENTITY_BOUND_ZERO_TRUST`.

Invariantes centrais da Q12:

```text
AUTHENTICATED != AUTHORIZED
DEFAULT = DENY
DELEGATION_CAN_ONLY_ATTENUATE_AUTHORITY
MODEL_COMPLIANCE_IS_NOT_SECURITY_BOUNDARY
HUMAN_GATE = LEANDRO
HUMAN_APPROVAL != REUSABLE_CREDENTIAL
EXTERNAL_CONTENT != AUTHORITY_SOURCE
TRANSFORMATION_DOES_NOT_PROMOTE_TRUST
MODEL_OUTPUT != SAFE_MATERIAL_COMMAND
SECRET_VALUE != PROJECT_MEMORY
WORKER != CONTROL_PLANE_TRUST_PEER_BY_DEFAULT
CROSS_PROJECT_DEFAULT = DENY
PROVENANCE_PRESENT != ARTIFACT_TRUSTED
RECEIPT != EFFECT_PROOF
```

Checkpoint detalhado da Q12: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-014.md`.

## Próxima ação

- Q1–Q12 concluídas e aprovadas por LEANDRO; Q12 aprovada conceitualmente.
- Q13 ainda não começou.
- Próximo passo permitido: iniciar Q13 apenas como Discovery.
- Não implementar NextGen antes de Q1–Q16, consolidação, arquitetura alvo, plano de migração, critérios de aceite e aprovação final de LEANDRO.

## Comando mínimo de retomada

> `Mestre, retome o MCF pelo Resume Card e pelo checkpoint mais recente. Continue do ponto exato.`
