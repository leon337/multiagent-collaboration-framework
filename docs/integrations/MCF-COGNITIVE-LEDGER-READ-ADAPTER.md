# MCF → Cognitive Ledger — read-only adapter de laboratório

**Estado desta revisão:** `IMPLEMENTED_AWAITING_REAL_LAB_E2E`

**Provider fixo:** `leon337/cognitive-ledger@b882d2808af74858a6ba351fb755bb3843e33ab2`

## Decisão arquitetural

O adapter pertence ao boundary de Context do MCF e expõe uma única consulta:

```http
POST /v1/mcf/context/ledger/query
x-mcf-context-token: <MCF_CONTEXT_READ_TOKEN>
Content-Type: application/json
```

`POST` transporta uma pergunta estruturada; não representa autorização de
escrita. O controller chama somente quatro tools MCP que declaram contrato
read-only. Ele não importa nem recebe `ExternalActionLedger`, repositório ou
serviço de banco do MCF. A memória retornada existe apenas na pilha da requisição,
leva `Cache-Control: no-store, private` e a resposta declara
`persisted_by_mcf: false`.

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
- `recuperar_contexto`;
- `ler_fonte_bruta`.

Os quatro inputs reproduzem os limites do contrato Ledger: até 12 eventos, texto
ou objetivo com até 4096 caracteres, 32 filtros de até 256 caracteres e fonte
bruta com justificativa de até 1024 caracteres. Objetos e campos desconhecidos
são negados.

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
128 itens. Rankings e conflitos também são limitados. A fonte permite apenas os
sete campos publicados pelo contrato. Um objeto arbitrário, um campo injetado ou
uma resposta profunda/dimensionada além desses limites não é repassado.

## Configuração e isolamento de segredos

O adapter fica desabilitado por padrão. Todos os valores abaixo são necessários:

```dotenv
MCF_CONTEXT_READ_TOKEN=<segredo de entrada com 32+ caracteres>
MCF_COGNITIVE_LEDGER_MCP_URL=http://127.0.0.1:33100/mcp
MCF_COGNITIVE_LEDGER_BEARER_TOKEN=<JWT OAuth do Ledger, diferente do token de entrada>
```

O Bearer upstream é um segredo separado e a configuração é recusada se os dois
tokens forem iguais. A URL não aceita userinfo, query, fragment ou path diferente
de `/mcp`. Fora de `development`/`test`, somente HTTPS é permitido. Em laboratório,
HTTP aceita exclusivamente IP loopback literal (`127.0.0.1` ou `[::1]`), nunca
`localhost` ou hostname resolvido.

Limites opcionais e seus intervalos fechados:

- `MCF_COGNITIVE_LEDGER_TIMEOUT_MS`: `250..15000`, padrão `5000`;
- `MCF_COGNITIVE_LEDGER_INPUT_LIMIT_BYTES`: `1024..32768`, padrão `32768`;
- `MCF_COGNITIVE_LEDGER_RESPONSE_LIMIT_BYTES`: `4096..1048576`, padrão `262144`.

O fetch usado pelo SDK MCP oficial `1.30.0` aceita somente `POST` para a URL exata,
nega redirects, limita a requisição serializada, interrompe streams de resposta
acima do teto e aborta no timeout. Erros externos são convertidos em uma mensagem
genérica; Bearer, entrada e fragmentos de memória nunca são incluídos no erro
público.

## Cadeia e laboratório descartável

O único caminho de dados permitido é:

```text
cliente de laboratório
  → MCF Context read-query
  → MCP Streamable HTTP stateless
  → Cognitive Ledger Edge Function / OAuth Auth
  → PostgREST
  → PostgreSQL 17 + pgvector
```

O MCF não recebe URL de Postgres, service role, senha Basic ou chave de IA. O
laboratório exige o provider limpo no commit fixo, cria somente usuário/JWT/dados
sintéticos e remove o projeto Supabase temporário ao terminar:

```bash
pnpm build:packages
pnpm --filter @rsa/server build
MCF_COGNITIVE_LEDGER_LAB_CONFIRM=1 \
COGNITIVE_LEDGER_REPOSITORY_ROOT=/caminho/para/cognitive-ledger-zero-cost-lab \
pnpm --filter @rsa/server test:ledger:real:lab
```

O gate só passa quando observa quatro respostas pelo controller MCF, quatro
auditorias Ledger, três Eventos antes/depois, zero embeddings, zero chamadas pagas
e fingerprint idêntico de `eventos_cognitivos`. A auditoria de leitura é o único
efeito esperado.
