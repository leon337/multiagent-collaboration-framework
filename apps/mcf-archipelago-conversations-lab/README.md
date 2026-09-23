# MCF Archipelago · OpenAI Conversations Lab

Laboratório isolado para validar o fluxo de chats persistentes do Archipelago usando OpenAI Conversations (`conv_*`) e Responses API.

## Objetivo

Testar, sem alterar o Archipelago principal:

```text
Novo Chat
   ↓
Archipelago Lab
   ↓
POST /v1/conversations
   ↓
conv_...
   ↓
Responses API com conversation=conv_...
```

Cada chat local mantém seu próprio `chat_id`. O vínculo remoto é salvo em `metadata.openai.conversationId`.

## Isolamento

Este laboratório usa:

- diretório próprio: `apps/mcf-archipelago-conversations-lab/`;
- branch própria: `lab/archipelago-conversations-isolated-20260922`;
- porta padrão própria: `4273`;
- arquivo de configuração próprio: `.env.lab.local`;
- armazenamento local próprio: `.archipelago-data/` dentro deste diretório;
- Dual Browser desativado por construção;
- dispatch para o runtime MCF desativado;
- CI próprio.

Variáveis `MCF_DUAL_BROWSER_BRIDGE_FILE`, `MCF_BASE_URL` e `MCF_SESSION_COOKIE` não habilitam essas integrações neste laboratório.

## Provider permitido

A única integração externa de chat prevista neste laboratório é OpenAI API.

A chave é configurada localmente pelo backend e nunca é persistida no frontend.

## Executar

```bash
cd apps/mcf-archipelago-conversations-lab
npm run ci
npm run serve
```

Abrir:

```text
http://127.0.0.1:4273
```

## Critério principal do experimento

Um teste é considerado válido quando:

1. um novo chat recebe um `conversation_id` iniciado por `conv_`;
2. esse ID fica associado ao mesmo `chat_id` após reiniciar o backend;
3. o segundo turno reutiliza o mesmo `conv_*`;
4. o segundo turno envia apenas a nova mensagem humana;
5. nenhum request é encaminhado para Dual Browser ou MCF dispatch;
6. o Archipelago original permanece sem alterações de dados ou configuração.

## Limites

- excluir um chat local não apaga automaticamente a Conversation remota da OpenAI;
- este laboratório não representa produção;
- não deve ser mergeado no Archipelago principal até o experimento ser revisado por LEANDRO.
