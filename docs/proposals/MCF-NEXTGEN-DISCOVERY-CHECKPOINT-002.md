# MCF NextGen — Discovery Checkpoint 002

**ID:** `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-002`  
**Status:** `DURABLE_SESSION_CHECKPOINT`  
**Data de referência:** 2026-08-14  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch:** `planning/mcf-nextgen-discovery`  
**Objetivo:** permitir encerrar a sessão e retomar em outro chat sem reconstruir manualmente as decisões e o ponto de parada.

---

# 1. Regra de leitura

Este checkpoint é uma **destilação do conhecimento e das decisões**, não uma cópia literal do chat.

Ele deve ser lido em conjunto com:

1. `MCF-NEXTGEN-DISCOVERY-CHECKPOINT-001.md`;
2. `MCF-NEXTGEN-NOMENCLATURE-DECISION-001.md`;
3. `MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`;
4. `MCF-MASTER-ROADMAP-001.md`;
5. `MCF-NEXTGEN-RESUME-CARD.md`;
6. GitHub live para estados mutáveis.

Se houver conflito:

1. instrução atual de LEANDRO;
2. GitHub live;
3. documentação canônica vigente;
4. checkpoint mais novo;
5. checkpoint mais antigo.

---

# 2. Ponto exato do discovery

```yaml
phase: MCF NextGen — Discovery e Planejamento
canonical_future_phase: MCF — Fase 1: Reestruturação e Evolução Pós-v1
questionnaire_total: 16
last_completed_question: 1
next_question: 2
question_2_started: false
implementation_of_phase_1_authorized: false
final_architecture_approved: false
```

**Instrução para próximo chat:** NÃO repetir Q1. Retomar em Q2 após ler os artefatos de continuidade e revalidar o estado live.

---

# 3. Pergunta 1 — síntese consolidada

A finalidade principal do MCF foi esclarecida em profundidade.

## 3.1 Origem

MCF nasceu de uma necessidade prática de LEANDRO:

- desenvolver ideias e projetos grandes sem depender continuamente de ferramentas caras;
- usar ChatGPT como capacidade cognitiva forte;
- distribuir trabalho entre papéis/agentes especializados;
- preservar contexto, decisões, evidências e evolução fora da memória transitória do chat;
- poder parar um projeto e retomá-lo dias ou semanas depois;
- permitir que outra IA, outro modelo, outro chat, outro humano ou outra equipe continue o trabalho sem reconstrução manual completa.

## 3.2 Prioridade

Ordem estratégica atual:

1. sistema pessoal de trabalho com IA para LEANDRO;
2. continuidade/memória durável;
3. coordenação especializada de agentes;
4. autonomia operacional progressiva;
5. redução de custo e dependências desnecessárias;
6. laboratório real de sistemas multiagentes;
7. generalização para terceiros depois de prova real;
8. produto comercial apenas como possibilidade futura.

## 3.3 Tese atual

> O MCF pretende permitir que LEANDRO transforme ideias em projetos executados por equipes de agentes, preservando memória, decisões, evidências, estado e continuidade de modo que projetos possam ser interrompidos, delegados e retomados sem dependência da memória humana, do contexto de um chat, de um modelo específico ou de uma equipe específica.

---

# 4. Nomenclatura aprovada por LEANDRO

Nomenclatura canônica:

- **Fase Zero — Construir para aprender**;
- **MCF — Fase 1: Reestruturação e Evolução Pós-v1**;
- **MCF NextGen** como nome curto;
- estágio atual: **MCF NextGen — Discovery e Planejamento**;
- **Fase 2 — Provar e generalizar**.

Glossário didático relevante:

- Project Capsule → **Pacote de Continuidade do Projeto**;
- Model Router → **Roteador de Modelos de IA**;
- Activity Feed → **Linha do Tempo dos Agentes**;
- Interaction Center → **Central de Perguntas e Decisões**;
- Durable Memory → **Memória Durável**;
- Live Operational State → **Estado Operacional em Tempo Real**.

---

# 5. Memória e continuidade — hipóteses já amadurecidas

A conversa mostrou que o problema não é preservar cada frase do chat, mas preservar o conhecimento necessário para continuidade.

Hipótese de três camadas:

## 5.1 Framework Memory

Conhecimento universal do MCF:

- agentes/tipos;
- skills;
- protocolos;
- schemas;
- regras;
- governança;
- runtime contracts.

