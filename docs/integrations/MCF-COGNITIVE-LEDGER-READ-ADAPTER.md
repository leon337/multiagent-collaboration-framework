# MCF → Cognitive Ledger — read-only adapter de laboratório

**Estado desta revisão:** `REAL_READONLY_LAB_E2E_PASS`

**Provider fixo:** `leon337/cognitive-ledger@b882d2808af74858a6ba351fb755bb3843e33ab2`

## Decisão arquitetural

O adapter pertence ao boundary de Context do MCF e expõe uma única consulta:

```http
POST /v1/mcf/context/ledger/query
x-mcf-ledger-read-token: <MCF_COGNITIVE_LEDGER_INGRESS_TOKEN>
Content-Type: application/json

HTTP/1.1 200 OK
```

`POST` transporta uma pergunta estruturada; não representa autorização de
escrita. O controller permite somente três consultas MCP. Antes de chamá-las, o
adapter exige que o provider continue publicando o inventário exato de quatro
tools read-only; `ler_fonte_bruta` integra esse inventário, mas é proibida na
fronteira MCF. O controller não importa nem recebe `ExternalActionLedger`,
repositório ou serviço de banco do MCF. A memória retornada existe apenas na
pilha da requisição, leva `Cache-Control: no-store, private` e a resposta declara
`memory_payload_persisted_by_mcf: false`.

Essa API mínima foi escolhida em vez de registrar a leitura como External Action:
persistir o payload ou um Receipt nesse ledger duplicaria memória potencialmente
privada e converteria uma consulta efêmera em estado durável desnecessário.

## Envelope estrito

```json
{
  "operation": "buscar_eventos",
  "input": {
    "texto": "busca textual gratuita",
    "limite": 2
  }
}
```

`operation` aceita exclusivamente:

- `ler_diario`;
- `buscar_eventos`;
- `recuperar_contexto`.

`ler_fonte_bruta` é recusada com `400` antes de criar qualquer cliente ou conexão
MCP. Os três inputs permitidos reproduzem os limites do contrato Ledger: até 12
eventos, texto ou objetivo com até 4096 caracteres e 32 filtros de até 256
caracteres. Objetos e campos desconhecidos são negados.

Antes de cada chamada, o adapter lista o inventário do provider. A conexão falha
fechada se houver tool ausente ou extra, ou se qualquer uma não declarar
simultaneamente:

```json
{
  "readOnlyHint": true,
  "destructiveHint": false,
  "idempotentHint": true,
  "openWorldHint": false
}
```

O `structuredContent` também é validado por operação. Objetos top-level e eventos
são estritos; eventos têm profundidade fixa, até 12 itens e arrays textuais de até
128 itens. Rankings e conflitos também são limitados. Um objeto arbitrário, um
campo injetado ou uma resposta profunda/dimensionada além desses limites não é
repassado.

## Configuração e isolamento de segredos

O adapter fica desabilitado por padrão. Todos os valores abaixo são necessários:

```dotenv
MCF_COGNITIVE_LEDGER_INGRESS_TOKEN=<segredo exclusivo de entrada com 32..4096 caracteres>
MCF_COGNITIVE_LEDGER_MCP_URL=http://127.0.0.1:33100/mcp
MCF_COGNITIVE_LEDGER_BEARER_TOKEN=<JWT OAuth do Ledger, diferente do token de entrada>
```

O header de entrada é exclusivamente `x-mcf-ledger-read-token`; a chave
`MCF_CONTEXT_READ_TOKEN` do TriView não abre essa rota. Ledger ingress, Bearer,
Context/TriView e `MCF_CLOUD_CONTEXT_INGRESS_TOKEN`, quando presente, devem ser
distintos entre si. O Bearer aceita somente o shape `b64token` do RFC 6750, além
dos limites `32..8192`, sem vírgulas, espaços, dois-pontos ou Unicode. A URL não
aceita userinfo, query, fragment ou path diferente de `/mcp`. Fora de
`development`/`test`, somente HTTPS é permitido. Em laboratório, HTTP aceita
exclusivamente IP loopback literal (`127.0.0.1` ou `[::1]`), nunca `localhost` ou
hostname resolvido.

Limites opcionais e seus intervalos fechados:

- `MCF_COGNITIVE_LEDGER_TIMEOUT_MS`: `250..15000`, padrão `5000`;
- `MCF_COGNITIVE_LEDGER_INPUT_LIMIT_BYTES`: `1024..32768`, padrão `32768`;
- `MCF_COGNITIVE_LEDGER_RESPONSE_LIMIT_BYTES`: `4096..1048576`, padrão `262144`;
- `MCF_COGNITIVE_LEDGER_MAX_CONCURRENT_QUERIES`: `1..16`, padrão `4`.

