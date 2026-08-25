# Canal programático MESTRE ↔ Ox via DeepSeek Harness (DSH)

Status: **CURRENT_IMPLEMENTED** (canal provado ponta a ponta em deployment real; ver [evidência E2E](evidence/MCF-HARNESS-MESTRE-OX-E2E-20260825.md)).
Classificação de informação: integração externa candidata a execution provider — **não é dependência do MCF**.
Mission ID de origem: `MCF-HARNESS-COMMS-DOC-001` (autoridade: LEANDRO, determinação transmitida pelo MESTRE).

> **Leitura obrigatória antes de operar:** este documento descreve um *execution provider/adapter candidato*.
> O MCF permanece agnóstico de provider: metodologia, autoridade (LEANDRO/LÉO/MESTRE), HUMAN_GATE,
> evidência e handoffs valem em qualquer superfície de execução. O DeepSeek Harness é uma das
> superfícies onde isso já foi demonstrado máquina-a-máquina.

---

## 1. Propósito

Oficializar, de modo reproduzível sem depender do histórico de nenhuma conversa:

1. como o MESTRE (operando no ChatGPT) abre, retoma e acompanha sessões do agente **Ox** executado
   pelo **DeepSeek Harness ("DSH")**;
2. quais garantias e limites esse canal tem (autoridade, gates, segurança);
3. como distinguir **normativo/invariante** de **deployment/evidência local**.

Público: futuros chats MESTRE (ou operadores autorizados) que precisem reproduzir o canal.

## 2. Arquitetura e responsabilidades

```text
┌────────────────────┐   canal humano/prog.   ┌──────────────────────────┐   execução real    ┌─────────────────┐
│ MESTRE (ChatGPT)   │ ─────────────────────► │ DeepSeek Harness (DSH)   │ ─────────────────► │ Modelo/Provider │
│ coordenação MCF    │   HTTP/SSE + túnel     │ execution provider       │   roteamento LLM   │ (ex.:           │
│ contrato + mapa    │ ◄───────────────────── │ sessões/ferramentas/     │ ◄───────────────── │  x-preview-f-   │
│ da missão          │   eventos turn/*       │ sandbox/evidência        │   chunks/tokens    │  free)          │
└────────────────────┘                        └──────────────────────────┘                    └─────────────────┘
        │                                            │
        ▼                                            ▼
  Metodologia MCF                              Workspace + logs de sessão
  (autoridades, gates, ESEV,                   (eventos persistidos por sessão;
  handoff, CAF, evidência)                      observabilidade audit-safe)
```

| Camada | Responsabilidade | Não é responsável por |
|---|---|---|
| **MCF** (metodologia + runtime próprio) | autoridades, contrato de missão, risco A/B/C, gates, ESEV, handoffs, CAF, evidência, auditabilidade | executar o agente cognitivo; rotear LLM; prover sandbox de arquivos |
| **DeepSeek Harness (DSH)** | criar/retomar sessões de agente; expor API HTTP + SSE; executar ferramentas (bash, fs, edit…); aplicar sandbox/approvals; persistir eventos; rotear para provider | definir autoridade de missão; decidir gates humanos; substituir a governança MCF |
| **Modelo/Provider** | gerar os turnos cognitivos do agente (ex.: `x-preview-f-free` via grupo `opencode-zen-direct`) | guardar estado de conversa (isso é da sessão no DSH); autorizar nada |

Precedência documental do MCF não muda neste canal: `project-instructions/MCF-HUMAN-DELEGATION-FIREWALL.md`
e o protocolo operacional vigente continuam mandando na conduta do agente. O preset `mcf` do DSH apenas
*carrega* essa metodologia como persona/skills do agente (ver §5.3).

Contexto de origem desta integração como opção de provider:
[`artifacts/phases/PHASE-02-MEMORY-ARCHITECTURE/AGENT-EXECUTION-PROVIDER-OPTIONS.md`](../../artifacts/phases/PHASE-02-MEMORY-ARCHITECTURE/AGENT-EXECUTION-PROVIDER-OPTIONS.md)
("harness as mission execution harness, not a production dependency").

