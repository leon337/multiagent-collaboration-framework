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
- ao apresentar alternativas, MESTRE marca sua recomendação com **⭐** para facilitar visualização; a estrela não substitui decisão de LEANDRO;
- implementação da v1.1.0 permanece bloqueada até encerramento formal e HUMAN_GATE separado.

---

## 2. Estado atual

```yaml
question_count_total: 20
questions_completed: 16
questions_remaining: 4
last_completed_question: 16
next_question: 17
question_01: COMPLETED_APPROVED_BY_LEANDRO
question_02: COMPLETED_APPROVED_BY_LEANDRO
question_03: COMPLETED_APPROVED_BY_LEANDRO
question_04: COMPLETED_APPROVED_BY_LEANDRO
question_05: COMPLETED_APPROVED_BY_LEANDRO
question_06: COMPLETED_APPROVED_BY_LEANDRO
question_07: COMPLETED_APPROVED_BY_LEANDRO
question_08: COMPLETED_APPROVED_BY_LEANDRO
question_09: COMPLETED_APPROVED_BY_LEANDRO
question_10: COMPLETED_APPROVED_BY_LEANDRO
question_11: COMPLETED_APPROVED_BY_LEANDRO
question_12: COMPLETED_APPROVED_BY_LEANDRO
question_13: COMPLETED_APPROVED_BY_LEANDRO
question_14: COMPLETED_APPROVED_BY_LEANDRO
question_15: COMPLETED_APPROVED_BY_LEANDRO
question_16: COMPLETED_APPROVED_BY_LEANDRO
question_17: NOT_STARTED
question_18: NOT_STARTED
question_19: NOT_STARTED
question_20: NOT_STARTED
implementation_authorized: false
codex_implementation_authorized: false
prototype_authorized: false
release_authorized: false
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

### Q6 — Como deve funcionar a entrada de um projeto novo?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `PROGRESSIVE_DURABLE_PROJECT_GENESIS` — Opção D.

### Q7 — Como deve funcionar a entrada de um projeto existente antes de perguntar ao humano?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `EVIDENCE_FIRST_EXISTING_PROJECT_RECONNAISSANCE` — Opção D.

### Q8 — Quais dimensões de intenção humana são obrigatórias?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `CANONICAL_INTENT_DIMENSIONS_WITH_EVIDENCE_AWARE_RESOLUTION` — Opção D.

20 dimensões canônicas; estados `CLEAR`, `PARTIAL`, `UNKNOWN`, `CONFLICTING`, `NOT_APPLICABLE`; sem requisito de 20 perguntas fixas. Evidência pode fornecer fatos, mas não inventar preferências humanas.

### Q9 — Como perguntas adaptativas devem evitar interrogatório rígido e perguntas já respondidas por evidência?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `EVIDENCE_AWARE_ADAPTIVE_QUESTIONING_WITH_INFORMATION_GAIN` — Opção D.

Sem sequência/contagem fixa; uma pergunta primária por vez; atualizar dimensões e reavaliar antes da próxima; follow-up exige valor; loops de baixo ganho são proibidos.

### Q10 — Como deve funcionar o progressive read-back e correção de entendimento?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `EVENT_DRIVEN_PROGRESSIVE_SEMANTIC_READBACK` — Opção D.

Três níveis (`MICRO_CLARIFICATION`, `PROGRESSIVE_READBACK`, `FINAL_INTENT_READBACK`); gatilhos por mudanças/conflitos/interpretações materiais e boundaries; correções invalidam derivações erradas; final read-back obrigatório antes do Alignment Gate.

### Q11 — Como medir Context Sufficiency / Intent Readiness antes de planejar?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `SEMANTIC_READINESS_GATE_WITH_BLOCKING_UNKNOWNS` — Opção D.

Readiness semântica; `BLOCKING` vs `NON_BLOCKING`; estados `NOT_READY`, `CONDITIONALLY_READY`, `READY_FOR_ALIGNMENT`; score não tem autoridade de gate; `READY_FOR_ALIGNMENT` não autoriza implementação.

### Q12 — Qual é o contrato do Project Intent Package?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `VERSIONED_PROVENANCE_AWARE_PROJECT_INTENT_PACKAGE` — Opção D.

- PIP é memória durável da intenção, não chat log, arquitetura, backlog ou Mission Contract;
- separa `RAW_INTENT`, síntese do MESTRE, decisões humanas, evidência, inferências e assumptions;
- preserva 20 dimensões, readiness impact e provenance de afirmações materiais;
- `INTENT_ALIGNMENT_GATE` vincula-se a revisão exata do PIP;
- Mission Contract nasce após alinhamento e referencia a revisão alinhada do PIP;
- Product Brief não pode introduzir intenção nova.

### Q13 — Quais artefatos adicionais um projeto existente precisa produzir?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `EVIDENCE_BOUND_CONDITIONAL_EXISTING_PROJECT_ARTIFACT_PIPELINE` — Opção D.

- `Project Reality Report` representa somente o `AS-IS` em baseline exato, com evidência e provenance;
- `AS-IS / TO-BE Gap Map` vincula revisão exata do PRR a revisão exata e alinhada do PIP;
- `Completion / Recovery Plan` nasce de gaps validados e não autoriza implementação;
- `RECOVER_MCF_PROJECT` reconcilia primeiro checkpoint, PIP, Mission State, GitHub live e evidências.

### Q14 — O que é canônico e o que é derived view na memória/continuidade do projeto?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `LAYERED_AUTHORITY_WITH_REBUILDABLE_PROJECT_VIEWS` — Opção D.

- quatro classes: `CANONICAL_DURABLE_RECORD`, `LIVE_AUTHORITATIVE_STATE`, `DERIVED_REBUILDABLE_VIEW`, `WORKING_PROPOSED_ARTIFACT`;
- autoridade canônica é específica de domínio/boundary;
- estado live governa fatos externos voláteis e não reescreve registros históricos;
- derived views não podem substituir fontes autoritativas;
- promoção de análise/proposta para decisão/contrato autoritativo deve ser explícita.

### Q15 — Qual é a divisão de autoridade entre LEANDRO e a equipe MCF após o intake?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `DELEGATED_TECHNICAL_AUTONOMY_WITHIN_HUMAN_APPROVED_ENVELOPE` — Opção D.

- LEANDRO governa intenção, objetivo, resultado esperado, prioridades, limites e trade-offs humanos materiais;
- a equipe MCF possui autonomia técnica e operacional delegada dentro do envelope aprovado;
- `ALIGNED_PIP + HUMAN_DECISIONS + MISSION_CONTRACT` formam o envelope aplicável;
- `TEAM_FIRST` precede escalonamento humano para ambiguidades técnicas;
- mudanças materiais cruzam a fronteira da autoridade humana.

### Q16 — Quais ações continuam exigindo HUMAN_GATE e quais decisões técnicas podem ser delegadas?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `IMPACT_BASED_HUMAN_GATES_WITH_SCOPED_STANDING_AUTHORIZATION` — Opção D.

- `HUMAN_GATE` é determinado por impacto material e autoridade aplicável, não pelo nome isolado da operação;
- mudanças materiais de intenção, objetivo, público, must-have/non-goal, definição de pronto ou resultado esperado pertencem a LEANDRO;
- compromisso financeiro novo/relevante fora do boundary, exposição jurídica/privacidade/pública material, uso excepcional de credenciais/dados sensíveis, ações irreversíveis/de alto impacto, pivô/cancelamento, aceitação de risco material e ações explicitamente reservadas exigem gate humano;
- autorizações antecipadas/contínuas são permitidas apenas quando delimitadas por escopo, ambiente, classes de ação, limites, boundary/expiração, exclusões e evidência;
- `TEAM_FIRST` permanece obrigatório antes do gate para ambiguidades técnicas ordinárias;
- gate pendente bloqueia apenas a ação dependente; trabalho independente, seguro e autorizado pode continuar;
- silêncio nunca equivale a aprovação.

### Q17 — Como checkpoint, pause/resume e troca de chat devem funcionar?
**Estado:** `NOT_STARTED`

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

## 5. Handoff após Q16

O boundary canônico atual é:

```text
MCF-V1.1-RESUME-CARD.md
+
MCF-V1.1-DISCOVERY-CHECKPOINT-016.md
```

Qualquer novo chat deve consultar o GitHub live, não repetir Q1–Q16 e retomar diretamente na Q17.

## 6. Próxima ação

> **Q17 — Como checkpoint, pause/resume e troca de chat devem funcionar?**

Não iniciar Q18 antes de decisão explícita de LEANDRO sobre Q17. Implementação permanece `NO_GO`.