O fetch usado pelo SDK MCP oficial `1.30.0` aceita somente `POST` para a URL exata,
nega redirects e `BodyInit` não-string, limita a requisição serializada e
interrompe streams de resposta acima do teto. Um deadline agregado cobre conexão,
inventário e chamada, aborta o transporte e limita também o fechamento do cliente.
O bulkhead falha fechado antes de `clientFactory` quando todos os slots estão
ocupados e libera o slot em `finally`. Erros externos são convertidos em uma
mensagem genérica; Bearer, entrada e fragmentos de memória nunca são incluídos no
erro público.

## Cadeia e laboratório descartável

O único caminho de dados permitido é:

```text
cliente de laboratório
  → AppModule MCF real / Context read-query
  → MCP Streamable HTTP stateless
  → Cognitive Ledger Edge Function / OAuth Auth
  → PostgREST
  → PostgreSQL 17 + pgvector
```

O MCF não recebe URL do Postgres do Ledger, service role, senha Basic ou chave de
IA. O laboratório exige o provider e o MCF limpos, cria HOME/XDG isolados,
recompila packages/server do HEAD, usa somente segredos sintéticos, cria um banco
MCF de nome único no PostgreSQL local compartilhado e aplica as migrations reais.
Não executa `docker stop/remove` no container compartilhado. Ao final, encerra
somente os recursos que criou e apaga somente o banco único:

```bash
MCF_COGNITIVE_LEDGER_LAB_CONFIRM=1 \
MCF_COGNITIVE_LEDGER_MCF_DB_CONFIRM=1 \
MCF_COGNITIVE_LEDGER_MCF_DB_ADMIN_URL=postgresql://usuario:senha@127.0.0.1:5432/postgres \
COGNITIVE_LEDGER_REPOSITORY_ROOT=/caminho/para/cognitive-ledger-zero-cost-lab \
pnpm --filter @rsa/server test:ledger:real:lab
```

O gate prova que token ausente, token TriView e header Ledger duplicado retornam
`401` sem request MCP. `ler_fonte_bruta` retorna `400`, também antes do MCP. Depois
observa três respostas `200`, três auditorias Ledger do cliente
`mcf-lab-readonly`, zero fonte bruta, três Eventos antes/depois, zero embeddings,
zero chamadas pagas e fingerprint idêntico de `eventos_cognitivos`.

No banco MCF, o harness compara contagem e fingerprint de todas as tabelas de
dados, incluindo missões, fases, handoffs, events, tool receipts e External Action
Ledger. Todas permanecem invariáveis. A única mutação autorizada são sete
incrementos, protegidos por HMAC, na policy `mcf-ledger-read-query` de
`abuse_rate_limits`; token, consulta, payload e resposta não aparecem no banco.

## Evidência executada

O gate foi executado no adapter MCF
`43ba4063ab6f061329a37f2dcc227dd49a082357`, contra o provider fixo
`b882d2808af74858a6ba351fb755bb3843e33ab2`, em
`2026-08-24T01:26:54.000Z`:

```text
resultado                    PASS
inventário provider          4/4 read-only
operações MCF                3/3
fonte bruta                  proibida antes do MCP
Eventos antes/depois         3/3
auditorias antes/depois      0/3
embeddings                   0
chamadas pagas               0
fingerprint antes/depois     05fb390d4177e7816e4d3f362bffc661 (idêntico)
persistência memória MCF     false
única mutação MCF            abuse_rate_limits / HMAC / 7
banco MCF único removido     true
PostgreSQL compartilhado     preservado
repositórios imutáveis       true
processos/portas encerrados  true
```

O fingerprint muda entre laboratórios porque as fixtures contêm timestamps de
criação, mas é calculado imediatamente antes e depois das três consultas dentro
da mesma execução; o valor acima permaneceu idêntico no par observado. O harness
também confirmou os mesmos commits e worktrees limpos no início/fim, encerrou
AppModule MCF, proxy, MCP, Edge e Supabase, removeu o banco MCF único, confirmou o
PostgreSQL compartilhado disponível e verificou fechadas as portas `33110`,
`33101`, `33100`, `54331` e `54332` antes de emitir `PASS`. Como o laboratório foi
desmontado, a capability é registrada como `DISCONNECTED`, `INACTIVE` e
`HISTORICALLY_VERIFIED`, não como conexão ativa atual.
