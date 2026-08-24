# MCF — Roadmap da próxima release estável com memória cognitiva persistente

**Mission ID:** `MCF-MEMORY-LIVE-NEXT-STABLE-001`  
**Status inicial:** `MISSION_STARTED / ROADMAP_COMMITTED / ONBOARDING_PENDING`  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Continuidade e gates internos:** LÉO  
**Escopo:** MCF + Cognitive Ledger + TriView + integrações e documentação necessárias  
**Critério terminal da missão:** a missão só pode ser declarada concluída quando a próxima release estável do MCF estiver publicada e verificar, por evidência reproduzível, a nova metodologia de Context Fabric e o ciclo real de memória persistente entre chats.

---

## 1. Por que esta missão existe

A missão anterior concluiu a integração cross-repository do Context Fabric em laboratório/staging e validou recovery 4/4 entre:

- `multiagent-collaboration-framework`;
- `cognitive-ledger`;
- `cloud-infrastructure`;
- `triview-workspace-linux`.

Esse boundary entregou Registry, Capsules, Capability Registry, provenance, freshness/drift, recovery, leitura do Cognitive Ledger e leitura local controlada de Cloud. O `main` do MCF avançou além da release estável `v1.1.0`, mas essa nova metodologia ainda não foi publicada como nova release estável.

Além disso, o Cognitive Ledger foi criado para preservar memória entre conversas, mas o boundary integrado ao MCF é somente leitura. Hoje o MCF consegue consultar memória já existente, mas não consegue cumprir o fluxo de produto desejado:

> usuário pede explicitamente para registrar uma memória → Mestre persiste no Cognitive Ledger → outro chat/Mestre recupera essa memória depois.

Esta missão fecha essas duas lacunas.

---

## 2. Objetivo verificável

Transformar a integração atual em uma nova geração oficial e utilizável do MCF na qual:

1. a metodologia de Context Fabric cross-repo esteja documentada, canônica e incluída na próxima release estável;
2. um Mestre iniciado de acordo com a nova release saiba reconstruir estado por Registry + Capsules + SHAs + provenance + recovery, em vez de depender da memória do chat anterior;
3. o Cognitive Ledger possa receber registros de memória por uma capability de escrita específica, governada e auditável;
4. o Cognitive Ledger esteja disponível em um ambiente live autorizado e privado, não apenas em stack descartável de laboratório;
5. um pedido explícito do usuário como “registre isso no meu diário” possa produzir persistência real e um Receipt verificável;
6. uma conversa posterior possa recuperar a memória persistida e provar continuidade cross-chat;
7. leitura e escrita permaneçam capabilities separadas, com autorização, conexão, runtime e verificação independentes;
8. segredos e dados pessoais reais nunca sejam versionados em Git, logs públicos, fixtures de CI ou evidências públicas;
9. a release estável final seja publicada em um SHA exato que tenha passado todos os gates aplicáveis.

---

## 3. Resultado de produto esperado

### Registro

Usuário: “Mestre, registre no meu diário que decidimos X.”

Mestre deve:

1. reconhecer intenção explícita de persistência;
2. usar somente a capability autorizada de escrita de memória;
3. enviar um registro estruturado ao Cognitive Ledger;
4. receber confirmação persistente do provider;
5. gerar ou preservar um Receipt auditável;
6. informar ao usuário que a memória foi realmente persistida.

### Recuperação posterior

Em outro chat/sessão, o usuário pergunta por essa decisão.

Mestre deve:

1. reconstruir o contexto operacional atual do ecossistema;
2. verificar se a capability do Ledger está conectada e autorizada;
3. consultar o Ledger;
4. recuperar a memória persistida com provenance;
5. distinguir memória histórica, estado atual e inferência.

### Regra fundamental

“Eu me lembro” só pode significar que existe memória persistida e recuperável ou contexto explicitamente presente. Não é permitido fingir persistência com base apenas no histórico efêmero da conversa.

---

## 4. Princípios não negociáveis

- `IMPLEMENTED != CONNECTED != AUTHORIZED != ACTIVE != VERIFIED_NOW`;
- nenhuma release anterior será reescrita ou adulterada;
- a próxima release será um novo tag/SHA estável;
- `MERGE != RELEASE`;
- `RELEASE != PRODUCTION_DEPLOY`;
- `CI_GREEN != LIVE_PROVIDER_AUTHORIZATION`;
- memória de usuário não entra em repositório público;
- escrita no Ledger não será implementada como SQL arbitrário nem como acesso genérico ao banco;
- leitura e escrita terão contracts/capabilities independentes;
- ausência de token, autorização, endpoint, schema válido ou provider live deve falhar fechada;
- escrita automática implícita não será adicionada sem decisão explícita de LEANDRO;
- paid embeddings permanecem desabilitados por padrão salvo autorização separada;
- toda afirmação de “live”, “connected”, “active”, “release published” ou “current” exige leitura/evidência contemporânea.

