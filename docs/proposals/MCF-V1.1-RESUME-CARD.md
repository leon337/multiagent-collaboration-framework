# MCF v1.1 — Resume Card

**USE ESTE ARQUIVO PRIMEIRO AO RETOMAR ESTA DISCOVERY EM OUTRO CHAT.**

## Identidade

- Projeto: MCF — Multiagent Collaboration Framework
- Repositório: `leon337/multiagent-collaboration-framework`
- Humano / autoridade final: **LEANDRO**
- Orquestrador: **MESTRE**
- LÉO é agente distinto de LEANDRO
- Branch da Discovery v1.1: `planning/mcf-v1.1-discovery`

## Baseline preservado

```yaml
v1_0_0: PUBLISHED_STABLE
baseline_main_at_discovery_start: b91823a947715e09d69c72999e2278523f2259be
v1_0_mutation_by_discovery: NONE
nextgen_round_1_mutation: NONE
```

## Estado da Discovery

```yaml
target_version: v1.1.0
status: ACTIVE_DISCOVERY
total_questions: 20
questions_completed: 10
questions_remaining: 10
last_completed_question: 10
next_question: 11
Q1: COMPLETED_APPROVED_BY_LEANDRO
Q2: COMPLETED_APPROVED_BY_LEANDRO
Q3: COMPLETED_APPROVED_BY_LEANDRO
Q4: COMPLETED_APPROVED_BY_LEANDRO
Q5: COMPLETED_APPROVED_BY_LEANDRO
Q6: COMPLETED_APPROVED_BY_LEANDRO
Q7: COMPLETED_APPROVED_BY_LEANDRO
Q8: COMPLETED_APPROVED_BY_LEANDRO
Q9: COMPLETED_APPROVED_BY_LEANDRO
Q10: COMPLETED_APPROVED_BY_LEANDRO
Q11: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
```

**Não repetir Q1–Q10 salvo solicitação explícita de LEANDRO.**

## Decisões aprovadas

### Q1 — `HYBRID_INTENT_AND_EXPLICIT_ACTIVATION`
Chat normal fora do MCF; ativação exige bootstrap/fonte verificáveis.

### Q2 — `LOCAL_FIRST_REMOTE_CHECKPOINTED`
Mesma metodologia em hosts diferentes; checkpoints remotos em boundaries semânticos/de risco.

### Q3 — `VERIFIED_TWO_STAGE_BOOTSTRAP`
Resolver pin/seleção explícita/stable e carregar metodologia por tag/SHA imutável, sem silent mid-mission upgrade.

### Q4 — `VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES`
Operação degradada somente sobre base verificável e trabalho reversível; boundary material/governado permanece fail-closed.

### Q5 — `THREE_CANONICAL_ENTRY_MODES_WITH_RECOVERY_ROUTE`

```yaml
PROJECT_ENTRY_MODE:
  - NEW_PROJECT
  - ADOPT_EXISTING_PROJECT
  - RESUME_MCF_PROJECT
RECOVERY_ROUTE:
  - RECOVER_MCF_PROJECT
```

### Q6 — `PROGRESSIVE_DURABLE_PROJECT_GENESIS`

```text
VERIFIED ACTIVATION
→ IDEA_CAPTURE
→ MINI-TRIAGE
→ PROJECT_GENESIS
→ PROJECT HOME / REPO
→ METHODOLOGY PIN
→ DURABLE INTAKE CHECKPOINT
→ HUMAN INTENT DISCOVERY
→ INTENT READINESS
→ PROJECT INTENT PACKAGE
→ LEANDRO CONFIRMS
→ INTENT ALIGNMENT GATE
→ MCF-START-MISSION
```

### Q7 — `EVIDENCE_FIRST_EXISTING_PROJECT_RECONNAISSANCE`

```text
ADOPT provisional
→ baseline exato
→ READ_ONLY reconnaissance
→ evidence classification
→ RESUME / RECOVER / ADOPT
→ AS-IS
→ PROJECT REALITY REPORT
→ REALITY READ-BACK
→ LEANDRO confirma/corrige
→ Human Intent Discovery
```

### Q8 — `CANONICAL_INTENT_DIMENSIONS_WITH_EVIDENCE_AWARE_RESOLUTION`

