# MCF — Roadmap da próxima release estável com memória cognitiva persistente

**Mission ID:** `MCF-MEMORY-LIVE-NEXT-STABLE-001`  
**Estado:** `MISSION_STARTED / CONTEXT_RECOVERED / ONBOARDING_CLOSED / PHASE_02_EXECUTION_GATED / IMPLEMENTATION_BLOCKED`  
**Classificação:** `CLASSE_C`  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Continuidade e gates internos:** LÉO  
**Critério terminal:** a missão só termina quando a próxima release estável do MCF estiver publicada e houver evidência reproduzível do ciclo real de memória persistente entre chats, com write governado do Cognitive Ledger, provider live autorizado, recovery cross-repo, staging exact-SHA, auditoria final e prova pós-release.

---

## 1. Regra de fonte de verdade da missão

Ordem de precedência:

1. instrução explícita atual de LEANDRO;
2. GitHub/provider live;
3. código, testes e documentos do SHA/branch aplicável;
4. `project-instructions/*` e Protocolo Operacional Unificado vigente do MCF;
5. documentos históricos, somente quando não conflitarem com uma fonte superior.

O Cognitive Ledger tem implementação relevante em `design/cognitive-ledger-foundation`; o `main` do repositório continua bootstrap-level. O estado live do provider deve sempre ser verificado antes de afirmações operacionais.

---

## 2. Estado real recuperado

A premissa inicial de que seria necessário criar escrita do zero foi corrigida. O provider já possui o domínio operacional do Ledger e uma escrita administrativa existente.

### Cognitive Ledger / Supabase

Provider oficial escolhido e já existente:

- projeto Supabase: `glyfavvwarffkkthpwlj` (`cognitive-ledger`);
- região: `sa-east-1`;
- estado verificado: `ACTIVE_HEALTHY`;
- PostgreSQL 17;
- 26 Eventos Cognitivos;
- 26 Fontes;
- 39 Relações;
- 0 eventos com embedding armazenado no checkpoint atual;
- 0 clientes OAuth cadastrados no checkpoint atual.

O provider já possui RPC transacional `public.registrar_evento_cognitivo(...)`, idempotência por ID e rejeição de colisão incompatível.

### Edge Function live

A função `cognitive-ledger-api` live permanece na versão 6. Ela possui o boundary administrativo legado de escrita (`POST /registros`) e autenticação própria. O boundary OAuth `/v1` live está atrás da implementação mais nova do repositório: autentica cliente, mas não entrega as rotas read-only mais recentes. Também não existe ainda `cognitive-ledger.memory.write` live.

A versão live ainda contém indexação de embedding em background dependente de `OPENAI_API_KEY`. Isso não prova uso pago, mas conflita com a política aprovada de opt-in explícito e deve ser reconciliado antes da ativação governada.

### MCF runtime

O runtime MCF é software real de orquestração/evidência. Ele valida missão, skill, agente selecionado, permissões, evidence envelope e Receipt. Entretanto, os skills cognitivos governados recebem `execution_evidence` produzida pelo agente selecionado; o runtime atual não origina sozinho o trabalho cognitivo de Sofia, Miriam, Ricardo etc.

O Chat bridge executa apenas o bootstrap permitido e deixa trabalho especializado em estado equivalente a `READY_AGENT` até existir execução/evidência real.

### Staging MCF

O serviço Render `mcf-runtime-staging-api` continua live, com auto-deploy desabilitado, mas o deploy observado está no SHA `3d6367fb6a821c2e1b4acb7976aef82fac06daf5`, atrás do `main` desta missão. Ele não pode ser usado como prova exact-SHA da nova release até promoção governada posterior.

---

## 3. Boundary de privacidade

Supabase/Postgres é a fonte operacional de verdade da memória.

Git é código, documentação e histórico técnico. Novo conteúdo pessoal real não deve ser exportado automaticamente ao Git público, fixtures, CI, issues, PRs, traces ou logs.

O modelo durável é Evento Cognitivo + Fonte/proveniência, não a cópia integral da conversa.

---

## 4. Contrato de produto fechado — decisões 1–19

