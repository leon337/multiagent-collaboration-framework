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
questions_completed: 1
questions_remaining: 19
last_completed_question: 1
next_question: 2
question_01: COMPLETED_APPROVED_BY_LEANDRO
question_02: NOT_STARTED
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

O ChatGPT permanece normal fora do contexto MCF. Frases explícitas como “Mestre” / “Ative o MCF” e intenção clara de iniciar/assumir projeto podem iniciar `ACTIVATING`; a ativação só chega a `ACTIVE` após carregar e verificar a metodologia/fonte de verdade aplicável.

### Q2 — Como o MCF deve operar em diferentes ambientes de execução?
Definir relação entre:

- ChatGPT com execução orientada por conectores/serviços remotos;
- Codex com terminal e workspace local;
- Git/GitHub como persistência, colaboração e evidência;
- frequência de commits/push/checkpoints;
- isolamento local, worktrees/branches e recuperação;
- quando abrir PR e quando publicar checkpoint remoto.

**Discovery input já registrado:** proposta de modo Codex `LOCAL_FIRST_REMOTE_CHECKPOINTED`; ainda não decidido.

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
2. criar ou atualizar checkpoint de retomada;
3. atualizar Resume Card;
4. atualizar este roadmap;
5. somente então avançar para a próxima pergunta.

Se a sessão parar em Q5, o GitHub deve indicar sem ambiguidade:

```yaml
Q1_Q5: COMPLETED
last_completed_question: 5
next_question: 6
```

---

## 5. Próxima ação

> **Q2 — Como o MCF deve operar em diferentes ambientes de execução, especialmente ChatGPT remoto e Codex local-first?**

Não iniciar Q3 antes de decisão explícita de LEANDRO sobre Q2.
