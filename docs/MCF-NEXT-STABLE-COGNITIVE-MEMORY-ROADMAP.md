# MCF — Roadmap da próxima release estável com memória cognitiva persistente

**Mission ID:** `MCF-MEMORY-LIVE-NEXT-STABLE-001`  
**Estado:** `MISSION_STARTED / CONTEXT_RECOVERED / ONBOARDING_CLOSED / PHASE_02_EXECUTOR_READY / BILLABLE_RUN_GATE_PENDING / IMPLEMENTATION_BLOCKED`  
**Classificação:** `CLASSE_C`  
**Autoridade humana final:** LEANDRO  
**Autoridade operacional:** LÉO  
**Coordenação:** MESTRE  
**Critério terminal:** a missão termina somente quando a próxima release estável do MCF estiver publicada e a memória persistente cross-chat estiver comprovada em provider live autorizado, com write governado do Cognitive Ledger, recovery cross-repo, staging exact-SHA, auditoria final e prova pós-release.

---

## 1. Precedência e fontes de verdade

Aplicar, nesta ordem:

1. instruções vigentes da plataforma;
2. instruções atuais do projeto;
3. `project-instructions/MCF-PROJECT-OPERATING-INSTRUCTIONS.md`;
4. decisões e protocolo operacional vigentes do MCF;
5. estado live verificado de GitHub/providers;
6. contrato e artefatos específicos da missão;
7. documentos históricos.

O Cognitive Ledger usa Supabase/Postgres como fonte operacional de verdade. Git é código, documentação e histórico técnico; novo conteúdo pessoal real não deve ser exportado automaticamente ao Git público, fixtures, CI, issues, PRs, traces ou logs.

---

## 2. Estado real recuperado

### Cognitive Ledger / Supabase

Provider oficial existente:

- projeto Supabase `glyfavvwarffkkthpwlj` (`cognitive-ledger`);
- região `sa-east-1`;
- estado verificado `ACTIVE_HEALTHY`;
- PostgreSQL 17;
- 26 Eventos Cognitivos;
- 26 Fontes;
- 39 Relações;
- RPC transacional `public.registrar_evento_cognitivo(...)`;
- idempotência por ID e rejeição de colisão incompatível.

Não apagar, resetar ou reseedar os registros existentes. Mudanças materiais exigem inventário, backup/restore, migração compatível e rollback.

### Edge Function live

`cognitive-ledger-api` live permanece na versão 6 e possui o write administrativo legado `POST /registros`. O boundary OAuth `/v1` live está atrás da implementação mais nova do repositório. A capability MCF `cognitive-ledger.memory.write` ainda não existe live.

A versão live contém caminho de embedding dependente de configuração externa. Embeddings permanecem desabilitados por política até opt-in separado; presença de credencial não equivale a autorização.

### MCF runtime

O MCF valida missão, skills, selected_agents, permissões, evidence envelope e Receipt. O runtime não deve receber texto do coordenador relabelado como evidência cognitiva de outro agente.

### Staging MCF

O `mcf-runtime-staging-api` observado continua atrás da linhagem atual da missão. Staging somente poderá contar como prova quando estiver em exact-SHA do candidato qualificado.

---

## 3. Contrato de produto fechado

