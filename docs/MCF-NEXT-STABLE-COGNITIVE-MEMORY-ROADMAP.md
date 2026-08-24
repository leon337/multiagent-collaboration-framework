# MCF — Roadmap da próxima release estável com memória cognitiva persistente

**Mission ID:** `MCF-MEMORY-LIVE-NEXT-STABLE-001`  
**Estado:** `MISSION_STARTED / CONTEXT_RECOVERED / ONBOARDING_CLOSED / ZERO_COST_ACTIVE / PHASE_02_AGENT_EXECUTION_PREPARED / IMPLEMENTATION_BLOCKED`  
**Classificação:** `CLASSE_C`  
**Autoridade humana final:** LEANDRO  
**Autoridade operacional:** LÉO  
**Coordenação:** MESTRE  
**Critério terminal:** a missão só termina quando a próxima release estável do MCF estiver publicada e houver prova reproduzível do ciclo real de memória persistente entre chats, com write governado do Cognitive Ledger, provider live autorizado, recovery cross-repo, staging exact-SHA, auditoria e prova pós-release.

---

## 1. Precedência e fonte de verdade

Aplicar, nesta ordem:

1. instrução explícita atual de LEANDRO;
2. estado live verificável em GitHub/providers;
3. código, testes e documentos do SHA/branch aplicável;
4. `project-instructions/*` e Protocolo Operacional Unificado vigente do MCF;
5. contrato/PRF da missão;
6. documentos históricos somente quando não conflitarem com fonte superior.

O Cognitive Ledger tem implementação relevante em `design/cognitive-ledger-foundation`; o `main` do repositório permanece bootstrap-level. Supabase/Postgres é a fonte operacional da memória; Git é código/documentação/histórico técnico e não é a fonte operacional do diário.

---

## 2. Estado real recuperado

O provider de memória já existe. Não estamos criando o Ledger do zero.

Estado verificado no início desta missão:

- Supabase `cognitive-ledger`, ref `glyfavvwarffkkthpwlj`, região `sa-east-1`, `ACTIVE_HEALTHY`, PostgreSQL 17;
- 26 Eventos Cognitivos, 26 Fontes e 39 Relações existentes;
- RPC transacional `public.registrar_evento_cognitivo(...)` já implementada;
- idempotência por ID compatível e colisão incompatível rejeitada;
- Edge Function `cognitive-ledger-api` live v6 possui write administrativo legado `POST /registros`;
- o boundary OAuth `/v1` live está atrás da implementação mais nova do repositório e precisa ser reconciliado;
- não existe ainda capability live `cognitive-ledger.memory.write` no MCF;
- MCF possui boundary de leitura do Ledger validado anteriormente, mas conexão live atual deve ser reprovada no SHA aplicável antes de release;
- staging MCF observado está atrás do `main` da missão e não pode ser usado como prova exact-SHA da nova release.

Nenhum novo conteúdo pessoal real deve ser exportado automaticamente para Git público, fixtures, issues, PRs, traces ou logs.

---

## 3. Contrato de produto fechado — decisões 1–19