## 3. Versão testada e fonte primária

| Item | Valor | Natureza |
|---|---|---|
| Harness | `@deepseek-ai/dsh` **0.1.1-rc.2** (+ pacotes `@deepseek-ai/dsh-*` mesma versão) | deployment |
| Licença/upstream | MIT — `github.com/deepseek-ai/deepseek-harness` | fato do produto |
| Fonte primária da API | pacote instalado `@deepseek-ai/dsh-host-apiproxy`, arquivos `lib/types/api/*.schema.js` e `lib/types/fetch/handler.js` | fonte primária |
| Comando do servidor | `dsh web --host 127.0.0.1 --port 3080 --no-open` | deployment |

> Em versões futuras do DSH, revalide este documento contra o código instalado antes de confiar
> cega nos contratos abaixo. Os schemas citados são a referência exata da versão testada.

## 4. Topologia de deployment (NORMATIVO = padrão; valores = DEPLOYMENT)

Topologia vigente provada em 2026-08-25 (**valores de deployment, não invariantes**):

```text
leo-N43SM (máquina local do MESTRE)
  └── ChatGPT/MESTRE monta requests HTTP e tunela SSH
        │  ssh -L <porta-local>:127.0.0.1:3080 <vps>
        ▼
VPS (hostname observado: vmi3506102)
  └── DSH Web API escutando SOMENTE em 127.0.0.1:3080   ← bind loopback, sem exposição pública
        └── sessão do agente Ox (preset mcf, cwd do clone do repo MCF)
              └── workspace: /opt/sentinelx-cloud-core/mcf-labs/multiagent-collaboration-framework
```

Regras invariantes desta topologia:

- **INV-1** — a API DSH nunca é exposta publicamente; bind em loopback e acesso somente via túnel SSH.
- **INV-2** — quem responde pela sessão é sempre um agente sob preset/protocolo acordado (`mcf`);
  nunca se negocia autoridade dentro do canal.
- **INV-3** — todo fato de host, porta, PID, caminho e session_id citado em documentos é
  `DEPLOYMENT` ou `EVIDENCE`; nenhum deles é invariante universal (ver §10).

Fallback documentado (autorizado pela determinação de origem): se componentes SentinelX da VPS caírem
mas o túnel SSH local continuar vivo, o MESTRE pode continuar operando pela API em
`localhost:3080` no `leo-N43SM` (instância local do mesmo DSH). Antes de usar o fallback,
reaplique as pré-checagens do runbook (§7.1), inclusive conferindo `agentPreset.list` na instância
local — presets são por instalação.

## 5. Contrato de wire (fonte primária: schemas da versão 0.1.1-rc.2)

### 5.1 Envelope RPC unário

Toda chamada é `POST /api/<method>` com `content-type: application/json`
(o servidor rejeita outro media type com **415** — cerca anti-CSRF; só JSON passa):

```jsonc
// request
{ "type": "client-request", "rpcId": "<id-opaco-ecoado>", "method": "<method>", "payload": { } }
// resposta de sucesso
{ "type": "server-response", "rpcId": "<mesmo-id>", "result": { "ok": true, "value": { } } }
// resposta de erro de negócio
{ "type": "server-response", "rpcId": "<mesmo-id>", "result": { "ok": false, "error": { "code": "...", "message": "...", "details": { } } } }
```

- O `rpcId` é um token opaco de eco para correlação; gere um por chamada.
- Erro de negócio é sempre **HTTP 200** + `ok:false`. HTTP expressa apenas a camada carrier:
  `404` path/método desconhecido · `415` media type ≠ JSON · `400` body não-JSON · `500` crash do handler.
