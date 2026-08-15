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
- MESTRE deve registrar a decisão, consequências, contradições e pontos ainda abertos;
- decisões relevantes devem ser persistidas no GitHub antes de avançar;
- não repetir pergunta já concluída salvo solicitação de LEANDRO;
- não transformar hipótese em implementação automaticamente;
- ao final, todas as respostas serão conciliadas em uma arquitetura e plano de reestruturação.

---

## 2. Estado atual

```yaml
question_count_total: 16
question_01: COMPLETED
question_02: COMPLETED_APPROVED_BY_LEANDRO
question_03: COMPLETED_APPROVED_BY_LEANDRO
question_04: COMPLETED_APPROVED_BY_LEANDRO
question_05: NOT_STARTED
questions_completed: 4
questions_remaining: 12
current_position: BETWEEN_Q4_AND_Q5
implementation_authorized: false
```

### Pergunta 1 — FINALIDADE PRINCIPAL DO MCF

**Status:** `COMPLETED`

Síntese aprovada/consolidada:

- foco primário: sistema pessoal de trabalho com IA para LEANDRO;
- problema central: continuidade durável de projetos sem depender do contexto de chat/memória de modelo;
- ChatGPT como camada cognitiva superior na configuração inicial;
- equipes de agentes especializados para execução coordenada;
- redução de custo e de dependências externas desnecessárias;
- primeiro provar e amadurecer no uso real de LEANDRO;
- depois generalizar o core para terceiros;
- laboratório multiagente continua sendo dimensão relevante;
- produto comercial é possibilidade futura, não prioridade inicial.

### Pergunta 2 — CONTINUIDADE DE CONTEXTO

**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Síntese aprovada/consolidada:

- continuidade significa permitir que outro chat, modelo, agente ou humano reconstrua fielmente o estado relevante de um projeto sem depender da memória do chat anterior;
- arquitetura conceitual em camadas: Framework Memory, Project Memory, Live Operational Memory e Evidence/Raw Archive;
- o `Project Capsule` é uma projeção compacta, versionada e derivada para retomada; não é fonte de verdade;
- memória, evidência, autoridade e estado live são conceitos distintos;
- estado volátil deve ser revalidado antes de ação material;
- fatos e decisões devem preservar proveniência e estado semântico;
- ausência de evidência permanece `UNKNOWN`; hipótese não pode virar fato silenciosamente;
- ações/decisões críticas exigem verificação e gates proporcionais ao risco;
- múltiplos projetos precisam de isolamento, controle de acesso, retenção, redaction de secrets e schema versionado;
- contexto deve usar progressive disclosure, com histórico/evidências consultados sob demanda;
- continuidade deve ser provada por `Continuity Recovery Test`/cold-start, sem exigir que LEANDRO reconte o projeto;
- detalhes de agente, autonomia, routing, revisão independente, persistência concreta, segurança completa, métricas e portabilidade permanecem para Q3–Q15.

Checkpoint canônico da aprovação: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`.

### Pergunta 3 — AGENTE DE VERDADE NO MCF

**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Síntese aprovada/consolidada:

- um agente MCF é uma entidade operacional identificável com identidade, papel, objetivos, capacidades, limites de autoridade, contratos de entrada/saída, política de decisão, estado e rastreabilidade;
- `AGENTE != MODELO`; o modelo é backend cognitivo, não identidade;
- persona/nome/instruções, isoladamente, não satisfazem o `Agent Contract`;
- lifecycle é separado de agenthood: agentes podem ser `EPHEMERAL`, `SESSION`, `PROJECT` ou `PERSISTENT`;
- independência é separada de agenthood e deve ser descrita por perfil multidimensional; critérios formais ficam para Q6;
- `CAPABILITY != AUTHORITY`;
- `IDENTITY CONTINUITY != CAPABILITY CONTINUITY`; troca de modelo exige validação de capacidades;
- agentes não devem manter cópias concorrentes não governadas da verdade do projeto;
- `AGENT OUTPUT != PROJECT TRUTH`; claims de agentes exigem evidência/autoridade aplicável antes de virar fato oficial, decisão ou estado operacional;
- detalhes de autonomia, routing, independência, persistência concreta e segurança ficam deliberadamente para perguntas posteriores.

Checkpoint canônico da aprovação: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md`.