1. reutilizar o Supabase/Postgres existente como provider operacional oficial, preservando todos os registros existentes;
2. persistência por pedido explícito ou sugestão inteligente seguida de confirmação; nunca captura automática silenciosa;
3. Mestre inicia o write governado; Miriam governa memória/provenance/reconciliação; outros agentes não recebem escrita direta por padrão;
4. preservar texto original autorizado + estrutura semântica; o original prevalece se interpretação divergir;
5. correções/supersessions preservam história e não fazem overwrite silencioso;
6. confirmação curta ao usuário + Receipt auditável somente após persistência e read-back;
7. prova sintética primeiro; memória real somente depois dos gates e autorização explícita;
8. evolução in-place com inventário, backup/restore e migração compatível/reversível; sem reset/reseed destrutivo;
9. MCF usa capability OAuth dedicada de write, nunca `service_role` ou SQL genérico; boundary administrativo legado permanece separado até desenho de endurecimento/depreciação;
10. alvo SemVer `v1.2.0` se a mudança permanecer aditiva/compatível; breaking change real obriga reenquadramento técnico;
11. nova stable vira `latest` somente após todos os gates e prova pós-release;
12. Git fica para código/documentação/histórico técnico; novas memórias reais permanecem no provider privado;
13. texto original autorizado fica em `fontes`; Evento Cognitivo guarda a interpretação estruturada;
14. persistir apenas trecho relevante + contexto mínimo necessário, não a conversa inteira por padrão;
15. gerar automaticamente 3–8 palavras-chave concisas, preferencialmente em `assuntos`;
16. recuperação padrão apresenta cartão cognitivo curto; original/provenance sob demanda ou quando necessários para validação;
17. correções preservam histórico; comando inequívoco de exclusão definitiva usa hard delete privilegiado do conteúdo privado/dependentes, com no máximo tombstone sem conteúdo quando necessário;
18. busca textual/estruturada funciona sempre; embeddings externos ficam desabilitados por padrão e exigem opt-in separado;
19. LEANDRO não é operador técnico da equipe; papéis de agentes não podem ser simulados, relabelados ou creditados sem execução real e evidência.

O onboarding está encerrado. Decisões técnicas restantes pertencem à equipe e só escalam para LEANDRO em matérias reservadas pela Human Delegation Firewall.

---

## 4. Invariante de custo zero

A missão deve usar **custo novo zero**.

É proibido tratar como caminho operacional:

- task run billable de agente externo;
- API de modelo paga;
- embedding pago ativado implicitamente;
- runner GitHub pago/larger runner;
- serviço pago introduzido apenas para executar a missão.

O Brainbase foi explorado como possível executor real, mas task runs são billable. PR #169 foi encerrado sem merge e essa rota está fora da missão. Nenhuma task billable foi executada e nenhum conteúdo privado/segredo do Ledger foi enviado ao Brainbase.

Foi recuperado no ecossistema um padrão existente de inferência local em `leon337/predixai-platform`: OpenClaw/Ollama com `qwen2.5:1.5b`, explicitamente sem requisito de API paga. A missão reutiliza apenas o **padrão técnico** e não depende de operação manual da máquina de LEANDRO.

GitHub documenta que runners padrão hospedados pelo GitHub são gratuitos em repositórios públicos. Enquanto essa condição continuar verdadeira e o MCF permanecer público, um runner padrão pode ser usado para inferência local da missão; qualquer mudança dessa condição deve falhar fechado.

---

## 5. Regra de seleção e anti-simulação

O MCF possui 29 agentes oficiais disponíveis no pool. A governança não exige executar todos em toda fase e proíbe participação decorativa.

Um agente só recebe crédito quando existem simultaneamente:

1. identidade de execução distinguível do coordenador;
2. work packet compatível com sua competência;
3. ação cognitiva/técnica realmente executada;
4. artefato produzido por essa execução;
5. evidência/Receipt ou log verificável ligando identidade, ação, tempo, resultado e artefato;
6. handoff cronológico quando a próxima etapa depende dele.

Nomear um agente em prompt/plano/relatório não constitui participação. Conteúdo escrito pelo Mestre não pode ser relabelado como artefato de Sofia, Miriam, Ricardo, Emily, Léo ou qualquer outro agente.

---

## 6. Fase 2 — arquitetura e segurança

Estado: `ABERTA / EXECUÇÃO REAL PREPARADA / AGUARDANDO CI DO HARNESS ZERO-COST`.

PRF: `artifacts/phases/PHASE-02-MEMORY-ARCHITECTURE/`.

O Mestre já produziu artefatos próprios de recuperação, runtime audit, source inventory, decisões e coordenação. Eles não dão crédito aos especialistas.

Cadeia selecionada para entrega real da Fase 2:

`Miriam -> Sofia -> Manoel -> Daniela -> Ricardo -> Júlia -> Tiago -> Rafael -> Eduardo -> Bruno -> Renato -> Beatriz -> Augusto -> Emily -> Léo`