- Códigos de erro relevantes para este canal (lista completa no schema `rpc.schema.js`):
  `session-not-found`, `session-conflict` (cwd divergente do existente), `agent-busy`,
  `model-unavailable` (provider/modelo indisponível), `invalid-time-zone`,
  `agent-preset-not-found` (com lista `available`), `agent-preset-conflict`,
  `agent-preset-locked`, `queue-item-not-found`, `steer-unavailable`.

Canais fora do envelope POST:

| Endpoint | Método | Função |
|---|---|---|
| `/api/events.mux` | GET SSE | frames por sessão: eventos, approvals, questions, fila |
| `/api/events.host` | GET SSE | frames globais do host: sessões adicionadas/removidas, `running`, erros |
| `/api/respond` | POST | entrega `client-response` (respostas de approval/question pendentes) |
| `/api/session.export?sessionId=...` | GET/HEAD | download do log da sessão (query param validado por schema) |

Frames SSE chegam como `data: <json>` contendo a forma cheia
`{"type":"server-request","rpcId":"...","method":"<frame-type>","payload":{...}}`;
na abertura o servidor emite o comentário `: connected` (mantém proxies vivos).

### 5.2 Métodos usados pelo canal (subconjunto operacional)

| Método | Payload essencial | Retorno essencial | Uso no canal |
|---|---|---|---|
| `session.list` | `{}` | `{items:[{sessionId, updatedAt, running, blank, cwd?, agentPreset?, parentSessionId?}]}` | descobrir sessões existentes e estado `running` |
| `session.create` | `{cwd}` **ou** `{workspaceId}`; opcional `sessionId`, `agentPreset` | `{sessionId, agentPreset?}` | abrir sessão nova **ou retomar a MESMA id** passando `sessionId` |
| `session.prompt` | `{sessionId, mode:"queue"\|"steer", content:[{type:"text",text}…]}` | `{accepted:true}` | enviar mensagem do MESTRE ao agente |
| `session.history` | `{sessionId, beforeSeq?, maxMessages?}` | `{events:[{event:{type,seq,time,data},view?}], hasMore, projections?}` | recuperar/paginar histórico (página para trás a partir da cauda) |
| `agentPreset.list` | `{}` | `{presets:[{id, trust:"system"\|"user", isDefault, name?, description?, broken?}]}` | confirmar disponibilidade do preset `mcf` |
| `agentPreset.select` | `{sessionId, agentPreset}` | `{agentPreset}` | fixar preset **antes do primeiro prompt** quando a sessão não nasceu com ele |
| `host.describe` / `skill.list` | `{}` | inventário do host / skills | pré-checagens opcionais |
| `session.cancel` | `{sessionId}` | `{accepted:true}` | cancelar turno em curso (**somente com autoridade para isso**) |
| `session.rename` | `{sessionId, title}` | `{title, seq}` | rotular sessão p/ auditoria |
| `goal.*` | p.ex. `goal.create` | objetivo persistido da sessão | opcional; missões longas |
| `subagent.*` | `list/history/prompt/interrupt` | subagentes de uma sessão-pai | NÃO VERIFICADO neste canal ainda |

Catálogo completo de rotas unárias da versão testada: `UNARY_ROUTES` em
`dsh-host-apiproxy/lib/types/fetch/handler.js`.

### 5.3 Preset: `mcf` explícito, nunca o default

Snapshot real de `agentPreset.list` (2026-08-25, instância VPS — **deployment/evidence**):

| id | trust | isDefault | papel |
|---|---|---|---|
| `standard` | system | false | agente completo padrão do produto |
| `code` | system | false | PTC/Code Mode SDK |
| `minimal` | system | false | bash + editor apenas |
| `cordis` | system | **true** | criação de presets (default atual do sistema) |
| `mcf` | user | false | persona MCF + skills `mcf-start-mission`/`mcf-operating-protocol` |

Regras normativas:

- **PRE-1** — o default do sistema é `cordis` e **não** serve para missões MCF. Toda sessão de missão
  nasce com `session.create { …, agentPreset: "mcf" }` ou recebe `agentPreset.select {sessionId,"mcf"}`
  **antes do primeiro prompt**.