Fonte principal candidata: repositório do MCF.

## 5.2 Project Memory

Conhecimento específico do projeto:

- propósito;
- requisitos;
- decisões;
- arquitetura;
- backlog;
- riscos;
- estado;
- releases;
- checkpoints;
- evidências relevantes.

Fonte principal candidata: repositório do próprio projeto.

## 5.3 Live Operational Memory

Estado mutável de curto prazo:

- tarefa ativa;
- filas;
- workers;
- heartbeats;
- locks;
- quotas;
- sessões;
- eventos recentes.

Fonte candidata: runtime / database / event store.

## 5.4 Pacote de Continuidade do Projeto

Hipótese forte ainda em estudo: cada projeto deve possuir um contrato de informação suficiente para retomada por executor novo sem histórico bruto do chat.

Critério:

> Um executor novo consegue retomar corretamente usando apenas as fontes duráveis autorizadas?

---

# 6. Multi-project

MCF deve permitir múltiplos projetos em paralelo com contexto isolado.

Exemplo conceitual:

```text
LEANDRO
  ↓
MCF Control Plane
  ├── Projeto A → equipe/memória/estado A
  ├── Projeto B → equipe/memória/estado B
  └── Projeto C → equipe/memória/estado C
```

Um mesmo tipo de agente pode existir em vários projetos, mas seu estado operacional não deve vazar entre projetos.

---

# 7. Agente e modelo

Decisão conceitual forte:

> `AGENTE != MODELO`

Agente deve ter identidade operacional própria:

- papel;
- especialidade;
- skills;
- tools;
- permissões;
- missão;
- estado;
- critérios;
- memória necessária.

O modelo é recurso cognitivo selecionável.

Se o provider/modelo preferido atingir quota ou indisponibilidade, um **Roteador de Modelos de IA** deve escolher fallback compatível sem perder a identidade/estado do agente.

---

# 8. Papel do ChatGPT

Na configuração inicial pretendida:

- ChatGPT/MESTRE é a camada cognitiva superior e de abstração;
- interpreta a intenção de LEANDRO;
- decompõe problemas;
- realiza raciocínio complexo;
- integra/sintetiza resultados;
- pode gerar/revisar código pesado;
- delega trabalhos especializados a agentes/modelos quando adequado;
- transforma complexidade interna em interação simples.

Isso não significa que todos os agentes devam usar o mesmo modelo.

---

# 9. APIs de IA versus infraestrutura própria

Correção importante consolidada:

- APIs gratuitas/econômicas de modelos continuam parte da estratégia;
- quotas devem ser tratadas com routing/fallback;
- o problema prático que motivou infraestrutura própria foi principalmente dependência de serviços como Render/Vercel/Supabase/Neon e limites/configurações desses SaaS.

A intenção é poder self-host capacidades necessárias quando fizer sentido, sem reconstruir produtos inteiros inutilmente.

---

# 10. VPS — limite factual obrigatório

**MCF NÃO está instalado na VPS neste momento.**

A VPS é um projeto/infrastrutura separada em preparação para uso futuro potencial pelo MCF e por outros projetos.

Não afirmar:

- que o runtime atual do MCF roda na VPS;
- que Codex roda na VPS;
- que o MCF já foi migrado para a VPS.

A intenção futura é avaliar hospedagem de serviços como:

- APIs;
- MCP servers;
- workers;
- filas;
- bancos quando adequado;
- dashboards;
- automações;
- serviços dos projetos.

Mas essa intenção é distinta do estado implementado atual.

---

# 11. GitHub como base estrutural

LEANDRO explicitamente decidiu que GitHub não deve ser abandonado.

Funções candidatas/atuais:

- fonte de verdade;
- memória institucional;
- versionamento;
- workflows;
- gates;
- commits;
- PRs;
- decisões;
- releases;
- checkpoints;
- rastreabilidade;
- auditoria.

Descoberta adicional: persistência não pode depender de um único writer/conector. Durante esta sessão ocorreram bloqueios intermitentes da camada de segurança do conector antes da mutação GitHub. Isso gerou a nota `MCF-NEXTGEN-WRITER-RELIABILITY-NOTE-001.md`.

Princípio emergente:

> checkpoint precisa de confirmação/read-back e estratégia para `PENDING_PERSISTENCE`, retry/reconciliation/fallback.

---

# 12. HUMAN_GATE versus dependência operacional humana

Duas categorias não devem ser misturadas:

## HUMAN_GATE real

Decisão material reservada a LEANDRO.

## Dependência operacional humana

Interrupção porque um sistema externo exige clique/configuração/token/manualidade que poderia, idealmente, ser automatizada dentro de autorização já concedida.

Objetivo futuro:

> reduzir dependência operacional humana sem reduzir autoridade humana.

---

# 13. Interface humana pretendida

Dois conceitos complementares:

## 13.1 Linha do Tempo dos Agentes

A antiga ideia de “Rede Social de Agentes” é principalmente uma interface visual/observabilidade de um escritório digital.

Eventos reais podem aparecer como:

- iniciou atividade;
- entregou artefato;
- teste falhou;
- handoff;
- bloqueio;
- gate;
- correção;
- recuperação.

Não deve ser feed teatral: idealmente deriva de eventos reais do runtime/ledger.

## 13.2 Central de Perguntas e Decisões

Quando um agente precisa de LEANDRO, a interface deve apresentar perguntas guiadas, alternativas, impactos e opção livre. A resposta é persistida e a missão continua.

Princípio:

> **complexidade interna; simplicidade operacional externa**.

---

# 14. MCF como fábrica de sistemas

Ambição funcional:

MCF deve ser capaz de ajudar a construir:

- sites;
- sistemas web;
- mobile;
- desktop;
- APIs;
- automações;
- dashboards;
- ferramentas;
- plataformas;
- frameworks especializados de agentes.

Exemplos discutidos:

- framework de automação de postagem em redes sociais;
- framework de agentes para criação de vídeos.

Hipótese estrutural:

- **MCF Core** fornece capacidades universais;
- factories/plugins/perfis fornecem especialistas/workflows de domínio.

---

# 15. Referências visuais/conceituais trazidas por LEANDRO

Screenshots de material externo foram usados como referência de estudo, não como requisitos automáticos.

Conceitos observados:

- Context Engineering;
- Loop Engineering;
- Graph Engineering;
- MCP / Stateless MCP;
- Agentic AI;
- Multi-Agent Systems;
- RAG / Memory Layers;
- Tool Use;
- Evaluation Frameworks;
- Guardrails;
- Observability;
- AI Gateways;
- Cost Optimization;
- Spec-Driven Development;
- parallel workers / verifier / merge;
- stop conditions;
- retry limits;
- human-in-the-loop;
- cross-session messaging;
- sandboxing;
- agent authentication;
- granular permissions;
- model routing;
- caching;
- rate limiting;
- prompt-injection defense.

Diretriz:

> comparar cada conceito com o MCF existente e adotar somente se resolver um problema real ou melhorar uma propriedade mensurável.

---

# 16. Independência de agentes/revisores

A Fase Zero revelou necessidade de vocabulário mais preciso:

- papéis diferentes no mesmo modelo/contexto = separação funcional;
- sessões/contextos separados = isolamento maior;
- modelos/providers diferentes = diversidade cognitiva maior;
- auditoria humana/externa fora do sistema = independência externa.

O experimento `telefone-sem-fio-001` deu evidência positiva de preservação/handoff, mas não provou independência cognitiva completa porque os papéis foram executados dentro do mesmo ChatGPT.

---

# 17. Codex integrado — esclarecimento

O Codex observado no PR/GitHub é a integração Codex/GitHub usada para review e, quando acionada, atualização do PR.

Não confundir com:

- agente autônomo já hospedado pelo MCF;
- serviço da VPS;
- runtime próprio do MCF.

Essa integração pode ser uma ferramenta/executor do ecossistema, mas sua existência não prova independência externa completa.

---

# 18. Aprendizado do publication boundary da v1

A stable revelou problemas úteis para a futura Fase 1:

1. CI verde não significa ausência de risco semântico;
2. controles de governança devem ser executáveis, não apenas documentais;
3. provider capabilities devem ser validadas antes de virarem requisitos;
4. um controle desejado pode ser incompatível com o plano/visibilidade/provider atual;
5. código, estado, autoridade e evidência possuem ciclos de mutabilidade diferentes e não devem ser misturados sem necessidade;
6. fail-closed deve ser real;
7. threads/findings só devem fechar após correção → teste → evidência → review → resolução.

## 18.1 Capability mismatch descoberto

O requisito antigo de `branch ruleset + file_path_restriction` mostrou-se incompatível com as capacidades usadas no repositório público atual.

O desenho foi reformulado para:

**`IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF`**

Conceito:

- publisher branch contém publication code;
- publisher deve ser congelado server-side;
- HUMAN_GATE fica em approval ref separada;
- aprovação futura vincula release + publisher SHA + RC3;
- consumo de autoridade ocorre sem modificar publisher;
- recovery deve usar o mesmo publisher autorizado.

Esse aprendizado deve influenciar Fase 1, mas não é automaticamente arquitetura geral do MCF.

---

# 19. Estado live observado ao fechar este checkpoint

```yaml
main_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
rc3_sha: 7f741e10d0e745a90c732e084400b11e3f5e6794
main_equals_rc3: true

pr_133:
  state: OPEN
  merged: false
  observed_head: 5875c459128e849fa76b735fb33f0c45a8355b20
  architecture: IMMUTABLE_PUBLISHER_SEPARATE_HUMAN_GATE_REF
  P0: 0
  P1: 2
  P2: 0
  human_gate: NOT_APPROVED
  ready_for_human_gate: false

pr_134:
  state: OPEN
  merged: false
  observed_head: c8d2696a419f0781f3417ff8fa95149f031f9654
  purpose: documentation reconciliation
  action: WAIT_FOR_STABLE_BOUNDARY

stable_v1_0_0:
  tag: ABSENT_AT_LAST_READBACK
  release: ABSENT_AT_LAST_READBACK

phase_one_discovery:
  branch: planning/mcf-nextgen-discovery
  Q1: COMPLETED
  Q2: NEXT_NOT_STARTED
```

**Regra:** novo chat deve revalidar todos os itens mutáveis antes de afirmar que continuam iguais.

---

# 20. Estado da documentação

A documentação atual da `main` foi identificada como defasada em vários pontos.

Foi criada reconciliação documental no PR #134, mas ela permanece propositalmente não integrada enquanto a stable depende de `main == RC3`.

Depois do fechamento stable:

1. atualizar PR #134 contra estado final;
2. revalidar/revisar;
3. integrar sob governança;
4. encerrar Fase Zero documentalmente.

---

# 21. Roadmap do questionário

O questionário canônico agora possui **16 perguntas**.

Estado:

```yaml
Q1: COMPLETED
Q2: NEXT
Q3-Q16: PENDING
```

O roadmap detalhado está em:

`docs/proposals/MCF-NEXTGEN-QUESTIONNAIRE-ROADMAP-001.md`

Pergunta 2:

> **O que exatamente significa “não perder o contexto de um projeto”?**

Ela deve definir memória, duração, acesso, fontes de verdade, grau de reconstrução e o contrato mínimo do Pacote de Continuidade do Projeto.

---

# 22. O que está persistido e o que não está

## Persistido

- Checkpoint 001;
- este Checkpoint 002;
- decisão de nomenclatura;
- roadmap do questionário;
- roadmap macro;
- writer reliability note;
- brief de reconciliação documental;
- estado stable em PR #133/Issue associada;
- reconciliação documental no PR #134.

## Não persistido literalmente

- transcrição completa palavra por palavra do chat;
- cada raciocínio intermediário sem relevância durável;
- toda captura de tela como parte do checkpoint textual.

Isso é intencional: a meta é persistir **conhecimento operacional suficiente**, não duplicar toda conversa.

---

# 23. Próxima ação

A sessão pode ser encerrada com segurança após read-back dos artefatos.

Na retomada:

```text
1. abrir GitHub
2. ler MCF-NEXTGEN-RESUME-CARD.md
3. ler Checkpoint 002
4. revalidar main / PR #133 / PR #134 / stable
5. concluir o boundary operacional que estiver pendente
6. voltar ao discovery
7. iniciar Q2
```

Não pedir a LEANDRO para reconstruir a conversa.

---

# 24. Critério de sucesso deste checkpoint

Se LEANDRO abrir um chat novo amanhã e disser apenas:

> “Mestre, retome o MCF do checkpoint mais recente.”

um novo MESTRE deve conseguir descobrir:

- qual é o repositório;
- qual é a fase atual;
- por que existe a Fase Zero/Fase 1/Fase 2;
- qual pergunta foi concluída;
- qual pergunta vem agora;
- quais decisões estratégicas já foram tomadas;
- quais hipóteses estão em estudo;
- qual boundary operacional está pendente;
- quais artefatos ler;
- qual é a próxima ação;

sem exigir que LEANDRO reconte o dia anterior.