A branch de recuperação zero-cost adiciona um harness mission-only baseado em GitHub Actions padrão + Ollama local. Cada especialista é uma execução isolada do modelo com UUID próprio, output delimitado e SHA-256. O harness não recebe memória pessoal, segredos ou credenciais e não modifica provider/repositório durante a execução.

Saídas exigidas da fase:

- source-of-truth/provenance/reconciliation;
- arquitetura MCF -> Ledger write e ADRs;
- schema/migração/backup/restore/rollback;
- lineage e qualidade de dados;
- threat model/authN/authZ/secrets/fail-closed;
- privacidade/autonomia/hard-delete;
- RAG/embedding/textual fallback sem custo pago;
- decomposição de implementação;
- contrato backend/capability/Receipt/read-back;
- staging/live/exact-SHA/observabilidade zero-cost;
- matriz de testes/E2E/regressão;
- avaliação comportamental de Mestre/Miriam;
- trace ESEV/anti-simulation;
- auditoria independente;
- gate de Léo baseado em evidência.

A execução do harness não aprova arquitetura por si só. Outputs fracos/incorretos devem ser corrigidos pelo loop e pelos agentes seguintes, não tratados como autoridade automática.

---

## 7. Fases seguintes

### Fase 3 — implementação write em lab

Somente após arquitetura/gates da Fase 2.

- write semântico específico, nunca SQL genérico;
- persistência transacional;
- read-back + Receipt;
- auth/capability tests;
- idempotência/colisão;
- regressão read-only;
- zero dados reais.

### Fase 4 — adapter MCF + comportamento Mestre/Miriam

- capability `cognitive-ledger.memory.write` no Registry;
- operação allowlisted e fail-closed;
- pedido explícito/sugestão confirmada;
- policy hooks de memória/provenance;
- E2E do boundary aplicável.

### Fase 5 — provider live

- preservar 26/26/39 existentes;
- backup/restore antes de migration material;
- reconciliar Edge Function live/repo;
- OAuth/capability governado;
- secrets protegidos;
- logs sem conteúdo privado;
- embeddings desligados por padrão;
- currentness verificada.

### Fase 6 — E2E live sintético

- sessão A grava marcador sintético;
- Receipt confirma persistência/read-back;
- sessão B recupera sem depender do histórico efêmero de A;
- cleanup/invalidation conforme política.

### Fase 7 — primeira memória real autorizada

Somente depois dos gates anteriores. Nenhum conteúdo real entra em Git/CI/evidência pública.

### Fase 8 — regressão cross-repo / Context Fabric / TriView

- recovery 4/4;
- capabilities read/write qualificadas;
- TriView sem conteúdo privado por padrão;
- Capsules/Registry sincronizados.

### Fase 9 — staging exact-SHA + auditoria final

- CI completa;
- staging exact-SHA;
- security/privacy review;
- PRF Classe C completo;
- Emily audita evidência real;
- Léo decide gate.

### Fase 10 — release estável

- SemVer validado;
- alvo `v1.2.0` se compatível;
- tag/release no SHA exato;
- releases anteriores imutáveis.

### Fase 11 — prova pós-release e closeout

- release publicada live verificada;
- tag/SHA/artefatos verificados;
- fresh recovery;
- ciclo real de memória verificado;
- stable promovida a `latest` somente após PASS;
- Mission Control fecha apenas com objetivo terminal atendido.

---

## 8. Critério terminal

`ENTREGUE` exige simultaneamente:

- nova release estável publicada;
- write existente do Ledger integrado ao MCF por capability governada;
- provider live privado/autorizado;
- dados existentes preservados sem perda silenciosa;
- sintético A->B PASS;
- memória real autorizada A->B PASS;
- read regression PASS;
- recovery 4/4 PASS;
- staging exact-SHA PASS;
- PRF Classe C completo;
- auditoria final suficiente;
- decisão de Léo compatível;
- prova pós-release PASS;
- nova stable `latest` conforme contrato;
- custo novo pago da missão = zero;
- nenhuma pendência executável restante no escopo.

Até lá, a missão permanece aberta.