- **PRE-2** — verificação barata: `session.list` retorna `agentPreset` por sessão; confira antes do
  primeiro prompt. Divergência depois do início de conversa pode retornar `agent-preset-locked`
  (momento exato do lock: NÃO VERIFICADO — trate "antes do primeiro prompt" como regra segura).
- **PRE-3** — presets vivem por instalação (`home/.agent-presets/<id>/`). Instância nova ⇒ repetir a
  conferência; `agent-preset-not-found` traz a lista `available`.

## 6. Ciclo de vida da sessão

### 6.1 Criar sessão nova dedicada

```bash
curl -s -X POST "$BASE/api/session.create" -H 'content-type: application/json' -d '{
  "type": "client-request", "rpcId": "m1", "method": "session.create",
  "payload": { "cwd": "/opt/sentinelx-cloud-core/mcf-labs/multiagent-collaboration-framework",
               "agentPreset": "mcf" }
}' | jq '.result'
# => { ok: true, value: { sessionId: "session-...", agentPreset: "mcf" } }
```

- Guarde o `sessionId` retornado; ele é o identificador de continuidade da missão naquele workspace.
- `cwd` deve ser único por sessão: recriar com mesmo `sessionId` e `cwd` diferente devolve
  `session-conflict` (detalhes trazem `requestedCwd`/`existingCwd`).
- Alternativa institucional: `workspaceId` de um workspace pré-registrado (`workspace.*`),
  mutuamente exclusivo com `cwd` no payload.

### 6.2 Manter e retomar a MESMA session_id

A continuidade verificável do MCF se apoia em **mesma session_id + log persistido**:

1. O chamador guarda o `sessionId` da missão (registro do MESTRE/checkpoint — lado MCF, não do DSH).
2. Para retomar: `session.list` e localizar a id; ou `session.create` **passando o mesmo
   `sessionId`** (o campo é aceito no payload justamente para religar a uma sessão existente).
3. Confirme identidade: `session.history {sessionId}` deve devolver os eventos anteriores
   (paginação com `beforeSeq`/`maxMessages`); `seq` é monotônico por sessão.
4. Sessões sobrevivem ao processo cliente por design (persistência no host); o histórico é a prova.

Anti-padrões: gerar id nova "por segurança" a cada contato quebra a continuidade auditável;
tratar ids antigas como configurção canônica também está errado — ids são **evidência**, o
*procedimento* (guardar/religar por id fornecida pelo create) é que é normativo.

### 6.3 Enviar prompt

```jsonc
POST /api/session.prompt
{ "type": "client-request", "rpcId": "m2", "method": "session.prompt",
  "payload": { "sessionId": "session-...", "mode": "queue",
               "content": [ { "type": "text", "text": "[MESTRE → OX | <MISSION-ID>] ..." } ] } }
// => result.value { accepted: true }  (opcionalmente value.command se virar slash-command)
```

- `mode:"queue"` enfileira; `mode:"steer"` injeta steering no turno corrente (se indisponível:
  `steer-unavailable`).
- Prompt enquanto turno ativo sem steerear entra na fila (frames `session/queue`).
- Imagens: `{type:"image", mediaType:"image/png"|"image/jpeg"|"image/webp"|"image/gif", data:<base64>}`.

### 6.4 Monitorar execução (SSE + regra terminal)

Conecte **uma vez** em `GET /api/events.mux` (por sessão relevante) e acompanhe os frames:

| Frame (`method` do envelope SSE) | Significado |
|---|---|
| `session/subscribed` | confirmação de inscrição; traz `lastSeq` (−1 = log vazio) |
| `session/event` → evento interno `turn/start` | novo turno do agente iniciou |
| `session/event` → `assistant/chunk` | streaming parcial da resposta |
| `session/event` → `assistant/message` | mensagem assistente completa do step |
| `session/event` → `tool/call` / `tool/result` | ferramenta chamada/resultado (com `view.card` calculado pelo host) |
| `session/event` → `step/start` / `step/end` | fronteiras de step dentro do turno |
| `session/event` → `llm/retry`, `llm/retry-started` | retentativas de provider em curso |
| `session/event` → `approval/asked` / `approval/decided` | ciclo de aprovação registrado no log |
| `session/event` → `turn/end` | **turno encerrou** |
| `approval/requested` / `approval/resolved` | pedido/resolução de permissão de ferramenta (fora do log) |
| `question/requested` / `question/resolved` | perguntas do tool `ask_user_question` |
| `session/jobs`, `session/queue`, `session/projection` | tarefas background, fila, projeções |
| `stream/error` | falha do stream (reconectar) |

No stream global `GET /api/events.host`: `host/session-status {running:true|false}`,
`host/session-added/removed`, `host/agent-error {message}`, mudanças de workspace.

Tipos internos válidos de `session/event` na versão testada estão enumerados em
`KNOWN_SESSION_EVENT_TYPES` (`@deepseek-ai/dsh-session/lib/index.js`).

**REGRA CRÍTICA (invariante operacional):**

> Timeout do observador/wrapper HTTP **não equivale a fim ou falha do agente**.
> Encerramento só se declara com estado terminal comprovado: `turn/end` recebido
> **e** `running=false` confirmado (`host/session-status` ou `session.list`),
> OU erro explícito tratado (CAF) — `stream/error` reconectável, `host/agent-error`
> classificável. Observador que estoura timeout deve reconectar/rechecar, nunca declarar morte.
> Nunca repita o mesmo prompt sem mudança objetiva (regra CAF do protocolo).

Reconexão: refaça o GET SSE (o servidor reenvia `session/subscribed` com `lastSeq`) e recupere o
que faltou via `session.history` paginando por `beforeSeq` até cobrir a lacuna.

### 6.5 HUMAN_GATE: approvals e questions

Quando o agente precisa de permissão ou decisão, o host emite frame pendente e **fica esperando**:

```jsonc
// approval/requested
{ "type":"approval/requested", "sessionId":"...", "approvalId":"...",
  "toolName":"bash", "callId":"...", "reason":"..." }
// resolução (somente se houver autoridade recebida):
POST /api/respond
{ "type":"client-response", "rpcId":"<rpcId-do-frame>",
  "result": { "ok": true,
              "value": { "sessionId":"...", "approvalId":"...",
                         "outcome":"allowed-once" /* ou */ "rejected" } } }
```

- `question/requested` (tool `ask_user_question`) segue o mesmo padrão via `/api/respond` com
  `value = { sessionId, answer: { answers: [ { id, selected: [...], custom? } ] } }`.
- **Normativo:** quem opera o canal (MESTRE ou substituto) **nunca aprova fora da autoridade
  recebida**. Sem autorização explícita da cadeia LEANDRO→MESTRE para aquele gate, a resposta
  correta é `rejected` (ou deixar pendente e escalar), registrando a decisão. Aprovar "para destravar"
  viola o Human Delegation Firewall.
- Pendências ficam visíveis nos frames; `approval/resolved` com outcome
  `allowed-once|rejected|cancelled|unavailable` fecha o ciclo.
- Classe C (externa/irreversível/sensível) continua exigindo gate humano **antes** — o canal não
  reduz classe de risco; apenas transporta a pergunta.

## 7. Runbook curto (futuros chats MESTRE)

### 7.1 Pré-checagens (todas obrigatórias)

```bash
BASE=http://127.0.0.1:3080   # no host do DSH; via túnel, use a porta local mapeada
# 1. túnel/API viva?
curl -fsS -m 10 -X POST "$BASE/api/agentPreset.list" -H 'content-type: application/json' \
  -d '{"type":"client-request","rpcId":"pre1","method":"agentPreset.list","payload":{}}' | jq '.result.ok'
# 2. preset mcf presente e íntegro? (campo broken ausente)
# 3. sessões existentes e estados running:
curl -fsS -m 10 -X POST "$BASE/api/session.list" -H 'content-type: application/json' \
  -d '{"type":"client-request","rpcId":"pre2","method":"session.list","payload":{}}' \
  | jq '[.result.value.items[] | {sessionId, running, agentPreset, cwd}]'
```

