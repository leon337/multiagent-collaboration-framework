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
question_02: NOT_STARTED
questions_completed: 1
questions_remaining: 15
current_position: BETWEEN_Q1_AND_Q2
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

---

## 3. As 16 perguntas canônicas

### Q1 — Qual é a finalidade principal do MCF?

**Status:** `COMPLETED`

Define propósito, usuário prioritário, problema central e ordem entre uso pessoal, framework público, laboratório e produto.

### Q2 — O que exatamente significa “não perder o contexto de um projeto”?

**Status:** `NEXT / NOT_STARTED`

Definir:

- o que precisa sobreviver a uma pausa;
- o que não precisa ser persistido;
- por quanto tempo;
- quem pode ler;
- fontes de verdade;
- nível de reconstrução esperado;
- Framework Memory, Project Memory e Live Operational Memory;
- contrato mínimo do **Pacote de Continuidade do Projeto** (`Project Capsule`).

### Q3 — O que é um agente de verdade no MCF?

**Status:** `PENDING`

Definir:

- identidade do agente;
- papel, skills, tools, permissões, memória e critérios;
- relação agente ↔ modelo;
- persistência de identidade;
- agentes simulados, isolados e executores reais;
- quando uma persona não deve ser chamada de agente independente.

### Q4 — Qual nível de autonomia os agentes devem possuir?

**Status:** `PENDING`

Definir:

- o que podem decidir sozinhos;
- o que podem executar sozinhos;
- limites de autoridade;
- diferença entre HUMAN_GATE e dependência operacional humana;
- escalonamento;
- stop conditions;
- retries;
- ações reversíveis versus irreversíveis.

### Q5 — Como deve funcionar o Roteador de Modelos de IA?

**Status:** `PENDING`

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

Consolidar:

- propósito;
- memória;
- agentes;
- modelos;
- autonomia;
- graph/loops;
- UX;
- core/factories;
- infraestrutura;
- segurança;
- métricas;
- validação;
- simplificações;
- dependências;
- riscos;
- arquitetura alvo;
- plano de migração;
- critérios de aceite;
- missão estruturada para Codex/executor;
- decisão GO / CONDITIONAL GO / NO-GO.

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
last_completed_question: 1
next_question: 2
instruction: NÃO REPETIR Q1
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