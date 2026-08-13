# MCF NextGen — Discovery Checkpoint 001

**Status:** DRAFT_DISCOVERY  
**Natureza:** checkpoint de estudo e planejamento pós-Fase-Zero  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Branch isolada:** `planning/mcf-nextgen-discovery`  
**Base de criação:** `main@7f741e10d0e745a90c732e084400b11e3f5e6794`  
**Impacto no boundary v1.0.0:** NENHUM  
**HUMAN_GATE para publicação estável:** NÃO CONCEDIDO  

---

## 1. Por que este checkpoint existe

Este documento congela o estado conceitual alcançado na conversa de amadurecimento do MCF antes da próxima rodada de perguntas guiadas.

O problema que motivou este checkpoint é o próprio problema central que o MCF pretende resolver: horas de raciocínio, decisões, hipóteses e evolução não podem permanecer dependentes da memória do humano, da janela de contexto de um chat ou da capacidade de um modelo específico reconstruir retrospectivamente o projeto.

Nenhuma nova etapa de discovery deve ser considerada consolidada sem um estado durável equivalente.

---

## 2. Origem e finalidade principal do MCF

O MCF nasceu inicialmente porque LEANDRO não dispõe de orçamento para depender continuamente de ferramentas e ecossistemas caros de desenvolvimento assistido por IA.

A intenção original foi criar um sistema próprio no qual LEANDRO pudesse permanecer concentrado em ideias, visão, insights e decisões enquanto uma equipe de agentes executasse o trabalho de forma especializada, rastreável e recuperável.

A motivação não é apenas redução de custo. O problema fundamental é continuidade:

- um projeto pode ser iniciado na segunda-feira, trabalhado até terça e pausado;
- LEANDRO pode mudar para outro projeto durante dias ou semanas;
- ao retornar, o projeto deve ser retomado sem reconstrução manual do contexto;
- outro modelo, outro chat, outro agente, outra IA ou um humano deve conseguir reconstruir o estado do projeto;
- a continuidade não pode depender da memória interna de um fornecedor ou de uma conversa específica.

### Tese atual de propósito

> O MCF pretende permitir que LEANDRO transforme ideias em projetos executados por equipes de agentes, preservando memória, decisões, evidências, estado e continuidade de modo que projetos possam ser interrompidos, delegados e retomados sem dependência da memória humana, do contexto de um chat, de um modelo específico ou de uma equipe específica.

---

## 3. Prioridades estratégicas atuais

### Primárias

1. sistema pessoal de trabalho com IA para LEANDRO;
2. continuidade e memória durável de projetos;
3. rastreabilidade independente do contexto do chat;
4. coordenação especializada de agentes;
5. redução de custo e de dependências externas desnecessárias;
6. autonomia operacional progressiva;
7. experiência simples para o humano operador.

### Secundárias / posteriores

- generalização para terceiros;
- framework público reutilizável;
- produto comercial.

Esses objetivos continuam desejáveis, mas não são o foco inicial. O MCF deve amadurecer e provar valor primeiro.

---

## 4. Fase Zero

A implementação construída até a v1 é tratada conceitualmente como **Fase Zero de amadurecimento**.

Ela não é entendida como arquitetura definitiva. Foi necessária para produzir experiência real sobre:

- perda de contexto;
- handoffs;
- memória;
- agentes e especialização;
- execução sequencial;
- paralelismo;
- documentação;
- gates;
- falhas e recuperação;
- providers externos;
- observabilidade;
- autonomia;
- CI/CD;
- deploy;
- publicação;
- limites de ferramentas;
- interação humano-IA.

Os bugs, excessos, decisões erradas e retrabalho da Fase Zero são considerados dados empíricos para projetar a próxima geração.

### Regra para a próxima fase

Não preservar algo apenas porque já existe e não remover algo apenas porque é complexo.

Para cada mecanismo deve ser respondido:

> Qual problema ele resolve e existe uma forma menor, mais robusta, mais automática ou mais eficiente de resolver o mesmo problema?

---

## 5. Papel do ChatGPT

Na configuração inicial pretendida, ChatGPT/MESTRE permanece como camada cognitiva superior e de abstração.