1. **Provider:** reutilizar o Supabase/Postgres existente como provider operacional oficial e preservar os registros atuais.
2. **Captura:** pedido explícito ou sugestão inteligente seguida de confirmação; nunca persistência automática silenciosa.
3. **Autoridade de write:** Mestre inicia a escrita governada; Miriam governa memória/provenance/reconciliação; outros agentes não recebem escrita direta por padrão.
4. **Representação:** texto original autorizado + estrutura semântica; o original prevalece se houver divergência de interpretação.
5. **Correção:** refinamentos/supersessions preservam história; não existe overwrite silencioso.
6. **Confirmação:** resposta curta + Receipt auditável somente após persistência e read-back verificáveis.
7. **Prova:** sintético primeiro; memória real somente no final e com autorização explícita.
8. **Dados existentes:** evolução in-place com inventário, backup/restore, migração compatível/reversível e sem reset/reseed destrutivo.
9. **AuthN/AuthZ:** MCF usa capability OAuth dedicada, como `cognitive-ledger.memory.write`; MCF nunca recebe `service_role`; write administrativo legado fica separado até a arquitetura definir endurecimento/depreciação.
10. **SemVer:** alvo `v1.2.0` se a mudança permanecer aditiva/compatível; breaking change real obriga reenquadramento técnico de SemVer.
11. **Latest:** a nova stable vira `latest` somente depois de todos os gates e prova pós-release.
12. **Git:** novas memórias reais permanecem no provider privado; Git não é sink de memória pessoal nova.
13. **Original:** conteúdo original autorizado fica em `fontes`; Evento Cognitivo armazena a interpretação estruturada.
14. **Minimização:** persistir somente o trecho relevante + contexto mínimo necessário, não a conversa inteira por padrão.
15. **Palavras-chave:** gerar automaticamente 3–8 palavras-chave concisas, preferencialmente em `assuntos`, para melhorar leitura e absorção.
16. **Recuperação:** apresentar primeiro cartão cognitivo curto; texto original e provenance ficam disponíveis sob demanda ou para validação.
17. **Exclusão definitiva:** correções normais preservam histórico; comando inequívoco de exclusão definitiva usa fluxo privilegiado de hard delete do conteúdo privado/dependentes, com no máximo tombstone sem conteúdo quando auditabilidade exigir.
18. **Busca/embeddings:** busca textual/estruturada funciona sempre; embeddings externos ficam desabilitados por padrão e exigem opt-in separado; presença de API key não é autorização.
19. **Modelo operacional:** LEANDRO não é operador técnico da equipe; arquitetura/implementação são responsabilidade dos agentes. Os 29 agentes oficiais devem contribuir substantivamente para este goal e produzir seus próprios artefatos reais. É deterministicamente proibido simular papéis ou relabelar artefatos do coordenador como se fossem de outro agente.

O onboarding está encerrado. As decisões técnicas restantes pertencem à arquitetura e aos especialistas e não devem ser empurradas para LEANDRO como operação técnica.

---

## 5. Regra de execução real dos agentes

Nomear um agente em plano, prompt, comentário ou relatório não constitui participação.

Um agente só recebe crédito quando existem simultaneamente:

1. identidade de execução real distinguível do coordenador;
2. work packet da missão compatível com sua competência oficial;
3. artefato criado por essa execução;
4. evidência/Receipt ligando agente, ação, artefato, origem, tempo e resultado;
5. handoff cronológico visível quando houver dependência.

Sem isso, o estado correto é `CONVOKED_WAITING_EXECUTOR` ou equivalente.

O requisito humano de participação dos 29 agentes é mission-wide e não revoga a regra MCF contra participação decorativa. Cada agente precisa produzir entrega real em algum ponto da missão antes do terminal `ENTREGUE`.

---

## 6. Roster mission-wide e artefatos obrigatórios