---

## 5. Escopo funcional mínimo da release

### 5.1 Context Fabric oficializado

A próxima release deve incorporar e documentar como metodologia vigente:

- Project Registry;
- Project Capsules;
- Capability Registry;
- provenance;
- freshness/drift;
- recovery cross-repository;
- Receipts;
- distinção entre estado histórico e current live state;
- bootstrap de missão orientado por recovery e fontes de verdade.

### 5.2 Cognitive Ledger read

Preservar e regressar o boundary atual de leitura:

- `ler_diario`;
- `buscar_eventos`;
- `recuperar_contexto`;
- `ler_fonte_bruta` somente quando explicitamente autorizada no provider e fora do allowlist padrão do MCF.

### 5.3 Cognitive Ledger write

Adicionar uma capability separada, provisoriamente denominada:

- `cognitive-ledger.memory.write`.

O nome definitivo da operação/tool/rota será decidido no gate arquitetural, mas o produto precisa suportar uma intenção equivalente a:

- `registrar_memoria` / `registrar_no_diario`.

A escrita deve ser semântica e limitada a Eventos Cognitivos/entradas de diário. Não deve expor mutação genérica do banco.

### 5.4 Registro mínimo de uma memória

O schema de escrita deve considerar, no mínimo:

- identificador estável;
- conteúdo;
- tipo/categoria epistêmica;
- data/hora;
- origem da memória;
- contexto/projeto relacionado quando aplicável;
- actor que efetuou o registro;
- provenance;
- idempotency key ou mecanismo equivalente contra duplicação;
- hash/fingerprint quando útil para integridade;
- metadados de auditoria suficientes para Receipt.

A forma final desses campos depende da auditoria do modelo de dados existente do Cognitive Ledger.

### 5.5 Live private provider

O Ledger deve deixar de existir apenas como stack descartável de laboratório e passar a ter um ambiente live autorizado para uso real, com:

- banco privado;
- autenticação/autorização apropriadas;
- segredos em secret store/variáveis protegidas;
- nenhum dado pessoal em Git;
- health/readiness verificáveis;
- backup/restore e recuperação compatíveis com o risco;
- logs que não vazem conteúdo sensível;
- observabilidade suficiente para distinguir falha de transporte, auth, provider e aplicação.

### 5.6 Integração MESTRE

A metodologia de trabalho do Mestre deve passar a prever explicitamente:

- fresh recovery quando a currentness for necessária;
- leitura do Capability Registry antes de usar provider;
- detecção de intenção explícita de registrar memória;
- chamada da capability de escrita somente quando autorizada;
- confirmação baseada no Receipt real do provider;
- recuperação cross-chat posterior;
- falha fechada quando o Ledger não estiver disponível.

### 5.7 TriView

O TriView deve conseguir apresentar, sem se tornar autoridade operacional:

- status da capability de leitura do Ledger;
- status da capability de escrita do Ledger;
- connected/authorized/runtime/verification/freshness;
- Receipts e evidência operacional compatíveis com privacidade;
- nunca exibir conteúdo privado por padrão em telemetria/painéis públicos.

---

## 6. Decisões que o onboarding precisa fechar

Estas perguntas não bloqueiam a existência do roadmap; elas bloqueiam implementação irreversível ou live activation:

1. **Destino live do Cognitive Ledger:** qual provider/ambiente privado será a fonte live oficial?
2. **Política de escrita:** registrar somente quando LEANDRO pedir explicitamente ou permitir também captura automática/sugerida?
3. **Autoridade de escrita:** todo Mestre autenticado pode gravar ou somente MESTRE/Miriam por capability específica?
4. **Modelo de memória:** entrada livre de diário, Evento Cognitivo estruturado, ou ambos?
5. **Correção e esquecimento:** editar/excluir memória entra nesta release ou fica para boundary posterior?
6. **Confirmação ao usuário:** qual nível de Receipt/detalhe deve aparecer após cada registro?
7. **Escopo de dados reais:** a validação live final usará somente marcador sintético privado ou também uma primeira memória real explicitamente autorizada por LEANDRO?
8. **Versão da release:** se a mudança permanecer aditiva e compatível, `v1.2.0` é o candidato natural; se houver breaking change, usar major apropriada. A versão só será travada após análise de compatibilidade.
9. **Latest:** a nova release publicada deve assumir `latest` imediatamente após os gates finais?

