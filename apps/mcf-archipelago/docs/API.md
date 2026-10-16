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
   |---- MCF bridge (evolução)
   '---- outros providers (evolução)
```

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

`GET /api/v1/chats/:id`

Retorna metadados e histórico.

`PATCH /api/v1/chats/:id`

Atualiza título/projeto/metadados.

`DELETE /api/v1/chats/:id`

Exclui o chat persistido.

### Mensagens

`GET /api/v1/chats/:id/messages`

Lê o histórico canônico.

`POST /api/v1/chats/:id/messages`

Persiste uma mensagem humana.

```json
{ "text": "Explique o runtime do MCF" }
```

### Resposta de IA

`POST /api/v1/chats/:id/responses`

Gera resposta usando o histórico armazenado pela própria API. A resposta usa SSE:

- `meta`
- `delta`
- `done`
- `error`

A mensagem final do assistente é persistida no Chat Store antes do evento `done`.

## Persistência

MVP local:

`.archipelago-data/chats.json`

O arquivo é ignorado pelo Git e escrito de forma atômica. A API foi desenhada para permitir substituição futura por PostgreSQL sem mudar o contrato público.

## OpenAI

OpenAI é apenas o primeiro adapter. A chave permanece no backend local em `.env.local`. Chamadas à Responses API usam `store:false`.

## Compatibilidade

As rotas antigas `/api/chat` e `/api/provider/*` permanecem temporariamente durante a migração da V1.3 para V1.4.
