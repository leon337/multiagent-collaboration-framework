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
questions_completed: 2
questions_remaining: 18
last_completed_question: 2
next_question: 3
question_01: COMPLETED_APPROVED_BY_LEANDRO
question_02: COMPLETED_APPROVED_BY_LEANDRO
question_03: NOT_STARTED
question_04: NOT_STARTED
question_05: NOT_STARTED
question_06: NOT_STARTED
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

Chat normal permanece fora do MCF. Comando explícito ou intenção clara de projeto pode iniciar `ACTIVATING`; `ACTIVE` exige bootstrap/metodologia/fonte de verdade verificável.

### Q2 — Como o MCF deve operar em diferentes ambientes de execução?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `LOCAL_FIRST_REMOTE_CHECKPOINTED` — Opção D.

A mesma metodologia/governança MCF deve operar em hosts diferentes, mas o execution plane pode variar:

- `CHATGPT_REMOTE` → conectores e ferramentas remotas;
- `CODEX_LOCAL` → terminal, workspace e Git local;
- GitHub permanece memória institucional, checkpoint remoto, colaboração, CI, revisão e integração;
- Codex parte de baseline remoto exato e usa branch/worktree isolado;
- commits locais podem ser frequentes sem push a cada edição;
- checkpoint remoto é obrigatório em boundaries semânticos/de risco;
- PR é boundary de integração/revisão, não obrigatório a cada checkpoint;
- trabalho local de baixo risco pode continuar temporariamente com `CHECKPOINT_DEBT` se remoto indisponível;
- boundary material/governado sem evidência remota aplicável deve `FAIL_CLOSED`.

### Q3 — Como o bootstrap encontra e verifica a versão/metodologia vigente?

### Q4 — Como deve funcionar o fail-closed quando GitHub/bootstrap/fonte canônica não estiver acessível?

### Q5 — Quais modos de entrada de projeto o MCF deve reconhecer?
Candidatos: `NEW_PROJECT`, `EXISTING_PROJECT`, `RESUME_MCF_PROJECT`.

### Q6 — Como deve funcionar a entrada de um projeto novo?

### Q7 — Como deve funcionar a entrada de um projeto existente antes de perguntar ao humano?

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

> **Q3 — Como o bootstrap do MCF encontra e verifica a versão/metodologia vigente?**

Não iniciar Q4 antes de decisão explícita de LEANDRO sobre Q3.
