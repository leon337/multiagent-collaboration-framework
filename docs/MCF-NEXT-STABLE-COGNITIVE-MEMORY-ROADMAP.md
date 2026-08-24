# MCF — Roadmap da próxima release estável com memória cognitiva persistente

**Mission ID:** `MCF-MEMORY-LIVE-NEXT-STABLE-001`  
**Estado:** `MISSION_STARTED / CONTEXT_RECOVERED / ONBOARDING_IN_PROGRESS / IMPLEMENTATION_BLOCKED`  
**Classificação preliminar:** `CLASSE_C`  
**Autoridade humana final:** LEANDRO  
**Orquestração:** MESTRE  
**Continuidade e gates internos:** LÉO  
**Critério terminal:** a missão só termina quando a próxima release estável do MCF estiver publicada e houver evidência reproduzível do ciclo real de memória persistente entre chats, com write governado do Cognitive Ledger, provider live autorizado, recovery cross-repo, staging exact-SHA e auditoria final.

---

## 1. Regra de fonte de verdade da missão

Ordem de precedência:

1. instrução explícita atual de LEANDRO;
2. GitHub/provider live;
3. código, testes e documentos do SHA/branch aplicável;
4. protocolo operacional vigente do MCF;
5. documentos históricos.

Para o Cognitive Ledger, a implementação atual vive em `design/cognitive-ledger-foundation`; o `main` do repositório permanece um bootstrap. Estados live, deploys, conexões e credenciais devem ser verificados novamente antes de qualquer afirmação operacional.

---

## 2. Correção de contexto incorporada ao roadmap

O onboarding inicial desta missão começou antes de uma leitura suficiente do repositório do Cognitive Ledger. A recuperação posterior mostrou que a premissa “precisamos criar escrita do zero” era incorreta.

O provider já possui:

- tabela `eventos_cognitivos`;
- tabela `fontes`;
- tabela `relacoes`;
- RPC transacional `public.registrar_evento_cognitivo(...)`;
- rota administrativa `POST /registros` na Edge Function;
- idempotência por ID compatível e rejeição de colisão incompatível;
- leitura de volta/timeline;
- exportação controlada Supabase → Git;
- histórico de Eventos Cognitivos já existente.

O que continua faltando para o objetivo desta missão é a **integração governada desse write existente ao MCF**, com authN/authZ apropriados, capability própria, provider live atual verificado e prova cross-chat.

---

## 3. O que o Cognitive Ledger já é hoje

O roadmap canônico do próprio Ledger define:

```text
Supabase / Postgres
=
fonte operacional de verdade

Git
=
código + documentação + histórico + exportação/backup controlado
```

Logo, ler `diario/*.md` no repositório não equivale a consultar o diário operacional atual.

O modelo durável é **Evento Cognitivo**, não conversa inteira. Cada captura separa:

- Registro Cognitivo estruturado;
- Registro de Fonte/proveniência.

A evolução do pensamento não deve ser apagada silenciosamente; refinamentos e substituições devem preservar o histórico por relações ou novos eventos.

---

## 4. Estado de privacidade que precisa permanecer explícito

O repositório `leon337/cognitive-ledger` está atualmente público no GitHub. O roadmap do próprio Ledger registra que essa visibilidade pública foi temporária para desbloquear CI e determina:

```text
novo conteúdo privado
        ↓
Supabase privado
        ↓
NÃO exportar automaticamente ao Git público
```

Portanto, nenhum novo conteúdo pessoal real deve ser versionado automaticamente no repositório público, em fixtures, logs ou evidências abertas.

---

## 5. Boundary atual MCF ↔ Ledger

O MCF já possui adapter de leitura do Cognitive Ledger validado em laboratório/staging, com as operações:

- `ler_diario`;
- `buscar_eventos`;
- `recuperar_contexto`;
- `ler_fonte_bruta` permanece fora do allowlist padrão do MCF.

A capability `cognitive-ledger.memory.read` permanece separada dos futuros caminhos de escrita.

O write existente do provider **não está exposto como capability MCF de memória**. Essa é a lacuna funcional real desta missão.

---

## 6. Objetivo verificável

A nova release estável deve permitir que um Mestre autorizado:

1. recupere o estado atual do ecossistema por Registry + Capsules + SHAs + provenance + recovery;
2. reconheça uma intenção explícita de persistência;
3. use uma capability específica e governada para registrar memória no Cognitive Ledger;
4. preserve o texto original e a estrutura semântica do Evento Cognitivo;
5. obter confirmação do provider e leitura de volta;
6. produzir um Receipt auditável;
7. recuperar a mesma memória em outra sessão/chat;
8. distinguir memória histórica, estado atual e inferência;
9. falhar fechado quando write/read/provider/auth estiverem indisponíveis ou não autorizados.

