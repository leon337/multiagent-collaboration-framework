# MCF NextGen — Roadmap do Questionário de Discovery

**ID:** `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001`  
**Status:** `ACTIVE_DISCOVERY`  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** amadurecer a arquitetura da **MCF — Fase 1: Reestruturação e Evolução Pós-v1** antes de qualquer grande reestruturação por Codex/executor.

---

## 1. Regra do questionário

O questionário possui **16 perguntas canônicas**.

- uma pergunta por vez;
- LEANDRO pode escolher, combinar ou propor resposta;
- MESTRE registra decisões, consequências, contradições e pontos abertos;
- decisões relevantes são persistidas no GitHub antes de avançar;
- pergunta concluída não é repetida salvo solicitação de LEANDRO;
- hipótese não vira implementação automaticamente;
- ao final, Q1–Q16 serão conciliadas em arquitetura e plano de reestruturação.

---

## 2. Estado atual

```yaml
question_count_total: 16
question_01: COMPLETED
question_02: COMPLETED_APPROVED_BY_LEANDRO
question_03: COMPLETED_APPROVED_BY_LEANDRO
question_04: COMPLETED_APPROVED_BY_LEANDRO
question_05: COMPLETED_APPROVED_BY_LEANDRO
question_06: COMPLETED_APPROVED_BY_LEANDRO
question_07: COMPLETED_APPROVED_BY_LEANDRO
question_08: COMPLETED_APPROVED_BY_LEANDRO
question_09: NOT_STARTED
questions_completed: 8
questions_remaining: 8
current_position: BETWEEN_Q8_AND_Q9
implementation_authorized: false
```

### Q1 — FINALIDADE PRINCIPAL DO MCF
**Status:** `COMPLETED`

Sistema pessoal de trabalho com IA para LEANDRO como foco inicial; continuidade durável; ChatGPT/MESTRE como camada cognitiva superior inicial; equipes especializadas; provar antes de generalizar.

### Q2 — CONTINUIDADE DE CONTEXTO
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`LAYERED_CONTINUITY_ARCHITECTURE`; memória, evidência, autoridade e estado live separados; Project Capsule derivado; `UNKNOWN` permanece `UNKNOWN`; cold-start/Continuity Recovery Test.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`.

### Q3 — AGENTE DE VERDADE NO MCF
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`Agent Contract`; `AGENTE != MODELO`; `CAPABILITY != AUTHORITY`; `IDENTITY CONTINUITY != CAPABILITY CONTINUITY`; `AGENT OUTPUT != PROJECT TRUTH`.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md`.

### Q4 — AUTONOMIA DOS AGENTES
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`MISSION-BOUNDED + RISK-BASED AUTONOMY`; `Authority Envelope`; `UNKNOWN_AUTHORITY = DENY`; retries limitados; `TEAM_FIRST`; HUMAN_GATE exclusivamente de LEANDRO em R3/crítico.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md`.

### Q5 — ROTEADOR DE MODELOS DE IA
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`CAPABILITY_AND_POLICY_BASED_ROUTER`; hard requirements antes de custo; `UNKNOWN_CAPABILITY = NOT_COMPATIBLE`; fallback compatível/limitado; sem silent downgrade ou routing loops; routing receipt auditável.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007.md`.

### Q6 — INDEPENDÊNCIA ENTRE AGENTES E REVISORES
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`INDEPENDENCE != DIVERSITY`; R2+ exige contexto separado, `BLIND_FIRST`, evidência própria, decisão própria e receipt; `CONSENSUS != TRUTH`; assurance R0–R4 proporcional ao risco.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-008.md`.

### Q7 — ORQUESTRAÇÃO DO TRABALHO
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`; outer graph acíclico; loops isolados/limitados; paralelismo seguro; joins explícitos; replanning versionado; Complexity Budget; staleness control; Completion Contract.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-009.md`.

### Q8 — DOCUMENTAÇÃO E ESTADO PERSISTENTE
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Decisão: `LAYERED_CANONICAL_PERSISTENCE`.

Síntese:

- camadas lógicas: canonical knowledge, operational state, transition ledger, evidence e derived views;
- camadas lógicas não implicam cinco sistemas físicos;
- `ONE CLAIM CLASS -> ONE AUTHORITATIVE RESOLUTION POLICY`;
- `LIVE_OPERATIONAL_STATE != DOCUMENTATION`;
- conversa não é project truth;
- derived views são regeneráveis, não autoritativas, e devem carregar freshness;
- estado e transition ledger exigem boundary atômico ou garantia equivalente; dual write inconsistente é proibido;
- Event Sourcing completo não é obrigatório;
- checkpoints são boundaries ancorados em versões/cursors, não cópias completas da história;
- evidências materiais exigem integridade/proveniência;
- Raw Archive é governado por minimização, retenção, redaction e acesso;
- secrets não são promovidos à memória geral;
- schema evolution, supersession lineage e proveniência de HUMAN_GATE são obrigatórios;
- backup sem restauração comprovada não basta; restorability deve ser testada;
- tecnologias físicas, RPO/RTO, placement e enforcement concreto ficam para Q11/Q12/Q16.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-010.md`.

