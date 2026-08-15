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
- cada pergunta deve trazer alternativas concretas;
- LEANDRO pode escolher uma, combinar várias ou propor outra resposta;
- MESTRE registra decisão, consequências, contradições e pontos abertos;
- decisões relevantes são persistidas no GitHub antes de avançar;
- não repetir pergunta concluída salvo solicitação de LEANDRO;
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
question_07: NOT_STARTED
questions_completed: 6
questions_remaining: 10
current_position: BETWEEN_Q6_AND_Q7
implementation_authorized: false
```

### Q1 — FINALIDADE PRINCIPAL DO MCF

**Status:** `COMPLETED`

Síntese:

- sistema pessoal de trabalho com IA para LEANDRO como foco inicial;
- continuidade durável de projetos como problema central;
- ChatGPT/MESTRE inicialmente como camada cognitiva superior;
- equipes de agentes especializados;
- primeiro provar/maturar no uso real de LEANDRO;
- depois generalizar o core;
- produto comercial fica como possibilidade futura.

### Q2 — CONTINUIDADE DE CONTEXTO

**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Síntese:

- `LAYERED_CONTINUITY_ARCHITECTURE`;
- Framework Memory, Project Memory, Live Operational Memory, Evidence/Raw Archive;
- Project Capsule derivado/versionado, não fonte de verdade;
- memória, evidência, autoridade e estado live são distintos;
- `UNKNOWN` permanece `UNKNOWN` sem evidência;
- progressive disclosure;
- isolamento por projeto;
- cold-start / Continuity Recovery Test.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`.

### Q3 — AGENTE DE VERDADE NO MCF

**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Síntese:

- `Agent Contract` define agente MCF;
- `AGENTE != MODELO`;
- persona isolada não basta;
- lifecycle separado de agenthood;
- independência separada de agenthood;
- `CAPABILITY != AUTHORITY`;
- `IDENTITY CONTINUITY != CAPABILITY CONTINUITY`;
- `AGENT OUTPUT != PROJECT TRUTH`.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md`.

### Q4 — AUTONOMIA DOS AGENTES

**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Síntese:

- `MISSION-BOUNDED + RISK-BASED AUTONOMY`;
- `Authority Envelope` conceitualmente explícito;
- `UNKNOWN_AUTHORITY = DENY`;
- autoelevação de privilégio proibida;
- risco não depende exclusivamente do executor;
- risco cumulativo considerado;
- retries limitados/idempotentes quando aplicável;
- revogação/emergency stop;
- `TEAM_FIRST` para recovery técnico;
- R3/crítico → HUMAN_GATE exclusivamente de LEANDRO.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md`.

### Q5 — ROTEADOR DE MODELOS DE IA

**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Síntese:

- `CAPABILITY_AND_POLICY_BASED_ROUTER`;
- rotear por requisitos verificáveis da tarefa, não por marca/popularidade;
- hard requirements vêm antes de custo/latência/quota;
- router não pode rebaixar hard requirements;
- `UNKNOWN_CAPABILITY = NOT_COMPATIBLE`;
- Model Capability Registry com proveniência, freshness e runtime health;
- model self-claim não é evidência;
- fallback somente para candidatos compatíveis;
- silent capability downgrade proibido;
- fallback limitado e sem routing loops;
- nenhum modelo compatível → `BLOCKED / ESCALATE`;
- routing receipt auditável;
- custo/free tier nunca substituem capacidade mínima, segurança ou autoridade.

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-007.md`.

### Q6 — INDEPENDÊNCIA ENTRE AGENTES E REVISORES

**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Síntese:

- independência deve ser provada por propriedades observáveis da execução, não por persona, nome ou simples troca de modelo;
- `INDEPENDENCE != DIVERSITY`;
- R2+ exige contexto separado, `BLIND_FIRST`, coleta própria de evidências, decisão própria e receipt inicial imutável;
- compartilhar fontes canônicas é permitido; compartilhar veredito/conclusão prévia antes do julgamento inicial contamina a revisão;
- mesmo modelo pode revisar independentemente se contexto/evidência/decisão forem separados;
- modelos diferentes podem não ser independentes se compartilham conclusão contaminante;
- `SELF_DECLARED_INDEPENDENCE != PROOF`;
- `CONSENSUS != TRUTH`;
- `REVIEWER CLAIM != VERIFIED FINDING`;
- majority vote não resolve desacordo técnico por padrão;
- divergência deve ser reconciliada por evidência/teste/adjudicação;
- assurance é proporcional ao risco.

Taxonomia conceitual:

```yaml
R0: SELF_REVIEW
R1: SEPARATE_REVIEW
R2: INDEPENDENT_REVIEW
R3: DIVERSE_INDEPENDENT_REVIEW
R4: EXTERNAL_ASSURANCE
```

Checkpoint: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-008.md`.

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
**Status:** `NEXT / NOT_STARTED`

Definir fluxo sequencial, DAG/graph, split/worker/verifier/merge, paralelismo, dependências, loops, parada, replanejamento, convergência e recovery.

### Q8 — Qual documentação e estado persistente são realmente necessários?
**Status:** `PENDING`

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

Criar/atualizar checkpoint quando houver pelo menos um:

1. conclusão de bloco arquitetônico;
2. aprovação explícita de LEANDRO;
3. mudança relevante de direção;
4. descoberta de lacuna/bug arquitetural;
5. pausa de trabalho/chat;
6. antes de missão grande ao executor/Codex;
7. antes de trocar projeto/sessão.

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

Um novo MESTRE não deve depender da memória do chat anterior.

Ordem:

1. consultar GitHub live;
2. ler `MCF-NEXTGEN-RESUME-CARD.md`;
3. ler checkpoint mais recente;
4. ler este roadmap;
5. ler decisões aprovadas relacionadas às perguntas concluídas;
6. verificar boundaries operacionais;
7. continuar exatamente na `next_question`.

Estado atual:

```yaml
last_completed_question: 6
next_question: 7
instruction: NÃO REPETIR Q1-Q6
```

---

## 6. Critério de conclusão

O questionário termina somente quando:

- Q1–Q16 estiverem respondidas;
- contradições estiverem conciliadas;
- hipóteses abertas estiverem marcadas;
- arquitetura alvo documentada;
- métricas definidas;
- plano de migração definido;
- LEANDRO aprovar especificação final antes de executor/Codex.

Até lá, MCF NextGen permanece **Discovery e Planejamento**, sem implementação autorizada.