---

## 7. Equipe oficial convocada para a missão

A composição oficial continua sendo de 29 agentes nomeados; LEANDRO é a autoridade humana final e não entra na contagem. Todos fazem parte do roster da missão, ativados por competência e risco — não necessariamente todos executando simultaneamente.

### Coordenação e produto

- **Léo:** continuidade, WIP, gates internos e recuperação da missão.
- **Mestre:** orquestração, mapa de execução, handoffs e consolidação.
- **Leonardo:** produto, requisitos, MVP e critérios de aceite.
- **Carlos:** alternativas, riscos futuros e cenários de evolução.

### Design e experiência

- **Evelyn:** experiência global do fluxo de memória.
- **Laura:** UX do comando de registrar/consultar memória.
- **Isabela:** UI dos estados e Receipts quando aplicável.
- **Marina:** acessibilidade dos fluxos e painéis.

### Arquitetura e engenharia

- **Sofia:** arquitetura cross-repo, contracts e boundaries.
- **Rafael:** engenharia de software e integração principal.
- **Eduardo:** backend do MCF/adapter de escrita.
- **Manoel:** banco, integridade, migrações, índices e backup/restore.
- **Daniela:** engenharia de dados, lineage/provenance e qualidade de dados.
- **Helena:** frontend/TriView quando houver alteração de interface web.
- **André:** revisão de implicações mobile, se aplicável; sem criar escopo mobile artificial.
- **Tiago:** embeddings/RAG apenas se necessários; custo pago continua opt-in.

### Qualidade, segurança e operação

- **Renato:** estratégia de testes e critérios E2E.
- **Bruno:** ambientes, CI/CD, live provider, SRE e recovery.
- **Ricardo:** threat model, auth, secrets, privacidade técnica e vulnerabilidades.
- **Gabriel:** branches, PRs, versionamento, tag e release.
- **Vinícius:** code review e refatoração.
- **Patrícia:** debugging e análise de falhas.
- **Lucas:** manutenibilidade, desempenho e limites.

### Evidência, observabilidade, memória e governança

- **Carmem:** documentação técnica e reconciliação canônica.
- **Emily:** auditoria independente e bloqueio por evidência insuficiente.
- **Augusto:** observabilidade multiagente e sinais da missão/provider.
- **Beatriz:** avaliação do comportamento dos agentes/Mestre no novo protocolo.
- **Miriam:** memória, knowledge management, provenance e política de recuperação.
- **Júlia:** governança/compliance de IA, autonomia, dados e supervisão.

---

## 8. Fases da missão

### Fase 0 — Roadmap e missão formal

Objetivo: criar o documento canônico da missão antes da implementação.

Critério de saída:

- roadmap presente em `main`;
- objetivo terminal explícito;
- perguntas de onboarding abertas registradas;
- roster da equipe definido.

### Fase 1 — Onboarding e contrato de produto

Responsáveis centrais: Mestre, Léo, Leonardo, Miriam, Júlia.

Entregas:

- respostas às decisões abertas;
- fluxo exato “registrar / recuperar”;
- definição de privacidade e dados reais;
- critérios de aceite de produto;
- escopo e fora de escopo.

Gate 1: LEANDRO confirma que o comportamento desenhado corresponde à intenção original do Cognitive Ledger.

### Fase 2 — Arquitetura, threat model e contrato

Responsáveis centrais: Sofia, Ricardo, Manoel, Daniela, Miriam, Eduardo.

Entregas:

- arquitetura de escrita;
- authN/authZ;
- capability separada de write;
- schema e migrações;
- idempotência;
- auditing/Receipt;
- privacidade/log redaction;
- rollback/failure model;
- contrato MCF ↔ Ledger.

Gate 2: arquitetura + segurança aprovadas; nenhuma implementação live antes disso.

### Fase 3 — Implementação do Cognitive Ledger write em lab

Responsáveis centrais: Eduardo/Rafael/Manoel/Daniela, com Ricardo e Renato.

Entregas:

- endpoint/tool de escrita específico;
- persistência de Evento Cognitivo;
- auditoria fail-closed;
- testes unitários;
- testes de schema/migração;
- idempotência;
- testes de auth;
- zero mutação por tools de leitura.

Gate 3: write lab PASS, sem dados reais e sem secrets públicos.

### Fase 4 — Adapter MCF e comportamento do Mestre

Responsáveis centrais: Mestre, Sofia, Rafael, Eduardo, Miriam, Júlia, Renato.

Entregas:

- `cognitive-ledger.memory.write` no Capability Registry;
- adapter separado de read;
- operação de registro allowlisted;
- política de intenção explícita;
- Receipt e retorno verificável;
- contratos/testes do Mestre;
- regressão das três operações read existentes.

Gate 4: AppModule MCF → Ledger write em lab PASS.

### Fase 5 — Ambiente live privado do Cognitive Ledger

Responsáveis centrais: Bruno, Manoel, Ricardo, Gabriel, Daniela.

Entregas:

- provider live autorizado;
- banco/migrações;
- segredos;
- auth pairwise ou modelo aprovado;
- health/readiness;
- backup/restore;
- observabilidade;
- configuração MCF sem credenciais versionadas.

Gate 5: provider live READY e capability ainda fail-closed até autorização final de ativação.

### Fase 6 — E2E real cross-chat

Responsáveis centrais: Renato, Miriam, Mestre, Emily, Augusto, Beatriz.

Prova mínima:

1. Chat/Sessão A solicita registro explícito;
2. MCF chama write capability;
3. Ledger persiste;
4. Receipt confirma o registro;
5. processo/sessão anterior deixa de ser fonte de contexto;
6. Chat/Sessão B inicia sem depender do histórico A;
7. recovery/bootstrap ocorre;
8. Mestre consulta o Ledger;
9. memória é recuperada com provenance;
10. conteúdo recuperado corresponde ao registro persistido.

Gate 6: `CROSS_CHAT_MEMORY_WRITE_READ_PASS`.

### Fase 7 — TriView, observabilidade e operação

Responsáveis centrais: Evelyn, Laura, Isabela, Marina, Helena, Augusto, Bruno.

Entregas:

- visualização de status read/write;
- freshness/live requirement;
- Receipts sem vazamento de conteúdo privado;
- estados de erro compreensíveis;
- acessibilidade;
- observabilidade operacional.

Gate 7: cockpit informa verdade operacional sem adquirir autoridade.

### Fase 8 — Auditoria, regressão cross-repo e documentação canônica

Responsáveis centrais: Emily, Vinícius, Ricardo, Renato, Carmem, Gabriel.

Entregas:

- full regression MCF;
- testes Ledger completos;
- recovery 4/4 fresh;
- security review;
- privacy review;
- secret scanning;
- docs reconciliadas;
- Capsule MCF e Capsule Ledger sincronizadas;
- Capability Registry correto;
- roadmap público atualizado;
- nenhum estado futuro declarado antes de evidência.

Gate 8: auditoria independente sem achado crítico/alto aberto e evidence pack completo.

### Fase 9 — Release candidate e staging exact-SHA

Responsáveis centrais: Gabriel, Bruno, Renato, Emily, Léo.

Entregas:

- decisão semver;
- changelog/release notes;
- tag candidate quando aplicável;
- CI completa;
- staging no SHA exato;
- smoke/readiness/migrations/build;
- E2E de memória contra o boundary aprovado;
- confirmação de que produção não mudou implicitamente.

Gate 9: release SHA qualificado.

### Fase 10 — Publicação da nova release estável

Responsáveis centrais: Gabriel, Léo, Mestre; decisão reservada a LEANDRO quando aplicável.

Entregas:

- tag estável imutável;
- GitHub Release não-draft/não-prerelease;
- SHA exato reconciliado;
- documentação stable atualizada;
- protocolo do Mestre apontando para a nova metodologia;
- current-state atualizado;
- release notes incluindo Context Fabric + Cognitive Ledger write/live;
- verificação pós-publicação de `latest` conforme decisão do onboarding.

Gate 10: release estável publicada e verificada live.

### Fase 11 — Prova pós-release e encerramento

Entregas obrigatórias:

- bootstrap de um Mestre usando a release publicada;
- fresh recovery;
- capability read e write observadas no estado correto;
- round-trip de memória aprovado;
- nenhuma regressão cross-repo crítica;
- audit trail final;
- handoff de continuidade.

Somente após isso a missão pode receber estado `COMPLETED`.

---