### 7.2 Criar/retomar → enviar → acompanhar → fechar

1. **Retomar missão existente:** ache a `sessionId` registrada no checkpoint MESTRE; valide via
   `session.history` (última página) que a sessão é a certa; se `running=false`, siga.
2. **Missão nova:** `session.create` com `cwd` do clone + `agentPreset:"mcf"` (§6.1); registre a id.
3. Envie a missão com `session.prompt` (§6.3), prefixo `[MESTRE → OX | <MISSION_ID>]`.
4. Abra o SSE `events.mux` **antes** do primeiro prompt da rodada; acompanhe `turn/*`, `tool/*`.
5. Termine somente por §6.4 (estado terminal comprovado). Colete resultado via `session.history`.
6. Feche o ciclo MCF: checkpoint/handoff do lado MESTRE com `sessionId`, faixa de `seq`,
   timestamps e artefatos produzidos; evidências datadas vão para
   `docs/integrations/evidence/` (quando houver merge autorizado) ou registro equivalente.
7. Não há "logout": encerrar = turno terminado + registros feitos. `session.rename` ajuda a
   rotular a sessão para auditoria humana posterior.

## 8. Segurança

- **Loopback only:** servidor iniciado com `--host 127.0.0.1`; verificação viva (`ss -tln`)
  mostrou escuta exclusiva em `127.0.0.1:3080`. Exposição pública da porta é violação de boundary.
- **Túnel SSH** como única via de acesso remoto; credenciais de túnel ficam no lado humano/local.
- A cerca anti-CSRF (só `application/json` em POST) é parte do modelo de ameaças do produto —
  não contornar.
- **Segredos:** o home do DSH guarda credenciais de provider (arquivo com permissão 600). É
  proibido ler, copiar, colar ou logar esses conteúdos em qualquer chat/artefato. Modelos e
  providers se consultam por `llm.providers`/`session.models`, que não expõem chaves.
- **Dados de sessão:** logs de eventos ficam no host (`home/sessions/<cwd-slug>/<id>/session.jsonl.zstd`).
  Ao citar evidência em documentos, traga ids/datas/estrutura, não transcrições sensíveis.
- **Audit-safe:** o canal inteiro é observável por eventos versionados por `seq` — prefira essa
  trilha a narrativas retrospectivas ao reportar execução.

## 9. Troubleshooting mínimo

| Sintoma | Diagnóstico | Ação |
|---|---|---|
| `connection refused` no `$BASE` | túnel morto ou serviço parado | testar `ss -tln` no host (127.0.0.1:3080); reabrir túnel; se VPS caiu, fallback §4 |
| HTTP 404 em `/api/<x>` | path/method errados ou versão diferente | conferir tabela §5.2 contra o handler da versão instalada |
| HTTP 415 | content-type ausente/errado | enviar `content-type: application/json` |
| `bad-request` com `issues` | payload fora do schema | validar campo a campo contra §5/schemas |
| `session-not-found` | id errada ou host/install trocado | `session.list`; conferir se está na instância certa |
| `session-conflict` | mesmo sessionId, `cwd` diferente | usar o `existingCwd` indicado ou id nova deliberada |
| `agent-busy` | turno em curso | usar `mode:"steer"` ou aguardar `turn/end`; não duplicar prompt |
| provider `503`/timeout/`model-unavailable` | provider/modelo indisponível | CAF: aguardar `llm/retry-*` ou escolher modelo via `session.selectModel`; não relançar prompt igual às cegas |
| `running=true` sem `turn/end` longo | turno vivo, stream morto ou trabalho longo | reconectar SSE; cruzar com `session.history` (novos `seq`?) e `session.list`; só `session.cancel` com autoridade |
| preset divergente (`cordis` selecionado) | sessão criada sem PRE-1 | antes do 1º prompt: `agentPreset.select "mcf"`; se `agent-preset-locked`, abrir sessão nova conforme §6.1 e registrar incidente |
| `session.search` retorna erro `internal` (index `openAt "never"`) | busca global desabilitada nesta install | usar `session.list` + `history`; não tratar como falha de rede |

