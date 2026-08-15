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
- cada pergunta traz alternativas concretas;
- LEANDRO pode escolher, combinar ou propor outra resposta;
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
question_08: NOT_STARTED
questions_completed: 7
questions_remaining: 9
current_position: BETWEEN_Q7_AND_Q8
implementation_authorized: false
```

### Q1 — FINALIDADE PRINCIPAL DO MCF
**Status:** `COMPLETED`

Sistema pessoal de trabalho com IA para LEANDRO como foco inicial; continuidade durável de projetos como problema central; ChatGPT/MESTRE como camada cognitiva superior inicial; equipes de agentes especializados; primeiro provar no uso real, depois generalizar.

### Q2 — CONTINUIDADE DE CONTEXTO
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`LAYERED_CONTINUITY_ARCHITECTURE`; Framework Memory, Project Memory, Live Operational Memory, Evidence/Raw Archive; Project Capsule derivado/versionado e não fonte de verdade; `UNKNOWN` permanece `UNKNOWN` sem evidência; progressive disclosure; isolamento por projeto; cold-start/Continuity Recovery Test.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`.

### Q3 — AGENTE DE VERDADE NO MCF
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`Agent Contract`; `AGENTE != MODELO`; persona isolada não basta; lifecycle e independência separados de agenthood; `CAPABILITY != AUTHORITY`; `IDENTITY CONTINUITY != CAPABILITY CONTINUITY`; `AGENT OUTPUT != PROJECT TRUTH`.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md`.

### Q4 — AUTONOMIA DOS AGENTES
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`MISSION-BOUNDED + RISK-BASED AUTONOMY`; `Authority Envelope`; `UNKNOWN_AUTHORITY = DENY`; autoelevação proibida; risco cumulativo; retries limitados/idempotentes quando aplicável; emergency stop; `TEAM_FIRST`; R3/crítico → HUMAN_GATE exclusivamente de LEANDRO.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md`.

### Q5 — ROTEADOR DE MODELOS DE IA
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`CAPABILITY_AND_POLICY_BASED_ROUTER`; requisitos verificáveis antes de marca/custo; hard requirements não podem ser rebaixados; `UNKNOWN_CAPABILITY = NOT_COMPATIBLE`; registry com proveniência/freshness/health; fallback somente compatível, limitado e sem loops; nenhum candidato compatível → `BLOCKED / ESCALATE`; routing receipt auditável.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007.md`.

### Q6 — INDEPENDÊNCIA ENTRE AGENTES E REVISORES
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

`INDEPENDENCE != DIVERSITY`; R2+ exige contexto separado, `BLIND_FIRST`, evidência própria, decisão própria e receipt inicial imutável; `SELF_DECLARED_INDEPENDENCE != PROOF`; `CONSENSUS != TRUTH`; majority vote não resolve desacordo técnico por padrão; assurance proporcional ao risco.

Taxonomia: `R0 SELF_REVIEW`, `R1 SEPARATE_REVIEW`, `R2 INDEPENDENT_REVIEW`, `R3 DIVERSE_INDEPENDENT_REVIEW`, `R4 EXTERNAL_ASSURANCE`.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-008.md`.

### Q7 — ORQUESTRAÇÃO DO TRABALHO
**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Decisão: `HIERARCHICAL_GOVERNED_EXECUTION_GRAPH`.

Síntese:

