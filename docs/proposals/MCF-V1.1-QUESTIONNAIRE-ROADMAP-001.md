# MCF v1.1 — Roadmap do Questionário de Discovery

**ID:** `MCF-V1.1-QUESTIONNAIRE-ROADMAP-001`  
**Status:** `ACTIVE_DISCOVERY`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE

---

## 1. Regra do questionário

O questionário possui **20 perguntas canônicas**.

- uma pergunta por vez;
- LEANDRO pode escolher, combinar ou propor resposta;
- MESTRE registra consequências, riscos, dependências e pontos abertos;
- decisão relevante é persistida no GitHub antes de avançar;
- pergunta concluída não é repetida salvo solicitação explícita de LEANDRO;
- discovery input não é decisão;
- implementação da v1.1.0 permanece bloqueada até encerramento formal e HUMAN_GATE separado.

---

## 2. Estado atual

```yaml
question_count_total: 20
questions_completed: 6
questions_remaining: 14
last_completed_question: 6
next_question: 7
question_01: COMPLETED_APPROVED_BY_LEANDRO
question_02: COMPLETED_APPROVED_BY_LEANDRO
question_03: COMPLETED_APPROVED_BY_LEANDRO
question_04: COMPLETED_APPROVED_BY_LEANDRO
question_05: COMPLETED_APPROVED_BY_LEANDRO
question_06: COMPLETED_APPROVED_BY_LEANDRO
question_07: NOT_STARTED
question_08: NOT_STARTED
question_09: NOT_STARTED
question_10: NOT_STARTED
question_11: NOT_STARTED
question_12: NOT_STARTED
question_13: NOT_STARTED
question_14: NOT_STARTED
question_15: NOT_STARTED
question_16: NOT_STARTED
question_17: NOT_STARTED
question_18: NOT_STARTED
question_19: NOT_STARTED
question_20: NOT_STARTED
implementation_authorized: false
```

---

## 3. Perguntas canônicas

### Q1 — Qual deve ser o contrato de ativação do MCF?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `HYBRID_INTENT_AND_EXPLICIT_ACTIVATION` — Opção D.

### Q2 — Como o MCF deve operar em diferentes ambientes de execução?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `LOCAL_FIRST_REMOTE_CHECKPOINTED` — Opção D.

### Q3 — Como o bootstrap encontra e verifica a versão/metodologia vigente?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `VERIFIED_TWO_STAGE_BOOTSTRAP` — Opção D.

### Q4 — Como deve funcionar o fail-closed quando GitHub/bootstrap/fonte canônica não estiver acessível?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES` — Opção D.

### Q5 — Quais modos de entrada de projeto o MCF deve reconhecer?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `THREE_CANONICAL_ENTRY_MODES_WITH_RECOVERY_ROUTE` — Opção D.

```yaml
PROJECT_ENTRY_MODE:
  - NEW_PROJECT
  - ADOPT_EXISTING_PROJECT
  - RESUME_MCF_PROJECT
RECOVERY_ROUTE:
  - RECOVER_MCF_PROJECT
```

### Q6 — Como deve funcionar a entrada de um projeto novo?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `PROGRESSIVE_DURABLE_PROJECT_GENESIS` — Opção D.

- ativação MCF verificada antes da entrada formal;
- `IDEA_CAPTURE` preserva a intenção original de LEANDRO;
- mini-triagem de 3–5 perguntas para identidade, não requisitos completos;
- Project Genesis define `internal_project_id`, working title, repo slug e descrição;
- project home/repositório nasce antes da entrevista profunda;
- methodology pin nasce no Project Genesis;
- primeiro checkpoint durável antecede Human Intent Discovery;
- implementação de produto permanece `NO_GO` até `INTENT_ALIGNMENT_GATE = PASS`;
- Discovery/documentação e protótipos não canônicos de descoberta podem existir nos limites definidos;
- artefatos mínimos pré-missão: `PROJECT_GENESIS_RECORD`, `PROJECT_INTAKE_CHECKPOINT`, `PROJECT_INTENT_PACKAGE`, `INTENT_ALIGNMENT_RECEIPT`;
- `MISSION CONTRACT` nasce somente via `MCF-START-MISSION`;
- projeto pode ser abandonado antes do alinhamento sem dívida de execução.

### Q7 — Como deve funcionar a entrada de um projeto existente antes de perguntar ao humano?
Definir reconnaissance read-only, fontes técnicas automáticas, separação entre fatos/inferências/unknowns, reconstrução do `AS-IS`, `Project Reality Report`, possível reclassificação para `RESUME/RECOVER`, read-back para LEANDRO e bloqueios antes da confirmação.

### Q8 — Quais dimensões de intenção humana são obrigatórias?

### Q9 — Como perguntas adaptativas devem evitar interrogatório rígido e perguntas já respondidas por evidência?

### Q10 — Como deve funcionar o progressive read-back e correção de entendimento?

### Q11 — Como medir Context Sufficiency / Intent Readiness antes de planejar?

### Q12 — Qual é o contrato do Project Intent Package?

### Q13 — Quais artefatos adicionais um projeto existente precisa produzir?
Inclui candidatos: `Project Reality Report`, `AS-IS / TO-BE Gap Map`, `Completion/Recovery Plan`.

### Q14 — O que é canônico e o que é derived view na memória/continuidade do projeto?

### Q15 — Qual é a divisão de autoridade entre LEANDRO e a equipe MCF após o intake?

### Q16 — Quais ações continuam exigindo HUMAN_GATE e quais decisões técnicas podem ser delegadas?

### Q17 — Como checkpoint, pause/resume e troca de chat devem funcionar?

### Q18 — Como evoluir a v1.0.0 para v1.1.0 preservando compatibilidade e evitando duplicação de mecanismos?

### Q19 — Como provar a v1.1.0 com testes reais?
Candidatos mínimos: projeto novo, projeto antigo incompleto e retomada em novo chat.

### Q20 — Qual é a arquitetura/contrato consolidado da v1.1.0 e qual o GO / CONDITIONAL GO / NO-GO para implementação?

---

## 4. Política de checkpoint

Para cada Q aprovada:

1. atualizar Decision Ledger;
2. criar novo checkpoint de retomada;
3. atualizar Resume Card;
4. atualizar este roadmap;
5. somente então avançar para a próxima pergunta.

---

## 5. Próxima ação

> **Q7 — Como deve funcionar a entrada de um projeto existente (`ADOPT_EXISTING_PROJECT`) antes de perguntar ao humano em profundidade?**

Não iniciar Q8 antes de decisão explícita de LEANDRO sobre Q7.