## 9. Critérios de aceite finais

A missão **NÃO** termina apenas com código mergeado.

Ela somente termina quando todos os itens abaixo forem verdadeiros e verificáveis:

- [ ] roadmap canônico está em `main`;
- [ ] onboarding concluído e decisões abertas resolvidas;
- [ ] capability `cognitive-ledger.memory.write` ou equivalente formal existe;
- [ ] Ledger aceita escrita governada de memória;
- [ ] tools de leitura continuam read-only;
- [ ] MCF possui adapter de write separado e fail-closed;
- [ ] Mestre reconhece o comando explícito de registro;
- [ ] Receipt prova persistência real;
- [ ] Ledger live privado está conectado/autorizado no boundary aprovado;
- [ ] nenhuma memória real aparece em Git/CI/log público;
- [ ] Chat A escreve e Chat B recupera sem depender do histórico efêmero;
- [ ] provenance da memória é preservada;
- [ ] TriView/observabilidade refletem estados sem vazar conteúdo privado;
- [ ] full regression MCF passa;
- [ ] regressão completa do Cognitive Ledger passa;
- [ ] security/threat/privacy reviews passam;
- [ ] fresh recovery cross-repo 4/4 passa no SHA candidato final;
- [ ] staging publica exatamente o SHA candidato;
- [ ] documentação e Capsules estão reconciliadas;
- [ ] semver é decidido por compatibilidade real;
- [ ] nova release estável do MCF é publicada em tag/SHA imutáveis;
- [ ] estado live da release é confirmado no GitHub;
- [ ] bootstrap pós-release de Mestre segue a nova metodologia;
- [ ] prova pós-release de memória read/write passa;
- [ ] Emily emite parecer final de suficiência;
- [ ] Léo fecha os gates internos aplicáveis;
- [ ] Mestre apresenta o fechamento sem lacunas conhecidas;
- [ ] LEANDRO mantém autoridade sobre qualquer boundary reservado.

---

## 10. Fora de escopo por padrão

Salvo nova decisão explícita de LEANDRO, esta missão não autoriza:

- Cloud G2-B write;
- SSH ou NODE-01;
- promoção automática de produção do runtime MCF;
- escrita arbitrária em bancos/providers;
- captura silenciosa de todas as conversas como memória;
- embeddings pagos por mera presença de API key;
- armazenamento de secrets no Ledger, Capsules, Receipts, TriView ou Git;
- tornar TriView autoridade operacional;
- alterar release `v1.1.0` já publicada;
- reescrever histórico de tags/releases existentes.

---

## 11. Política de versionamento da missão

A release `v1.1.0` permanece imutável.

A nova metodologia será publicada como **nova release estável**.

Regra provisória:

- se a mudança for aditiva e backwards-compatible: candidato `v1.2.0`;
- se alterar contratos públicos de forma incompatível: avaliar `v2.0.0`;
- patch release não é adequada para este conjunto de capacidades.

A escolha final de versão é um gate de release, não uma suposição deste roadmap.

---

## 12. Fontes de verdade para esta missão

Ordem de precedência:

1. instruções explícitas atuais de LEANDRO;
2. GitHub/provider live;
3. código, testes, workflows e evidências do SHA aplicável;
4. `docs/MCF-CURRENT-STATE.md`;
5. este roadmap e decisões derivadas do onboarding;
6. contratos dos agentes e protocolo operacional;
7. documentação histórica.

Qualquer claim volátil deve ser revalidado antes de gate/release.

---

## 13. Estado inicial registrado no kickoff

No início desta missão:

- release estável pública conhecida: `v1.1.0`;
- `main` do MCF já contém o Context Fabric e o closeout da missão anterior;
- Cognitive Ledger read foi validado em lab/staging pelo caminho MCF → MCP → Edge/Auth → PostgREST → PostgreSQL;
- `cognitive-ledger.memory.read` permanece historicamente verificada, mas não live/ativa após teardown;
- nenhuma capability de escrita do Ledger foi integrada ao MCF;
- nenhum Ledger remoto com dados reais foi autorizado pela missão anterior;
- o próximo boundary precisa transformar a fundação read-only em memória persistente útil, sem abandonar os princípios fail-closed e de provenance.

---

## 14. Próxima ação imediata

Executar o onboarding com LEANDRO e fechar as decisões da seção 6.

Nenhuma escolha irreversível de provider live, política de captura automática, esquema final, autorização de dados reais ou número de release deve ser inferida antes dessas respostas.