Responsabilidades candidatas:

- interpretar intenção de LEANDRO;
- decompor problemas;
- raciocínio complexo;
- arquitetura;
- geração e revisão de código pesado quando apropriado;
- síntese de resultados dos agentes;
- refinamento;
- coordenação;
- escolha de especialistas;
- integração das entregas;
- tradução da complexidade interna para interação humana simples.

O ChatGPT não precisa executar sozinho toda atividade especializada.

---

## 6. Agente não é modelo

Decisão conceitual forte:

> `AGENTE != MODELO`

Um agente deve possuir identidade operacional própria, contendo pelo menos:

- papel;
- especialidade;
- skills;
- ferramentas;
- permissões;
- missão;
- estado;
- critérios de qualidade;
- memória necessária;
- entradas e saídas esperadas.

O modelo de IA é um recurso cognitivo selecionável para executar aquele agente.

### Model routing

Se o modelo preferencial atingir quota, indisponibilidade ou inadequação, o agente deve continuar por outro modelo compatível sem perder identidade nem estado.

O futuro `Model Router` deverá considerar, entre outros:

- capacidade de raciocínio;
- coding;
- contexto suportado;
- tools;
- visão;
- custo;
- quota;
- latência;
- disponibilidade;
- privacidade;
- qualidade mínima;
- especialização.

A troca de modelo deve transportar um estado normalizado do agente, e não depender do histórico bruto do chat.

---

## 7. Uso de APIs de IA

A estratégia de utilizar APIs gratuitas ou econômicas continua válida.

O problema de infraestrutura encontrado não invalida essas APIs.

A direção pretendida é:

- ChatGPT para trabalho cognitivo pesado e orquestração quando adequado;
- modelos via API para funções especializadas, estruturadas ou mais leves;
- roteamento e fallback para lidar com quotas e disponibilidade;
- capacidade futura de incorporar modelos e fornecedores diferentes sem acoplar o agente ao provider.

---

## 8. Problema encontrado com SaaS externos e motivação da VPS

A principal limitação prática que motivou a nova infraestrutura não foi a existência das APIs de IA, mas a dependência operacional de serviços como Render, Vercel, Supabase, Neon e equivalentes.

Esses serviços podem introduzir:

- limites de free tier;
- cold start / sleep;
- configuração manual;
- tokens e credenciais específicas;
- painéis externos;
- dependências que exigem intervenção humana;
- custos futuros.

A VPS foi contratada para fornecer uma base própria para serviços de backend do MCF e dos projetos desenvolvidos pelo MCF.

### Direção

Hospedar progressivamente, quando fizer sentido:

- runtime MCF;
- APIs;
- MCP servers;
- workers;
- filas;
- automações;
- dashboards;
- aplicações;
- bancos quando tecnicamente adequado;
- observabilidade;
- serviços internos;
- ambientes de desenvolvimento/staging.

### Limites

- não reconstruir Render/Vercel/Supabase/Neon completos sem necessidade;
- criar apenas capacidades necessárias;
- não acoplar MCF à Contabo;
- Docker/contratos de infraestrutura devem preservar portabilidade;
- self-hosting não é automaticamente melhor que SaaS;
- serviços externos continuam permitidos quando forem tecnicamente/economicamente melhores.

---

## 9. HUMAN_GATE versus dependência humana operacional

A Fase Zero revelou dois fenômenos que não devem continuar misturados.

### HUMAN_GATE real

Decisão material reservada a LEANDRO, como mudanças estratégicas, custos relevantes, ação irreversível de alto impacto, exposição pública/material ou outras matérias explicitamente reservadas.

### Dependência humana operacional

Interrupção causada porque o sistema precisa que LEANDRO configure manualmente um painel, token, serviço ou integração que idealmente poderia ser executado automaticamente dentro de autorização já concedida.

### Objetivo

Reduzir dependência humana operacional sem reduzir autoridade humana.

> Menos “Leandro, clique/configure isto”.  
> Preservar “Leandro, esta decisão realmente pertence a você”.

---

## 10. GitHub permanece base estrutural

GitHub não deve ser abandonado.

Ele é considerado uma das bases mais fortes para:

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
- auditoria;
- recuperação por humanos e IAs.