| Agente | Entrega substantiva mínima da missão |
|---|---|
| Léo | gate(s) baseados em evidência |
| Mestre | contratos, ESEV, orchestration ledger e handoffs |
| Leonardo | critérios de produto/release e aceite |
| Carlos | horizonte de riscos/oportunidades da memória durável |
| Evelyn | coordenação/decisão de experiência |
| Laura | fluxo UX de captura/recuperação |
| Isabela | especificação visual/estados do cartão cognitivo |
| Marina | acessibilidade/legibilidade |
| Sofia | arquitetura e ADRs |
| Rafael | desenho/execução de implementação e integração |
| Manoel | schema, backup/restore e migração |
| Renato | estratégia e evidências de validação |
| Bruno | staging/live, rollback, observabilidade e SRE |
| Ricardo | threat model e security review |
| Gabriel | branch/PR/tag/release provenance |
| Carmem | documentação técnica e consolidação PRF |
| Emily | auditoria independente baseada em evidência |
| Eduardo | contrato backend/API/capability e integração |
| Helena | impacto frontend/host ou no-impact comprovado por execução própria |
| André | impacto mobile/client ou no-impact comprovado por execução própria |
| Tiago | política técnica de RAG/embeddings/fallback |
| Daniela | lineage, qualidade e reconciliação de dados |
| Vinícius | code review/refactoring e disposition |
| Patrícia | failure-mode/debug/recovery drill |
| Lucas | performance/recursos/sustentabilidade |
| Augusto | trace multiagente, loops e handoffs |
| Beatriz | avaliação de agentes/memória/routing/regressões |
| Miriam | recovery/provenance/conflitos/reconciliação/governança de memória |
| Júlia | privacidade, dados, autonomia e compliance Classe C |

Um `no-impact` só conta se for conclusão real do próprio agente após inspeção e com evidência.

---

## 7. Gate de execução atual

`GATE-RUNTIME-REALITY = NOT_SATISFIED` para crédito dos agentes cognitivos nomeados diferentes de Mestre.

A auditoria do runtime mostrou que o MCF já valida evidence/receipts, mas ainda depende de um executor que produza a evidência cognitiva do agente selecionado. O tool surface desta sessão também não oferece dispatcher nativo de subagentes nem um POST autenticado direto ao boundary de sessão do runtime MCF.

Foi identificado um managed-agent provider externo disponível no ecossistema ChatGPT capaz de executar agentes/task runs, mas ele não está instalado/conectado. Conexão de terceiro é gate de autorização e não pode ser feita silenciosamente. Nenhuma credencial, configuração manual ou operação técnica será solicitada a LEANDRO para contornar essa ausência.

Enquanto o executor real não estiver disponível:

- Mestre pode continuar recuperação de fontes, contratos, inventários e artefatos próprios de coordenação;
- agentes não executados não recebem crédito;
- conteúdo criado pelo Mestre não será inserido como `execution_evidence` de Sofia/Miriam/Ricardo/etc.;
- implementação permanece bloqueada;
- nenhum dado pessoal real é enviado a executor externo.

---

## 8. Método obrigatório

Fluxo operacional:

`CONTRATAR → RECUPERAR CONTEXTO → EXECUTAR → VERIFICAR → MEDIR PROGRESSO → CORRIGIR OU AVANÇAR → REPETIR`

Classe C exige PRF, ESEV cronológico, ações reais, evidence/Receipt, controles obrigatórios, auditoria e decisão de Léo.

A Human Delegation Firewall permanece ativa: LEANDRO decide propósito, riscos materiais, custo, exposição pública, ações irreversíveis e autorizações externas; não executa CLI, SQL, migrations, deploys, debug, OAuth, secrets ou tarefas de engenharia para a equipe.

---

## 9. Fases da missão

### Fase 0 — Roadmap e abertura

Estado: `CONCLUÍDA`.

- roadmap canônico em `main`;
- Mission Control #164 aberto;
- objetivo terminal e fontes de verdade definidos.

### Fase 1 — Recuperação/onboarding/contrato de produto

Estado: `CONCLUÍDA COMO CONTRATO DE PRODUTO`.

- 19 decisões fechadas pela autoridade humana;
- nenhuma participação especializada passada é retroativamente creditada sem execução real;
- implementação continua bloqueada até arquitetura.

### Fase 2 — Arquitetura, threat model e contrato