1. **Provider:** evoluir in-place o Supabase/Postgres existente e preservar os registros atuais.
2. **Captura:** pedido explícito ou sugestão inteligente seguida de confirmação; nunca persistência automática silenciosa.
3. **Autoridade de write:** Mestre inicia a escrita governada; Miriam governa memória/provenance/reconciliação; outros agentes não recebem escrita direta por padrão.
4. **Representação:** texto original autorizado + estrutura semântica; o original prevalece se houver divergência.
5. **Correção:** refinamentos/supersessions preservam história; sem overwrite silencioso.
6. **Confirmação:** resposta curta + Receipt somente após persistência e read-back verificáveis.
7. **Prova:** sintético primeiro; memória real somente no final com autorização explícita.
8. **Dados existentes:** sem reset/reseed destrutivo; backup/restore e migrações compatíveis.
9. **AuthN/AuthZ:** capability OAuth dedicada, como `cognitive-ledger.memory.write`; MCF não recebe `service_role`; write administrativo fica separado até decisão arquitetural.
10. **SemVer:** alvo `v1.2.0` se a mudança permanecer aditiva/compatível; breaking change real exige reenquadramento.
11. **Latest:** nova stable vira `latest` somente depois de todos os gates e prova pós-release.
12. **Git:** novas memórias reais ficam no provider privado; Git não é sink de memória pessoal nova.
13. **Original:** conteúdo original autorizado em `fontes`; Evento Cognitivo mantém interpretação estruturada.
14. **Minimização:** trecho relevante + contexto mínimo necessário, não conversa inteira por padrão.
15. **Palavras-chave:** 3–8 palavras-chave concisas, preferencialmente em `assuntos`.
16. **Recuperação:** cartão cognitivo curto primeiro; original/provenance sob demanda ou validação.
17. **Exclusão definitiva:** correções preservam histórico; hard delete explícito usa fluxo privilegiado separado, removendo conteúdo privado/dependentes e mantendo no máximo tombstone sem conteúdo quando necessário.
18. **Busca/embeddings:** busca textual/estruturada sempre disponível; embeddings externos opt-in.
19. **Modelo operacional:** LEANDRO não é operador técnico. O pool oficial é mantido disponível, mas a seleção por fase obedece ao protocolo: somente agentes com entrega concreta são executados e creditados; participação decorativa e exigência artificial de trabalho de todos são proibidas.

A cláusula 19 acima aplica a precedência documental vigente e substitui qualquer redação anterior da missão que exigisse contribuição obrigatória dos 29 agentes independentemente de necessidade.

---

## 4. Regra de execução real

Um agente só recebe crédito quando existem:

1. identidade de execução distinguível;
2. work packet compatível com sua competência;
3. execução real;
4. artefato/evidência produzidos pela execução;
5. Receipt ou identificador rastreável quando disponível;
6. handoff cronológico quando houver dependência.

Nome, prompt, comentário ou menção não constituem execução.

---

## 5. Executor externo — estado atual

O Brainbase MCP foi conectado e verificado como executor externo capaz de criar agentes gerenciados e task runs distinguíveis.

Estado materializado:

- organização: `Leandro Carlos's Team`;
- equipe: `General`;
- roster MCF: **29/29 agentes oficiais criados** com funções alinhadas à matriz vigente;
- nenhuma task run foi iniciada até este checkpoint;
- nenhuma memória pessoal, `fontes.conteudo_bruto`, token, `service_role` ou segredo foi enviado ao executor.

Orquestração privada da Fase 2 criada:

- ID `33296bb3-2020-43cf-8d62-e5c1d364f6b0`;
- membros selecionados: Mestre, Miriam, Sofia, Manoel, Ricardo, Júlia, Rafael, Eduardo, Bruno, Renato, Beatriz, Augusto, Emily e Léo;
- cadeia preparada para ESEV, sem trigger automático.

`GATE-RUNTIME-REALITY = SATISFIED_FOR_EXECUTOR_IDENTITY_AND_CONFIGURATION`.

Task runs do Brainbase são billable. Pelo Human Delegation Firewall, custo financeiro novo permanece matéria reservada à autoridade humana. Portanto:

`GATE-BRAINBASE-BILLABLE-RUN = PENDING_HUMAN_AUTHORIZATION`.

Esse gate não pede operação técnica a LEANDRO; pede somente autorização de custo/execução.

---

## 6. Seleção atual da Fase 2

Selecionados por entrega concreta:

- **Mestre** — contrato, sequência e handoffs;
- **Miriam** — source-of-truth, provenance e conflitos;
- **Sofia** — arquitetura;
- **Manoel** — persistência, migração, backup/restore;
- **Ricardo** — threat model, authN/authZ, secrets;
- **Júlia** — governança de dados/autonomia Classe C;
- **Rafael** — desenho de integração;
- **Eduardo** — contrato backend/API/capability;
- **Bruno** — ambiente, rollback, reliability;
- **Renato** — estratégia de testes/E2E;
- **Beatriz** — comportamento/regressão de agentes/memória;
- **Augusto** — trace e ESEV;
- **Emily** — auditoria independente;
- **Léo** — gate da fase.

Os demais agentes permanecem no pool e só entram se surgir entrega real no respectivo domínio.

---

## 7. Método obrigatório

`CONTRATAR → RECUPERAR CONTEXTO → EXECUTAR → VERIFICAR → MEDIR PROGRESSO → CORRIGIR OU AVANÇAR → REPETIR`

Classe C exige PRF, ESEV cronológico, evidence/Receipt, controles obrigatórios, auditoria e decisão de Léo.

A Human Delegation Firewall permanece ativa: LEANDRO decide propósito, riscos materiais, custo, exposição pública, ações irreversíveis e autorizações externas; não executa CLI, SQL, migrations, deploys, debug, OAuth, secrets ou tarefas de engenharia para a equipe.

---

## 8. Fases

### Fase 0 — Roadmap e abertura

Estado: `CONCLUÍDA`.

### Fase 1 — Recuperação/onboarding/contrato de produto

Estado: `CONCLUÍDA COMO CONTRATO DE PRODUTO`.

### Fase 2 — Arquitetura, threat model e contrato

Estado: `EXECUTOR_READY / BILLABLE_RUN_GATE_PENDING`.

PRF: `artifacts/phases/PHASE-02-MEMORY-ARCHITECTURE/`.

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
- compatibilidade/SemVer;
- auditoria independente e gate Léo.

### Fase 3 — Implementação write em lab

Só inicia após arquitetura aprovada. Zero dados reais.

### Fase 4 — Adapter MCF + comportamento Mestre/Miriam

Capability `cognitive-ledger.memory.write`, allowlist, fail-closed e AppModule/MCP E2E.

### Fase 5 — Provider live

Preservar dados atuais; reconciliar Edge Function; OAuth/capability; secrets; backup/restore; embeddings off por padrão.

### Fase 6 — E2E live sintético

Sessão A grava marcador sintético; Receipt/read-back; sessão B recupera; cleanup/invalidation.

### Fase 7 — Primeira memória real autorizada

Somente após gates anteriores; sem vazamento para Git/logs/evidências públicas.

### Fase 8 — Regressão cross-repo / Context Fabric / TriView

Recovery 4/4; read/write qualificadas; Capsules/Registry sincronizados; privacidade por padrão.

### Fase 9 — Staging exact-SHA e auditoria final

CI, staging exact-SHA, security/privacy, PRF completo, Emily e gate Léo.

### Fase 10 — Release estável

SemVer validado; alvo `v1.2.0` se compatível; tag/release no SHA exato; releases anteriores imutáveis.

### Fase 11 — Prova pós-release e closeout

Release publicada verificada; fresh recovery; ciclo real de memória; `latest` após PASS; Mission Control só fecha com objetivo terminal atendido.

---

## 9. Critério terminal

`ENTREGUE` exige simultaneamente:

- nova release estável publicada;
- write do Ledger integrado ao MCF por capability governada;
- provider live privado/autorizado;
- registros existentes preservados sem perda silenciosa;
- todas as participações creditadas possuírem execução/evidência real;
- sintético A→B PASS;
- memória real autorizada A→B PASS;
- read regression PASS;
- recovery 4/4 PASS;
- staging exact-SHA PASS;
- PRF Classe C completo;
- auditoria independente suficiente;
- decisão de Léo compatível;
- prova pós-release PASS;
- nova stable marcada `latest` conforme decisão aprovada;
- nenhuma pendência executável restante no escopo.

Até lá, a missão permanece aberta.