### Pergunta 4 — AUTONOMIA DOS AGENTES

**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Síntese aprovada/consolidada:

- autonomia do MCF será `MISSION-BOUNDED + RISK-BASED`;
- toda missão relevante deve possuir `Authority Envelope` conceitualmente explícito;
- agentes podem decidir/executar dentro desse envelope, mas não ampliar a própria autoridade;
- `CAPABILITY != AUTHORITY` e `UNKNOWN_AUTHORITY = DENY`;
- autoelevação de privilégio é proibida;
- conteúdo externo não pode expandir autoridade;
- estado live deve ser revalidado antes de ação material;
- classificação de risco não deve depender exclusivamente do agente executor;
- risco cumulativo por sequência deve ser considerado;
- retries devem ser limitados e idempotentes quando aplicável;
- revogação/emergency stop é requisito;
- a equipe deve tentar recuperação técnica antes de envolver LEANDRO (`TEAM_FIRST`);
- R3/crítico exige `HUMAN_GATE` exclusivamente de LEANDRO;
- detalhes de Policy Engine, segurança, permissões e gates concretos ficam para perguntas posteriores, especialmente Q12.

Taxonomia conceitual:

```yaml
R0_LOW: EXECUTE_WITHIN_ENVELOPE
R1_MEDIUM: EXECUTE_WITH_VERIFICATION_AND_EVIDENCE
R2_HIGH: REQUIRE_TECHNICAL_GATE_OR_DUAL_VERIFICATION
R3_CRITICAL: REQUIRE_HUMAN_GATE_LEANDRO
```

Checkpoint canônico da aprovação: `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md`.

---

## 3. As 16 perguntas canônicas

### Q1 — Qual é a finalidade principal do MCF?

**Status:** `COMPLETED`

Define propósito, usuário prioritário, problema central e ordem entre uso pessoal, framework público, laboratório e produto.

### Q2 — O que exatamente significa “não perder o contexto de um projeto”?

**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Decisão consolidada no `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-004.md`.

### Q3 — O que é um agente de verdade no MCF?

**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Decisão consolidada no `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-005.md`.

### Q4 — Qual nível de autonomia os agentes devem possuir?

**Status:** `COMPLETED / APPROVED_BY_LEANDRO`

Decisão consolidada no `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-006.md`.

### Q5 — Como deve funcionar o Roteador de Modelos de IA?

**Status:** `NEXT / NOT_STARTED`

Definir:

- modelo preferencial e fallbacks;
- quotas;
- custo;
- qualidade mínima;
- contexto;
- coding/reasoning/vision/tools;
- troca de modelo sem perda de identidade/estado;
- políticas de provider e indisponibilidade.

### Q6 — O que significa independência entre agentes e revisores?

**Status:** `PENDING`

Definir níveis:

- separação funcional;
- sessão/contexto separado;
- modelo diferente;
- provider diferente;
- autoridade diferente;
- auditoria externa humana;
- critérios mínimos para chamar algo de revisão independente.

### Q7 — Como o trabalho deve ser orquestrado: pipeline, loops, graph ou paralelo?

**Status:** `PENDING`

Definir:

- fluxo sequencial;
- DAG/graph;
- split/worker/verifier/merge;
- paralelismo;
- dependências;
- loop engineering;
- critérios de parada;
- replanejamento;
- convergência e recuperação.

### Q8 — Qual documentação e estado persistente são realmente necessários?

**Status:** `PENDING`

Definir:

- documentação mínima suficiente;
- checkpoint versus log bruto;
- decisões versus conversas;
- handoff compacto;
- deduplicação;
- versionamento;
- GitHub como memória institucional;
- banco/event store para estado vivo;
- artifacts para evidências pesadas.

### Q9 — Como deve ser a experiência humana e a observabilidade?

**Status:** `PENDING`

Definir:

- Linha do Tempo dos Agentes;
- Central de Perguntas e Decisões;
- dashboard de projetos;
- estados, bloqueios e próxima ação;
- perguntas guiadas;
- nível de detalhe;
- visualização do trabalho em tempo real;
- simplicidade para usuário não técnico.

### Q10 — O que pertence ao MCF Core e o que deve ser uma Factory/Plugin/Perfil?

**Status:** `PENDING`

Definir:

- mission engine;
- memória;
- agent registry;
- handoffs;
- routing;
- permissions;
- gates;
- evidence/recovery/observability;
- factories de software, vídeo, redes sociais, automações etc.;
- evitar core monolítico.

### Q11 — Como deve funcionar a infraestrutura e o placement de serviços?

**Status:** `PENDING`

Definir:

- self-host versus SaaS;
- VPS como infraestrutura possível, não dependência conceitual;
- containers;
- bancos;
- filas;
- MCPs;
- workers;
- isolamento por projeto;
- backups/restore;
- portabilidade;
- critérios econômicos e técnicos de placement.

### Q12 — Quais controles de segurança, permissões e gates são essenciais?

**Status:** `PENDING`

Definir:

- least privilege;
- autenticação de agentes;
- sandboxing;
- secrets;
- prompt injection;
- permissões granulares;
- gates proporcionais ao risco;
- provider capability validation;
- evitar controles impossíveis ou meramente documentais.

### Q13 — Como provar que o MCF vale o custo e a complexidade?

**Status:** `PENDING`

Definir métricas:

- tempo;
- tokens/custo;
- retrabalho;
- defects escaped;
- intervenções de LEANDRO;
- contexto perdido;
- tempo de retomada;
- qualidade final;
- recuperação;
- comparação com workflow simples/baseline.

### Q14 — Como validar portabilidade e utilidade fora do ambiente atual?

**Status:** `PENDING`

Definir:

- outro chat;
- outro modelo;
- outro provider;
- outro humano;
- cold-start de usuário externo;
- outro repositório/projeto;
- testes de continuidade sem histórico bruto;
- limites do ecossistema OpenAI atual.

### Q15 — O que deve ser preservado, simplificado, removido ou substituído?

**Status:** `PENDING`

Executar ablation/revisão crítica de:

- 29 agentes;
- gates;
- PRFs;
- handoffs;
- documentação;
- control agents;
- social UI;
- skills;
- runtime;
- protocolos;
- tudo que não provar valor suficiente.

Regra: **nenhuma complexidade é preservada apenas porque já existe**.

### Q16 — Qual é a arquitetura final da Fase 1 e o GO/NO-GO?

**Status:** `PENDING`

Consolidar propósito, memória, agentes, modelos, autonomia, graph/loops, UX, core/factories, infraestrutura, segurança, métricas, validação, simplificações, dependências, riscos, arquitetura alvo, plano de migração, critérios de aceite, missão estruturada para Codex/executor e decisão GO / CONDITIONAL GO / NO-GO.

---

## 4. Política de checkpoint do questionário

Não é necessário criar um novo arquivo a cada resposta trivial. Deve haver checkpoint quando ocorrer pelo menos um dos seguintes:

1. conclusão de um bloco de decisões arquitetônicas;
2. aprovação explícita de LEANDRO;
3. mudança de direção relevante;
4. descoberta de lacuna/bug que altere a arquitetura;
5. pausa de trabalho/chat;
6. antes de entregar uma missão grande ao executor/Codex;
7. antes de trocar de projeto ou sessão.

Cada checkpoint deve registrar:

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

## 5. Protocolo de retomada em outro chat

Um novo MESTRE NÃO deve depender da memória do chat anterior.

Ordem de retomada:

1. consultar GitHub live;
2. ler `MCF-NEXTGEN-RESUME-CARD.md`;
3. ler o checkpoint mais recente do discovery;
4. ler este roadmap do questionário;
5. ler decisões explicitamente aprovadas relacionadas às perguntas concluídas;
6. verificar boundaries operacionais em andamento;
7. continuar exatamente na `next_question` registrada.

### Estado de retomada atual

```yaml
last_completed_question: 4
next_question: 5
instruction: NÃO REPETIR Q1, Q2, Q3 OU Q4
```

---

## 6. Critério de conclusão do questionário

O questionário termina somente quando:

- Q1–Q16 estiverem respondidas;
- decisões contraditórias forem conciliadas;
- hipóteses não resolvidas estiverem explicitamente marcadas;
- arquitetura alvo estiver documentada;
- métricas de sucesso estiverem definidas;
- plano de migração da Fase Zero para Fase 1 estiver definido;
- LEANDRO aprovar a especificação final antes de entrega ao executor/Codex.

Até lá, `MCF NextGen` permanece **Discovery e Planejamento**, não implementação autorizada.
