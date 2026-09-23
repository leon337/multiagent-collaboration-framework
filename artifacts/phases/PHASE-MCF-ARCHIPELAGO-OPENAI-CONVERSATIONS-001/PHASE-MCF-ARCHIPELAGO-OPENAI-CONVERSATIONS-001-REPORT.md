# REPORT — MCF Archipelago OpenAI Conversations 001

## Resultado

Implementada uma camada de persistência OpenAI Conversations sobre o Chat Store do Archipelago.

- `createOpenAIConversation()` cria `conv_*` e associa metadados do chat.
- `metadata.openai.conversationId` guarda o vínculo remoto.
- `streamOpenAIResponse()` aceita `conversationId`.
- Turnos persistentes enviam somente a mensagem humana mais recente.
- Chats antigos podem criar a Conversation de forma preguiçosa e semear o histórico local uma vez.
- `lastResponseId` e `lastUsedAt` ficam registrados no chat.
- A Conversation da API permanece distinta da sessão web ChatGPT/Dual Browser.

## Evidência

- Draft PR: #319.
- Branch: `feat/archipelago-openai-conversations-20260922`.
- CI inicial: run `35806255838`, conclusão `success`.
- Testes observados: 27 executados, 27 aprovados, 0 falhas.

## Limitação material

O roteamento browser-first preexistente não foi removido nesta fase. O contrato `conv_*` é efetivo no caminho OpenAI Responses API. A sessão web do ChatGPT continua sendo provider separado.

## Estado

`AGUARDANDO_HUMAN_GATE` para integração/merge. Nenhum merge foi executado.
