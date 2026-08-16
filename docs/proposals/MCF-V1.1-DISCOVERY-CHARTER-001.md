# MCF v1.1 — Discovery Charter

**ID:** `MCF-V1.1-DISCOVERY-CHARTER-001`  
**Status:** `ACTIVE_DISCOVERY`  
**Target version:** `v1.1.0`  
**Baseline:** `v1.0.0` / `main@b91823a947715e09d69c72999e2278523f2259be`  
**Branch:** `planning/mcf-v1.1-discovery`  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE

---

## 1. Objetivo

Definir de forma auditável a evolução da entrada e ativação do MCF antes de qualquer implementação da v1.1.0.

Esta Discovery deve especificar como um humano:

- ativa o MCF em diferentes ambientes;
- entrega uma ideia nova ou um projeto existente;
- fornece intenção em linguagem humana sem precisar dominar engenharia de software;
- permite ao MESTRE recuperar fatos técnicos automaticamente quando possível;
- valida o entendimento do MESTRE antes de a equipe iniciar planejamento técnico;
- preserva intenção, decisões, contexto e continuidade fora da memória transitória do chat;
- usa o mesmo método em ChatGPT e Codex sem duplicar a metodologia.

---

## 2. Invariantes

```text
HUMAN_INTENT != TECHNICAL_IMPLEMENTATION
SHORT_OBJECTIVE != SUFFICIENT_EXECUTION_CONTEXT
LEANDRO_OWNS_INTENT_AND_MATERIAL_HUMAN_DECISIONS
MCF_TEAM_TRANSLATES_INTENT_INTO_ENGINEERING
CHAT_HISTORY != CANONICAL_PROJECT_MEMORY
MCF_METHOD != EXECUTION_ENVIRONMENT
GITHUB_REMAINS_DURABLE_INSTITUTIONAL_SOURCE_OF_TRUTH
LOCAL_WORKSPACE_MAY_BE_AN_EXECUTION_PLANE
```

---

## 3. Escopo da Discovery

A Discovery deve decidir no mínimo:

1. MCF Activation Contract;
2. bootstrap e resolução da metodologia vigente;
3. modos de execução ChatGPT e Codex;
4. classificação de entrada de projeto;
5. Project Intake;
6. Human Intent Discovery;
7. perguntas adaptativas e progressive read-back;
8. Context Sufficiency / Intent Readiness;
9. Project Intent Package;
10. Existing Project Reconnaissance;
11. Project Reality Report;
12. AS-IS / TO-BE Gap Map;
13. divisão de autoridade humano/equipe;
14. HUMAN_GATE e autonomia pós-intake;
15. checkpoint, resume e continuidade;
16. compatibilidade com v1.0.0;
17. critérios de teste e validação da v1.1.0.

---

## 4. Fora de escopo durante a Discovery

```yaml
implementation: NO_GO
codex_implementation: NO_GO
prototype: NO_GO
release_v1_1_0: NO_GO
production_change: NO_GO
destructive_v1_0_change: NO_GO
nextgen_round_1_rewrite: FORBIDDEN
```

A `v1.0.0` publicada permanece preservada. A Discovery da v1.1 possui lineage próprio e não altera nem substitui as decisões da branch `planning/mcf-nextgen-discovery`.

---

## 5. Método decisório

- 20 perguntas canônicas;
- uma pergunta por vez;
- cada pergunta apresenta problema, opções, riscos, dependências e recomendação do MESTRE;
- LEANDRO pode escolher, combinar, rejeitar ou propor nova opção;
- decisão só se torna `APPROVED` após decisão explícita de LEANDRO;
- decisão aprovada deve ser persistida no GitHub antes de avançar;
- nova ideia ainda não decidida deve ser registrada como `DISCOVERY_INPUT`, nunca como decisão;
- hipótese não autoriza implementação;
- toda decisão deve manter lineage e referência da pergunta.

---

## 6. Política de checkpoint e retomada

Persistir checkpoint sempre que houver:

- decisão aprovada de pergunta;
- nova lacuna material;
- mudança de ordem/escopo da Discovery;
- pausa da sessão;
- troca de chat;
- risco de perda de contexto.

Um novo chat deve conseguir reconstruir o estado lendo, nesta ordem:

1. GitHub live;
2. `MCF-V1.1-RESUME-CARD.md`;
3. checkpoint mais recente;
4. `MCF-V1.1-QUESTIONNAIRE-ROADMAP-001.md`;
5. `MCF-V1.1-DECISION-LEDGER-001.md`;
6. este Charter.

---

## 7. Condição de saída da Discovery

A Discovery só termina após:

```yaml
Q1_Q20: COMPLETE
cross_question_reconciliation: COMPLETE
critical_review: COMPLETE
v1_1_target_contract: APPROVED_BY_LEANDRO
implementation_authorization: EXPLICIT_SEPARATE_HUMAN_GATE
```

Até lá, o Codex pode ser usado como revisor/auditor se explicitamente solicitado, mas não como implementador da v1.1.0.