### Separação candidata de memória

**GitHub:** memória institucional/versionada.  
**Banco/Event Store:** estado operacional vivo.  
**Artifacts/Object Storage:** evidências pesadas quando necessário.  
**Runtime:** estado de execução corrente.

GitHub não deve obrigatoriamente ser usado como banco transacional de runtime.

---

## 11. Modelo de memória em estudo

Hipótese atual de três níveis:

### 11.1 Framework Memory

Conhecimento universal do MCF:

- agentes/tipos;
- skills;
- protocolos;
- schemas;
- regras;
- governança;
- contratos do runtime.

Fonte principal: repositório do MCF.

### 11.2 Project Memory

Conhecimento específico de cada projeto:

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

Fonte principal: repositório do próprio projeto e stores auxiliares quando aplicáveis.

### 11.3 Live Operational Memory

Estado temporário e altamente mutável:

- tarefa em execução;
- filas;
- workers;
- heartbeats;
- locks;
- quotas;
- sessões;
- eventos recentes.

Fonte candidata: runtime/banco/event store.

---

## 12. Project Capsule — hipótese em estudo

Hipótese forte, ainda não decisão arquitetônica final:

Cada projeto poderá possuir uma `Project Capsule`, entendida como contrato de informação suficiente para retomada independente.

Conteúdo candidato:

- identidade do projeto;
- objetivo atual;
- estado;
- decisões vigentes;
- arquitetura;
- equipe;
- contratos dos agentes;
- backlog;
- findings;
- evidências;
- infraestrutura;
- checkpoints;
- histórico essencial;
- próxima ação.

### Critério fundamental

> Um executor novo, sem a conversa original, consegue retomar corretamente usando apenas as fontes duráveis autorizadas?

---

## 13. Multi-project e isolamento

O MCF deve permitir que LEANDRO mantenha múltiplos projetos em paralelo, com equipes e contexto isolados.

Exemplo conceitual:

- Projeto CIAME → equipe/contexto/infra próprios;
- Projeto B → equipe/contexto/infra próprios;
- Projeto C → equipe/contexto/infra próprios.

Um tipo de agente pode existir em vários projetos, mas o estado operacional não pode vazar entre projetos.

Exemplo conceitual:

`SOFIA@CIAME != SOFIA@PROJETO-B` em estado, missão e memória de trabalho.

Isolamento futuro também deve alcançar infraestrutura: containers, secrets, networking, volumes, logs, backup, configuração e rollback por projeto.

---

## 14. Experimento de continuidade já existente

Foi verificado no repositório o experimento:

`experimentos/telefone-sem-fio-001`

Ele possui etapas executoras, auditoria, parecer, log, retrospectiva e resultado final.

O resultado registrado preservou 5/5 restrições obrigatórias, zero omissões e zero contradições no escopo do experimento.

Entretanto, o próprio resultado registra uma limitação metodológica importante: o isolamento foi documental/simulado e os papéis foram executados pelo mesmo ChatGPT.

Portanto:

> há evidência empírica inicial de continuidade/handoff, mas ainda não há comprovação completa de independência cognitiva e retomada multi-instância/modelo.

Essa limitação deve ser preservada e não reescrita como validação definitiva.

---

## 15. Continuidade Recovery Test — hipótese de benchmark

Futuro teste recomendado:

1. trabalhar intensamente em um projeto;
2. interromper por vários dias;
3. abrir nova sessão e, idealmente, outro modelo/executor;
4. não fornecer histórico bruto da conversa;
5. disponibilizar apenas estado durável autorizado;
6. medir se o projeto é retomado corretamente.

Métricas candidatas:

- decisões recuperadas;
- decisões perdidas;
- contradições;
- tempo de retomada;
- intervenção humana necessária;
- trabalho repetido;
- erros causados pela interrupção;
- tokens/custo de reconstrução.

---

## 16. Interface humana pretendida

A complexidade deve permanecer majoritariamente interna.

Princípio:

> **complexidade interna; simplicidade operacional externa**

### 16.1 Activity Feed / “Rede Social de Agentes”