---

## 3. As 16 perguntas canônicas

### Q1 — Qual é a finalidade principal do MCF?
**Status:** `COMPLETED`

### Q2 — O que exatamente significa “não perder o contexto de um projeto”?
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

### Q3 — O que é um agente de verdade no MCF?
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

### Q4 — Qual nível de autonomia os agentes devem possuir?
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

### Q5 — Como deve funcionar o Roteador de Modelos de IA?
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

### Q6 — O que significa independência entre agentes e revisores?
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

### Q7 — Como o trabalho deve ser orquestrado: pipeline, loops, graph ou paralelo?
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

### Q8 — Qual documentação e estado persistente são realmente necessários?
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Decisão consolidada no `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-010.md`.

### Q9 — Como deve ser a experiência humana e a observabilidade?
**Status:** `NEXT / NOT_STARTED`

Definir timeline, Central de Perguntas e Decisões, dashboard, estados/bloqueios/próxima ação, perguntas guiadas, nível de detalhe, trabalho em tempo real e simplicidade para usuário não técnico.

### Q10 — O que pertence ao MCF Core e o que deve ser Factory/Plugin/Perfil?
**Status:** `PENDING`

### Q11 — Como deve funcionar a infraestrutura e o placement de serviços?
**Status:** `PENDING`

### Q12 — Quais controles de segurança, permissões e gates são essenciais?
**Status:** `PENDING`

### Q13 — Como provar que o MCF vale o custo e a complexidade?
**Status:** `PENDING`

### Q14 — Como validar portabilidade e utilidade fora do ambiente atual?
**Status:** `PENDING`

### Q15 — O que deve ser preservado, simplificado, removido ou substituído?
**Status:** `PENDING`

Regra: **nenhuma complexidade é preservada apenas porque já existe**.

### Q16 — Qual é a arquitetura final da Fase 1 e o GO/NO-GO?
**Status:** `PENDING`

---

## 4. Política de checkpoint

Criar/atualizar checkpoint quando houver: conclusão de bloco arquitetônico; aprovação explícita de LEANDRO; mudança relevante; descoberta de lacuna/bug; pausa; antes de missão grande; antes de troca de projeto/sessão.

Campos mínimos:

```yaml
questionnaire_version:
last_completed_question:
next_question:
approved_decisions:
working_hypotheses:
rejected_hypotheses:
open_questions:
repo_live_state_reference:
next_action:
resume_instructions:
```

---

## 5. Protocolo de retomada

1. consultar GitHub live;
2. ler `MCF-NEXTGEN-RESUME-CARD.md`;
3. ler checkpoint mais recente;
4. ler este roadmap;
5. ler decisões aprovadas relacionadas às perguntas concluídas;
6. verificar boundaries operacionais;
7. continuar exatamente na `next_question`.

```yaml
last_completed_question: 8
next_question: 9
instruction: NÃO REPETIR Q1-Q8
```

---

## 6. Critério de conclusão

O questionário termina somente quando Q1–Q16 estiverem respondidas, contradições conciliadas, hipóteses abertas marcadas, arquitetura alvo/métricas/plano de migração definidos e LEANDRO aprovar a especificação final.

Até lá, MCF NextGen permanece **Discovery e Planejamento**, sem implementação autorizada.
