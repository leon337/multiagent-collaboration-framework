# MCF Archipelago API v1

API própria do Archipelago para chats persistentes e providers desacoplados.

## Princípio

O frontend não fala diretamente com a OpenAI. Cada ilha de chat usa o próprio `chat_id` e conversa apenas com a API do Archipelago.

```text
Ilha / UI
   |
   v
Archipelago API v1
   |---- Chat Store local
   |---- OpenAI provider adapter
   |       '---- Conversation persistente (`conv_*`)
   |---- MCF bridge
   '---- outros providers (evolução)
```

O `chat_id` é o identificador interno estável do Archipelago. O `conversation_id` da OpenAI é um detalhe de backend e fica persistido em `chat.metadata.openai.conversationId`.

## Endpoints

### Saúde e providers

`GET /api/v1/health`

Retorna versão da API e providers disponíveis, sem segredos.

### Chats

`GET /api/v1/chats`

Lista chats.

`POST /api/v1/chats`

Cria ou registra idempotentemente um chat. O `id` pode ser o próprio ID da ilha.

Exemplo:

```json
{
  "id": "chat-abc",
  "islandId": "chat-abc",
  "title": "Arquitetura do Runtime",
  "projectId": "mcf",
  "legacyMessages": []
}
```

Quando o provider OpenAI está configurado e o chat ainda não possui vínculo, o backend executa `POST /v1/conversations`, recebe um ID `conv_*` e grava o mapeamento no metadata do chat.

```text
chat-abc
   |
   '---- metadata.openai.conversationId = conv_...
```

`GET /api/v1/chats/:id`

Retorna metadados e histórico.

`PATCH /api/v1/chats/:id`

Atualiza título/projeto/metadados.

`DELETE /api/v1/chats/:id`

Exclui o chat persistido localmente. O MVP não remove automaticamente a Conversation remota da OpenAI; essa ação remota permanece fora do contrato de exclusão local para evitar destruição implícita de histórico.

### Mensagens

`GET /api/v1/chats/:id/messages`

Lê o histórico canônico local.

`POST /api/v1/chats/:id/messages`

Persiste uma mensagem humana.

```json
{ "text": "Explique o runtime do MCF" }
```

### Resposta de IA

`POST /api/v1/chats/:id/responses`

Gera resposta usando o provider disponível. A resposta usa SSE:

- `meta`
- `delta`
- `done`
- `error`

A mensagem final do assistente é persistida no Chat Store antes do evento `done`.

No caminho OpenAI, o backend resolve o `conversation_id` do chat e envia a nova chamada à Responses API com:

```json
{
  "conversation": "conv_...",
  "input": [
    { "role": "user", "content": "mensagem nova" }
  ]
}
```

Assim, depois da criação do vínculo, o cliente não precisa reenviar o histórico completo em cada turno.

## Persistência

MVP local:

`.archipelago-data/chats.json`

O arquivo é ignorado pelo Git e escrito de forma atômica. A API foi desenhada para permitir substituição futura por PostgreSQL sem mudar o contrato público.

Existem duas camadas de persistência:

1. **Archipelago Chat Store** — título, projeto, mensagens locais, status e mapeamentos de providers.
2. **OpenAI Conversation** — estado conversacional remoto identificado por `conv_*` quando o provider OpenAI está ativo.

## OpenAI Conversations

### Criação

Um chat novo com OpenAI configurada ganha uma Conversation própria. O frontend continua conhecendo apenas o `chat_id`; a credencial e o `conversation_id` ficam no backend.

### Turnos seguintes

Depois que o vínculo existe, o adapter envia somente a mensagem humana mais recente junto de `conversation=conv_*`. Inputs e outputs associados à Response passam a fazer parte da Conversation remota.

### Migração de chats existentes

Se um chat local antigo ainda não possui `conversation_id`, a migração é preguiçosa:

1. cria uma Conversation;
2. envia o histórico local disponível como seed no primeiro turno;
3. grava `conv_*` no chat;
4. nos turnos posteriores envia somente a nova mensagem.

Isso evita perder o contexto local existente e também evita reenviar o histórico inteiro indefinidamente.

### Metadados armazenados

Exemplo:

```json
{
  "metadata": {
    "openai": {
      "conversationId": "conv_...",
      "createdAt": "2026-09-22T00:00:00.000Z",
      "lastResponseId": "resp_...",
      "lastUsedAt": "2026-09-22T00:01:00.000Z",
      "state": "READY"
    }
  }
}
```

## ChatGPT via Dual Browser

A integração com a sessão web do ChatGPT continua separada da Conversation da OpenAI API. `chatgptConversationId`/URL da superfície web e `metadata.openai.conversationId` não são tratados como o mesmo identificador.

Enquanto o Dual Browser estiver configurado, o roteamento existente pode usá-lo como provider de resposta. A persistência `conv_*` descrita acima pertence especificamente ao caminho OpenAI Responses API.

## Compatibilidade

As rotas antigas `/api/chat` e `/api/provider/*` permanecem temporariamente durante a migração da V1.3 para V1.4.