## 10. Normativo vs evidência local

| Categoria | Conteúdo | Estabilidade |
|---|---|---|
| **NORMATIVO** (invariante enquanto esta integração valer) | responsabilidades por camada (§2); INV-1..3 (§4); envelope RPC e semântica carrier/business (§5.1); métodos do canal (§5.2); PRE-1..3 (§5.3); continuidade por session_id (§6.2); regra terminal (§6.4); conduta em gates (§6.5); postura de segurança (§8) | vale entre versões compatíveis; revalidar em upgrade maior do DSH |
| **DEPLOYMENT** (desta instalação) | hostname VPS, `leo-N43SM`, porta 3080, comando `dsh web --host … --port 3080 --no-open`, caminhos de home/workspace, lista de presets/providers, versão 0.1.1-rc.2 | muda por instalação/atualização |
| **EVIDENCE** (observação datada) | session_ids reais, seqs, timestamps de 2026-08-25, snapshots de `agentPreset.list`/`session.models` | nunca reaproveitar como configuração; ver [evidence file](evidence/MCF-HARNESS-MESTRE-OX-E2E-20260825.md) |

Regra de ouro aplicada: **ferramenta instalada ≠ conectada ≠ aprovada ≠ autorizada**. Toda
declaração de sucesso exige evidência verificável (logs por `seq`, receipts, artefatos).

## 11. Limites conhecidos e NÃO VERIFICADO

- Testado **somente** no DSH `0.1.1-rc.2`, single-host, um agente por sessão. Upgrades do DSH
  podem alterar wire/schema — revalidar contra o código instalado (fonte primária, §3).
- `session.search` desabilitado nesta instalação (índice `openAt "never"`) — descoberta de sessão
  é por `session.list`/histórico.
- Momento exato do lock de preset após o primeiro prompt: **NÃO VERIFICADO** (regra conservadora
  no PRE-2).
- `subagent.*`, `goal.*`, `workspace.*` existem na API e são plausíveis para o canal, mas o fluxo
  MESTRE↔Ox provado até 2026-08-25 não os exercita — marcar qualquer uso novo como experimento.
- Fallback local (`localhost:3080` no leo-N43SM) é procedimento autorizado; execução completa de
  missão nesse modo ainda sem evidência registrada — registrar evidência no primeiro uso real.
- Latência/limites de throughput do túnel SSH não quantificados.

## 12. Referências cruzadas

- Opções de execution provider e boundary "harness ≠ dependência":
  [`artifacts/phases/PHASE-02-MEMORY-ARCHITECTURE/AGENT-EXECUTION-PROVIDER-OPTIONS.md`](../../artifacts/phases/PHASE-02-MEMORY-ARCHITECTURE/AGENT-EXECUTION-PROVIDER-OPTIONS.md)
- Firewall de delegação humana (base normativa dos gates):
  [`project-instructions/MCF-HUMAN-DELEGATION-FIREWALL.md`](../../project-instructions/MCF-HUMAN-DELEGATION-FIREWALL.md)
- Protocolo operacional vigente:
  [`docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`](../protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md)
- Runtime/API própria do MCF (distinta desta integração):
  [`docs/runtime/MCF-RUNTIME-API.md`](../runtime/MCF-RUNTIME-API.md)
- Evidência E2E datada deste canal:
  [`docs/integrations/evidence/MCF-HARNESS-MESTRE-OX-E2E-20260825.md`](evidence/MCF-HARNESS-MESTRE-OX-E2E-20260825.md)