- grafo principal com dependências acíclicas e transições explícitas;
- loops somente como subfluxos delimitados, com limites, progresso verificável e stop conditions;
- paralelismo somente quando dependências permitirem;
- mutações concorrentes conflitantes exigem coordenação;
- joins possuem contrato explícito;
- falha parcial não pode avançar silenciosamente;
- replanning cria nova versão e não reescreve histórico;
- replanning não amplia autoridade nem remove gates obrigatórios;
- `Complexity Budget` limita profundidade/fanout/tarefas/agentes/custo/tempo;
- spawning ilimitado proibido;
- outputs obsoletos devem ser rejeitados/revalidados/cancelados/superseded;
- integração explícita substitui `last writer wins`;
- ações com side effects exigem idempotência/controle equivalente e compensação quando aplicável;
- missão termina por `Completion Contract`, não porque o grafo simplesmente parou.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-009.md`.

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

Decisão consolidada no `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-009.md`.

### Q8 — Qual documentação e estado persistente são realmente necessários?
**Status:** `NEXT / NOT_STARTED`

Definir documentação mínima, checkpoint vs log bruto, decisões vs conversas, handoff, deduplicação, versionamento, GitHub como memória institucional, banco/event store para estado vivo e artifacts para evidências.

### Q9 — Como deve ser a experiência humana e a observabilidade?
**Status:** `PENDING`

Definir timeline, Central de Perguntas e Decisões, dashboard, estados/bloqueios/próxima ação, perguntas guiadas, detalhe e simplicidade para usuário não técnico.

### Q10 — O que pertence ao MCF Core e o que deve ser Factory/Plugin/Perfil?
**Status:** `PENDING`

Definir mission engine, memória, registry, handoffs, routing, permissions, gates, evidence/recovery/observability e factories especializadas, evitando core monolítico.

### Q11 — Como deve funcionar a infraestrutura e o placement de serviços?
**Status:** `PENDING`

Definir self-host/SaaS, VPS como opção e não dependência, containers, bancos, filas, MCPs, workers, isolamento, backup/restore, portabilidade e critérios econômicos/técnicos.

### Q12 — Quais controles de segurança, permissões e gates são essenciais?
**Status:** `PENDING`

Definir least privilege, autenticação, sandboxing, secrets, prompt injection, permissões granulares, gates proporcionais ao risco e capability validation.

### Q13 — Como provar que o MCF vale o custo e a complexidade?
**Status:** `PENDING`

Definir métricas de tempo, tokens/custo, retrabalho, defects escaped, intervenções de LEANDRO, contexto perdido, retomada, qualidade, recovery e baseline simples.

### Q14 — Como validar portabilidade e utilidade fora do ambiente atual?
**Status:** `PENDING`

Definir outro chat, modelo, provider, humano, cold-start externo, outro projeto/repo, testes sem histórico bruto e limites do ecossistema atual.

### Q15 — O que deve ser preservado, simplificado, removido ou substituído?
**Status:** `PENDING`

Executar ablation/revisão crítica de agentes, gates, PRFs, handoffs, documentação, control agents, social UI, skills, runtime e protocolos.

Regra: **nenhuma complexidade é preservada apenas porque já existe**.

### Q16 — Qual é a arquitetura final da Fase 1 e o GO/NO-GO?
**Status:** `PENDING`

Consolidar propósito, memória, agentes, modelos, autonomia, graph/loops, UX, core/factories, infraestrutura, segurança, métricas, validação, simplificações, dependências, riscos, arquitetura alvo, plano de migração, critérios de aceite e decisão GO / CONDITIONAL GO / NO-GO.

---

## 4. Política de checkpoint

Criar/atualizar checkpoint quando houver: conclusão de bloco arquitetônico; aprovação explícita de LEANDRO; mudança relevante; descoberta de lacuna/bug; pausa; antes de missão grande ao executor/Codex; antes de troca de projeto/sessão.

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

Estado atual:

```yaml
last_completed_question: 7
next_question: 8
instruction: NÃO REPETIR Q1-Q7
```

---

## 6. Critério de conclusão

O questionário termina somente quando Q1–Q16 estiverem respondidas, contradições conciliadas, hipóteses abertas marcadas, arquitetura alvo e métricas documentadas, plano de migração definido e LEANDRO aprovar a especificação final antes de executor/Codex.

Até lá, MCF NextGen permanece **Discovery e Planejamento**, sem implementação autorizada.