A Rede Social de Agentes é entendida principalmente como interface de observabilidade humana do trabalho, semelhante a um escritório digital.

Cada ação relevante pode gerar eventos/postagens, por exemplo:

- agente iniciou atividade;
- artefato concluído;
- teste falhou;
- correção solicitada;
- handoff;
- gate;
- bloqueio;
- decisão;
- recuperação.

Não deve ser confundida automaticamente com produto social público.

### 16.2 Interaction Center / perguntas guiadas

A futura plataforma web deve permitir que agentes façam perguntas de modo guiado:

- alternativas claras;
- impacto de cada alternativa;
- possibilidade de resposta livre;
- decisão persistida;
- retomada automática da missão após resposta.

O operador não deve precisar manipular YAML, logs, actions, tokens ou infraestrutura para decisões comuns.

---

## 17. MCF como fábrica de sistemas e metaframework

O MCF deve ser capaz de construir, entre outros:

- sites;
- sistemas web;
- aplicações mobile;
- aplicações desktop;
- APIs;
- automações;
- SaaS;
- ferramentas internas;
- dashboards;
- integrações.

Também deve poder criar sistemas/frameworks especializados de agentes, por exemplo:

- framework de automação de redes sociais;
- framework de agentes para produção de vídeos;
- outras fábricas especializadas.

Hipótese arquitetônica:

`MCF CORE` fornece capacidades universais; “fábricas”/domínios fornecem agentes, skills, workflows, critérios e ferramentas especializados.

---

## 18. Conceitos observados nos estudos visuais anexados — NÃO são decisões automáticas

Os screenshots apresentados por LEANDRO mostram conceitos que devem ser estudados e comparados com o MCF atual, sem copiar ou adotar automaticamente:

- Harness;
- Context Engineering;
- Loop Engineering;
- Graph Engineering;
- MCP;
- Stateless MCP;
- Agentic AI;
- Multi-Agent Systems;
- RAG 2.0;
- Memory Layers;
- Tool Use;
- Fine-Tuning;
- Evaluation Frameworks;
- Guardrails;
- Observability;
- Prompt Optimization;
- Synthetic Data;
- Distillation;
- AI Gateways;
- Cost Optimization;
- Spec-Driven Development;
- Graphs com split/parallel workers/verifier/merge;
- critérios de parada e número de tentativas;
- quando pedir ajuda humana;
- comportamento quando ferramentas falham;
- comunicação cross-session entre agentes;
- sandboxing;
- autenticação de agentes;
- permissões granulares;
- human-in-the-loop;
- roteamento entre modelos;
- caching;
- rate limiting;
- segurança contra prompt injection.

### Direção de estudo

Para cada item deverá ser determinado:

1. o MCF já possui equivalente?
2. está apenas documentado ou tecnicamente enforced?
3. funciona bem?
4. está duplicado?
5. deve ser melhorado?
6. deve ser substituído?
7. deve ser removido?
8. qual problema real resolve?

---

## 19. Graph/Loop Engineering — hipótese relevante

Os estudos sugerem evitar uma linha rígida em que todo agente espera o anterior quando atividades poderiam ocorrer em paralelo.

O próximo MCF deve avaliar explicitamente:

- fluxo sequencial quando houver dependência real;
- branching;
- fan-out;
- paralelismo;
- fan-in/merge;
- verificação independente;
- loops de correção;
- stop conditions;
- retry budget;
- escalation;
- recuperação de ferramenta.

O ESEV/fluxo atual não deve impedir paralelismo quando o DAG da missão permitir.

---

## 20. Observabilidade

A interface e o runtime devem ser capazes de responder de forma direta:

- o que está acontecendo?
- qual agente está trabalhando?
- qual tarefa?
- qual modelo foi usado?
- qual ferramenta foi usada?
- qual evidência foi produzida?
- o que falhou?
- por que está bloqueado?
- qual é a próxima ação segura?
- precisa de LEANDRO ou pode continuar sozinho?

A observabilidade não deve depender exclusivamente de documentação retrospectiva.

---

## 21. Autocrítica já consolidada

Problemas/riscos identificados na Fase Zero que precisam ser reavaliados:

- processo potencialmente desproporcional ao risco;
- custo de governança ainda pouco medido;
- documentação excessiva/repetitiva em alguns boundaries;
- drift documental;
- core pouco descobrível e acoplado à aplicação de rede social;
- separação de papéis não equivale automaticamente a independência cognitiva;
- provenance de agentes e ações precisa amadurecer;
- necessidade de benchmark contra fluxos mais simples;
- necessidade de medir tokens, tempo, custo, retrabalho e bugs;
- necessidade de provar portabilidade entre modelos/sessões/humanos;
- necessidade de distinguir estado durável de log bruto;
- necessidade de reduzir chamadas humanas puramente operacionais;
- necessidade de manter gates materiais reais;
- necessidade de isolamento entre projetos;
- necessidade de política consciente de self-hosting versus SaaS.

---

## 22. Distinção de independência

Termos futuros devem distinguir pelo menos:

1. **separação funcional de papel** — revisor diferente do executor no workflow;
2. **isolamento de contexto/sessão** — instâncias separadas;
3. **diversidade de modelo/provider** — cognição tecnicamente diversa;
4. **auditoria humana externa** — pessoa realmente independente.

Não chamar automaticamente toda separação funcional de “auditoria externa independente”.

---

## 23. Direção para a próxima geração

A próxima geração não deve ser “v1 + mais funcionalidades”.

Sequência pretendida:

1. concluir/estabilizar a Fase Zero conforme governança vigente;
2. auditar o sistema inteiro;
3. concluir questionário guiado com LEANDRO;
4. consolidar requisitos e princípios;
5. comparar MCF atual versus conceitos estudados;
6. classificar preservar / simplificar / remover / separar / substituir / adicionar;
7. definir arquitetura-alvo;
8. definir benchmarks;
9. produzir especificação completa;
10. entregar pacote estruturado ao Codex para reestruturação.

Nenhuma reestruturação ampla deve ser delegada ao Codex antes da consolidação dessa etapa de discovery.

---

## 24. Papel do Codex

Codex deverá receber uma tarefa estruturada somente após o encerramento do questionário e conciliação final.

O pacote futuro deverá especificar:

- estado atual verificado;
- problemas;
- decisões de LEANDRO;
- requisitos;
- arquitetura-alvo;
- invariantes;
- itens a preservar;
- itens a remover;
- itens a simplificar;
- itens a desacoplar;
- itens novos;
- plano de migração;
- testes;
- critérios de aceite;
- benchmarks antes/depois;
- rollback.

---

## 25. Estado deste discovery

```yaml
phase: MCF_NEXTGEN_DISCOVERY
stage: QUESTIONNAIRE_ALIGNMENT
question_1: CONSOLIDATED_WITH_EXPANSIONS
question_2: NOT_STARTED
continuity_checkpoint: SAVED_ON_PLANNING_BRANCH
stable_boundary_modified: false
implementation_authorized: false
nextgen_restructure_authorized: false
```

### Próxima ação

Não avançar automaticamente para a Pergunta 2.

Antes:

1. verificar este checkpoint no GitHub;
2. atualizar/reconciliar a documentação canônica desatualizada do MCF por missão separada, sem falsear estado estável e sem misturar discovery com decisão implementada;
3. preservar este discovery como proposta/estado de estudo;
4. somente então retomar o questionário guiado.

---

## 26. Regras de verdade para documentação durante o discovery

A documentação deve distinguir explicitamente:

- **CURRENT / IMPLEMENTED:** existe hoje e foi verificado;
- **EXPERIMENTAL:** existe com limitações conhecidas;
- **PLANNED:** decisão já aprovada para implementação futura;
- **UNDER STUDY:** hipótese/discussão ainda não concluída;
- **REJECTED / SUPERSEDED:** não é mais vigente.

Não transformar automaticamente ideias desta conversa em capacidades atuais do MCF.

---

## 27. Checkpoint humano

LEANDRO determinou que esta fase é uma das mais importantes do amadurecimento do MCF e que o projeto deve preservar continuamente o conhecimento produzido antes de avançar.

A intenção declarada é aprender com a Fase Zero e, após o questionário, produzir uma reestruturação ampla, documentada e baseada em evidência.