---

## 7. Decisões de onboarding já aprovadas por LEANDRO

### 7.1 Provider live

**Supabase privado dedicado ao Cognitive Ledger.**

A decisão não implica que um projeto Supabase já esteja criado/ativo. O estado live deve ser verificado no gate de ambiente.

### 7.2 Política de captura

**Pedido explícito + sugestão inteligente.**

- Se LEANDRO disser “registre isso”, “guarde no meu diário” ou equivalente, o Mestre pode iniciar a gravação governada.
- Se o Mestre detectar algo potencialmente valioso, pode sugerir o registro.
- Nenhuma sugestão vira gravação sem confirmação.
- Não existe captura automática irrestrita.

### 7.3 Autoridade de escrita

**Mestre registra; Miriam governa memória e conhecimento.**

Outros agentes não recebem acesso genérico ao banco. A escrita ocorre por capability específica do MCF e dentro das autorizações aplicáveis.

### 7.4 Forma da memória

**Texto original + estrutura semântica.**

Preservar o conteúdo original relevante e também campos estruturados do Evento Cognitivo, fontes, relações e provenance.

### 7.5 Correção e invalidação

**Preservar histórico.**

Correções não sobrescrevem silenciosamente o passado. Um registro pode ser substituído, refinado, resolvido ou invalidado por novo estado/evento/relação conforme o modelo aprovado.

### 7.6 Confirmação ao usuário

**Confirmação curta + Receipt auditável.**

A resposta de uso normal deve ser breve, mas baseada em persistência real e leitura de volta. O Receipt preserva identificador, resultado e provenance suficiente.

### 7.7 Prova final

**Teste sintético primeiro + uma memória real explicitamente autorizada no final.**

Dados reais não entram no ciclo de desenvolvimento antes de os gates de segurança/privacidade/live passarem.

---

## 8. Decisões ainda abertas

O onboarding ainda precisa fechar, uma pergunta por vez:

1. como preservar/reconciliar os Eventos Cognitivos já existentes quando o novo provider live for materializado;
2. qual authN/authZ será usada no write MCF → Ledger e como ela se relaciona com o write administrativo já existente;
3. se o caminho administrativo histórico `POST /registros` será mantido, endurecido ou isolado do novo caminho MCF;
4. se haverá reconciliação/backup adicional Git sem expor memória privada;
5. semver final da nova release;
6. se a nova stable assume `latest` imediatamente após os gates.

Nenhuma decisão irreversível deve ser inferida antes das respostas e do design aprovado.

---

## 9. Classificação e seleção de agentes

Esta missão é preliminarmente **Classe C** por envolver memória persistente, dados pessoais potenciais, autenticação, provider live e publicação de release estável.

O MCF possui 29 agentes oficiais, mas o protocolo proíbe participação decorativa. O pool inteiro permanece disponível; `selected_agents` é definido por fase e somente agentes com entrega real são ativados.

### Fase 1 — onboarding e recuperação de contexto

Selecionados:

- **Mestre** — contrato, fluxo e orquestração;
- **Léo** — continuidade e gates internos;
- **Leonardo** — produto e critérios de aceite;
- **Miriam** — memória, provenance e reconciliação;
- **Júlia** — dados, autonomia e governança de IA;
- **Augusto** — mission trace obrigatório em Classe C;
- **Beatriz** — avaliação de comportamento de memória/agentes;
- **Carmem** — consistência documental;
- **Emily** — auditoria independente do gate.

### Fase 2 — arquitetura e segurança

Entram quando a Fase 1 fechar:

- **Sofia** — arquitetura e boundaries;
- **Manoel** — modelo de dados, integridade e migrações;
- **Daniela** — lineage/provenance e qualidade de dados;
- **Ricardo** — threat model, auth, secrets e privacidade técnica;
- **Bruno** — provider live, SRE, backup/restore;
- **Eduardo/Rafael** — integração backend/MCF;
- **Renato** — estratégia de testes e E2E.

### Release

- **Gabriel** — branches, PRs, tag/release e prova de publicação.

Outros agentes somente serão selecionados se surgir uma entrega real no respectivo domínio.

---

## 10. Método obrigatório da missão

O fluxo segue o Protocolo Operacional Unificado do MCF:

```text
CONTRATAR
→ RECUPERAR CONTEXTO
→ EXECUTAR
→ VERIFICAR
→ MEDIR PROGRESSO
→ CORRIGIR OU AVANÇAR
→ REPETIR
```

Fases Classe C devem produzir PRF. A execução deve ser cronológica e verificável, com handoffs reais, evidências, auditoria e decisão de Léo.

Nenhuma ferramenta ou ação deve ser simulada. Quando o estado for desconhecido, registrar `UNKNOWN`/`LIVE_REQUIRED` em vez de inferir.

---

## 11. Fases da missão

### Fase 0 — Roadmap e abertura

Estado: `CONCLUÍDA`, com correção de contexto incorporada.

Saída:

- roadmap em `main`;
- Mission Control aberto;
- objetivo terminal explícito;
- fontes de verdade identificadas.

### Fase 1 — Onboarding e contrato de produto

Estado: `EM ANDAMENTO`.

Saída necessária:

- decisões abertas resolvidas;
- comportamento registrar/sugerir/confirmar aprovado;
- política para registros existentes;
- critérios de aceite e fora de escopo;
- Gate 1 de LEANDRO.

### Fase 2 — Arquitetura, threat model e contrato

Saída necessária:

- arquitetura MCF → Ledger write;
- reutilização vs. isolamento do write administrativo existente;
- authN/authZ;
- capability e contrato;
- modelo de versionamento/invalidação;
- privacidade e redaction;
- idempotência;
- backup/restore/recovery;
- Gate 2 de arquitetura e segurança.

### Fase 3 — Implementação de integração write em lab

O foco é integrar/endurecer o write existente, não reimplementar o Ledger do zero.

Critérios:

- write específico, não SQL genérico;
- persistência transacional;
- leitura de volta;
- Receipt;
- auth tests;
- idempotência/colisão;
- regressão read-only;
- zero dados reais.

### Fase 4 — Adapter MCF + comportamento do Mestre

Critérios:

- `cognitive-ledger.memory.write` no Capability Registry;
- operação allowlisted;
- pedido explícito + sugestão confirmada;
- Miriam policy hooks/documentação;
- fail-closed;
- AppModule E2E.

### Fase 5 — Provider live privado

Critérios:

- Supabase privado autorizado;
- migrações e dados existentes reconciliados;
- segredos protegidos;
- health/readiness;
- backup/restore;
- logs sem conteúdo privado desnecessário;
- currentness verificada.

### Fase 6 — E2E live sintético

Critérios:

- Chat/sessão A grava marcador sintético;
- Receipt confirma;
- Chat/sessão B recupera;
- marcador pode ser invalidado conforme política;
- nenhuma dependência do histórico do Chat A.

### Fase 7 — Primeira memória real autorizada

Somente após gates anteriores.

Critérios:

- LEANDRO fornece/autoriza uma memória real;
- persistência e leitura de volta comprovadas;
- recuperação por outra sessão/Mestre;
- nenhum vazamento para Git/logs/evidências públicas.

### Fase 8 — Regressão cross-repo e TriView

Critérios:

- recovery 4/4;
- capabilities read/write qualificadas;
- TriView mostra estados sem revelar conteúdo privado por padrão;
- Capsules/Registry sincronizados.

### Fase 9 — Staging exact-SHA e auditoria final

Critérios:

- CI completa;
- staging exact-SHA;
- security/privacy review;
- PRF completo;
- Emily emite parecer;
- Léo decide gate.

### Fase 10 — Release estável

Critérios:

- versão semver validada;
- tag e release em SHA exato;
- release notes descrevem Context Fabric + memória persistente;
- nenhuma release anterior é reescrita.

### Fase 11 — Prova pós-release e closeout

Critérios:

- verificar release publicada live;
- verificar artefatos/tag/SHA;
- fresh recovery;
- confirmar que novos Mestres usam a metodologia oficial;
- fechar Mission Control somente com objetivo atendido.

---

## 12. Critério terminal

`ENTREGUE` exige simultaneamente:

- nova release estável publicada;
- write existente do Ledger integrado ao MCF por capability governada;
- provider live privado/autorizado;
- registros existentes preservados/reconciliados sem perda silenciosa;
- sintético A→B PASS;
- memória real autorizada A→B PASS;
- read regression PASS;
- recovery 4/4 PASS;
- staging exact-SHA PASS;
- PRF Classe C completo;
- auditoria final suficiente;
- decisão de Léo compatível;
- nenhuma pendência executável restante no escopo.

Até lá, a missão permanece aberta.