Estado: `ABERTA / EXECUTION_GATED`.

PRF: `artifacts/phases/PHASE-02-MEMORY-ARCHITECTURE/`.

Já existem artefatos reais do Mestre para contrato, decisões, auditoria do runtime, source inventory, dispatch dos 29 e checkpoint. Os artefatos especializados aguardam executor real distinguível.

Saídas exigidas:

- current-state map MCF/Ledger/Supabase/Render/Context Fabric;
- reconciliação de drift live/repo;
- capability OAuth least-privilege de write;
- idempotência, read-back e Receipt;
- correction/supersession/hard-delete;
- provenance/minimização/public-Git boundary;
- backup/restore/migração/rollback;
- cross-chat recovery e cognitive-card contract;
- embeddings opt-in;
- threat model/compliance/failure behavior;
- observabilidade/auditoria/release evidence;
- exact-SHA staging/post-release plan;
- avaliação de compatibilidade/SemVer;
- auditoria independente e gate Léo.

### Fase 3 — Implementação de integração write em lab

Só inicia depois do design/gates da Fase 2.

Critérios:

- write específico, nunca SQL genérico;
- persistência transacional;
- read-back + Receipt;
- auth/capability tests;
- idempotência/colisão;
- regressão read-only;
- zero dados reais.

### Fase 4 — Adapter MCF + comportamento Mestre/Miriam

Critérios:

- capability `cognitive-ledger.memory.write` no Registry;
- operação allowlisted e fail-closed;
- captura explícita/sugestão confirmada;
- policy hooks de memória/provenance;
- AppModule/MCP E2E.

### Fase 5 — Provider live

Critérios:

- preservar 26 eventos, 26 fontes e 39 relações atuais;
- backup/restore antes de migration material;
- reconcile Edge Function live/repo;
- OAuth client/capability governado;
- secrets protegidos;
- logs sem conteúdo privado desnecessário;
- embeddings desativados por padrão;
- currentness verificada.

### Fase 6 — E2E live sintético

- Chat/sessão A grava marcador sintético;
- Receipt confirma persistência/read-back;
- Chat/sessão B recupera sem histórico efêmero de A;
- cleanup/invalidation conforme política.

### Fase 7 — Primeira memória real autorizada

Somente após gates anteriores.

- memória real explicitamente autorizada;
- persistência/read-back comprovados;
- recuperação em outra sessão;
- nenhum vazamento para Git/logs/evidências públicas.

### Fase 8 — Regressão cross-repo / Context Fabric / TriView

- recovery 4/4;
- read/write capabilities qualificadas;
- TriView sem conteúdo privado por padrão;
- Capsules/Registry sincronizados.

### Fase 9 — Staging exact-SHA e auditoria final

- CI completa;
- staging exact-SHA;
- security/privacy review;
- PRF Classe C completo;
- Emily audita evidência real;
- Léo decide gate.

### Fase 10 — Release estável

- SemVer validado;
- alvo `v1.2.0` se compatível;
- tag/release no SHA exato;
- release notes Context Fabric + memória persistente;
- releases anteriores imutáveis.

### Fase 11 — Prova pós-release e closeout

- release publicada verificada;
- tag/SHA/artefatos verificados;
- fresh recovery;
- ciclo real de memória verificado;
- nova stable promovida a `latest` após PASS;
- Mission Control só fecha com objetivo terminal atendido.

---

## 10. Critério terminal

`ENTREGUE` exige simultaneamente:

- nova release estável publicada;
- write existente do Ledger integrado ao MCF por capability governada;
- provider live privado/autorizado;
- registros existentes preservados sem perda silenciosa;
- todos os 29 agentes com contribuição substantiva real e artefato próprio rastreável;
- sintético A→B PASS;
- memória real autorizada A→B PASS;
- read regression PASS;
- recovery 4/4 PASS;
- staging exact-SHA PASS;
- PRF Classe C completo;
- auditoria independente suficiente;
- decisão de Léo compatível;
- prova pós-release PASS;
- nova stable marcada `latest` conforme decisão humana;
- nenhuma pendência executável restante no escopo.

Até lá, a missão permanece aberta.
