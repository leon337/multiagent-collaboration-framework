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
questions_completed: 4
questions_remaining: 16
last_completed_question: 4
next_question: 5
question_01: COMPLETED_APPROVED_BY_LEANDRO
question_02: COMPLETED_APPROVED_BY_LEANDRO
question_03: COMPLETED_APPROVED_BY_LEANDRO
question_04: COMPLETED_APPROVED_BY_LEANDRO
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

- `CHATGPT_REMOTE` → conectores/ferramentas remotas;
- `CODEX_LOCAL` → terminal/workspace/Git local;
- GitHub continua memória institucional, checkpoint, CI, revisão e integração;
- checkpoint remoto obrigatório em boundaries semânticos/de risco;
- `EDIT != COMMIT != PUSH != PR`;
- `LOCAL_UNCHECKPOINTED != REMOTE_CHECKPOINTED`;
- boundary material/governado sem evidência remota aplicável → `FAIL_CLOSED`.

### Q3 — Como o bootstrap encontra e verifica a versão/metodologia vigente?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `VERIFIED_TWO_STAGE_BOOTSTRAP` — Opção D.

- locator mínimo aponta para repositório oficial e `docs/bootstrap/MCF-BOOTSTRAP-INDEX.yaml`;
- resolução segue `VALID_PROJECT_PIN > EXPLICIT_LEANDRO_SELECTION > CURRENT_STABLE`;
- metodologia carregada deve ser pinada por tag/SHA imutável;
- projetos não fazem silent mid-mission upgrade;
- `DISCOVERY`, `PLANNING`, `RC`, `EXPERIMENTAL`, `ALPHA` e `BETA` não são defaults operacionais;
- `ACTIVE` exige repositório, versão, referência imutável e bootstrap verificados.

### Q4 — Como deve funcionar o fail-closed quando GitHub/bootstrap/fonte canônica não estiver acessível?
**Estado:** `COMPLETED_APPROVED_BY_LEANDRO`  
**Decisão:** `VERIFIED_DEGRADED_OPERATION_WITH_FAIL_CLOSED_BOUNDARIES` — Opção D.

- projeto novo sem bootstrap verificável fica `ACTIVATING_BLOCKED`;
- projeto existente pode entrar em `ACTIVE_DEGRADED_VERIFIED` somente com project pin/metodologia local já verificáveis;
- trabalho degradado permitido restringe-se a análise, planejamento, documentação local, testes, mudanças reversíveis e commits locais;
- merge, deploy, release, publicação, integração final, upgrade de metodologia, mudança de autoridade, review terminal e efeito externo material sem evidência remota ficam bloqueados;
- inconsistência entre fontes produz `CANONICAL_CONFLICT_BLOCKED` e `FAIL_CLOSED`;
- cache local prova sua própria identidade, não qual é a `CURRENT_STABLE`;
- retorno do remoto exige revalidação canônica, reconciliação do `CHECKPOINT_DEBT` e `Degraded Operation Receipt`;
- autoridade de LEANDRO não substitui evidência técnica ausente.

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

> **Q5 — Quais modos de entrada de projeto o MCF deve reconhecer?**

Não iniciar Q6 antes de decisão explícita de LEANDRO sobre Q5.
