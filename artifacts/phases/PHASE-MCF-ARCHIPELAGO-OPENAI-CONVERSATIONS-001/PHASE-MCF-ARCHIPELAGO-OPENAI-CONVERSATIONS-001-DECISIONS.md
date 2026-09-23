# DECISIONS — OpenAI Conversations 001

1. **Separar IDs.** `chat_id`, `metadata.openai.conversationId` (`conv_*`) e `metadata.chatgpt.conversationId` não são equivalentes.
2. **Backend owns the mapping.** O frontend usa `chat_id`; chave e `conv_*` permanecem no backend.
3. **Lazy migration.** Chats existentes sem Conversation criam uma no primeiro uso do provider OpenAI e semeiam o histórico local uma vez.
4. **Incremental turns.** Após o seed, somente a mensagem humana mais recente é enviada; a Conversation mantém o estado remoto.
5. **No destructive remote cleanup by default.** Excluir chat local não apaga implicitamente a Conversation remota nesta fase.
6. **Stacked PR.** A integração fica no PR #319, empilhado sobre #315, preservando o boundary do MVP visual.
7. **No merge without LEANDRO gate.** A fase encerra em draft/revisão.