20 dimensões canônicas de intenção; estados `CLEAR`, `PARTIAL`, `UNKNOWN`, `CONFLICTING`, `NOT_APPLICABLE`; dimensão obrigatória não significa pergunta fixa. Evidência reduz perguntas, mas não inventa preferências humanas. Engenharia decide `HOW`.

### Q9 — `EVIDENCE_AWARE_ADAPTIVE_QUESTIONING_WITH_INFORMATION_GAIN`

```text
QUESTION
→ ANSWER
→ UPDATE ALL AFFECTED DIMENSIONS
→ CHECK CONTRADICTIONS
→ REASSESS PRIORITIES
→ NEXT BEST QUESTION
```

Regras centrais:

- sem sequência fixa e sem quantidade fixa de perguntas;
- uma pergunta primária por vez por padrão;
- prioridade: conflito material de intenção → blocker → alto ganho de informação → alto risco → dependency unlock → refinamento;
- dimensão `CLEAR` não é reaberta sem causa nova;
- uma resposta pode resolver várias dimensões;
- evidência técnica reduz perguntas, mas não substitui intenção `TO-BE`;
- `AS_IS_TO_BE_DIFFERENCE` não é automaticamente conflito;
- follow-up exige ganho de informação real;
- loops de follow-up de baixo ganho são proibidos;
- unknown não bloqueante pode ser preservado; unknown bloqueante recebe `BLOCKING_UNKNOWN`;
- delegação técnica de LEANDRO é resolução válida quando apropriada;
- mudança de decisão preserva histórico: anterior `SUPERSEDED`, nova `CURRENT`;
- carga cognitiva humana participa da seleção da próxima pergunta.

### Q10 — `EVENT_DRIVEN_PROGRESSIVE_SEMANTIC_READBACK`

```text
ADAPTIVE QUESTIONING
→ EVENT/CADENCE TRIGGER
→ PROGRESSIVE READ-BACK
→ LEANDRO CONFIRMS / CORRECTS / REJECTS
→ UPDATE AFFECTED DIMENSIONS
→ INVALIDATE WRONG DERIVATIONS
→ CONTINUE
```

Regras centrais:

- três níveis: `MICRO_CLARIFICATION`, `PROGRESSIVE_READBACK`, `FINAL_INTENT_READBACK`;
- progressive read-back é disparado por mudança material de escopo, conflito material de intenção, interpretação de alto impacto, fechamento de bloco semântico, acúmulo excessivo de mudanças ou boundary de contexto/handoff;
- cadência de segurança de aproximadamente 4–6 trocas significativas, sem contagem fixa;
- read-back enfatiza entendimento novo/material, mudanças, restrições e incertezas; não recita mecanicamente as 20 dimensões;
- resultados: `CONFIRMED`, `CORRECTED`, `REJECTED`, com confirmação parcial permitida;
- correção interrompe propagação semântica errada, invalida assumptions derivadas e recalcula dimensões dependentes;
- mudança humana material preserva histórico (`SUPERSEDED` → `CURRENT`);
- interpretação de máquina rejeitada jamais vira decisão humana;
- `FINAL_INTENT_READBACK` é obrigatório antes do `INTENT_ALIGNMENT_GATE`;
- confirmação progressiva não autoriza implementação.

## Ordem de leitura

1. GitHub live;
2. este Resume Card;
3. `MCF-V1.1-DISCOVERY-CHECKPOINT-010.md`;
4. `MCF-V1.1-QUESTIONNAIRE-ROADMAP-001.md`;
5. `MCF-V1.1-DECISION-LEDGER-001.md`;
6. `MCF-V1.1-DISCOVERY-CHARTER-001.md`.

## Política de continuidade

```text
LEANDRO DECIDE
   ↓
Decision Ledger
   ↓
novo Checkpoint
   ↓
Resume Card
   ↓
Roadmap
   ↓
NEXT QUESTION
```

## Próxima ação

> **Q11 — Como medir Context Sufficiency / Intent Readiness antes de planejar?**

## Comando mínimo de retomada

> `Mestre, retome a Discovery da v1.1 pelo Resume Card e checkpoint mais recente. Continue do ponto exato.`
