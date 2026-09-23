# PLAN — MCF Archipelago OpenAI Conversations 001

```yaml
mission_id: MCF-ARCHIPELAGO-OPENAI-CONVERSATIONS-001
phase_id: PHASE-MCF-ARCHIPELAGO-OPENAI-CONVERSATIONS-001
objective: criar chats persistentes próprios, com um conversation_id OpenAI por chat local
expected_outcome: chat_id local mapeado para conv_* e reutilizado pela Responses API
risk_class: B
source_of_truth:
  - OpenAI Conversations API
  - OpenAI Responses API
  - leon337/multiagent-collaboration-framework
base: feat/mcf-archipelago-v1-20260922@389ee0436ab495b3329ca500deb7d919944eef0d
branch: feat/archipelago-openai-conversations-20260922
acceptance_criteria:
  - criação de Conversation via POST /v1/conversations
  - persistência de conv_* no metadata do chat
  - Responses usa conversation=conv_*
  - turno persistente não reenvia histórico completo
  - migração de chat legado semeia histórico uma única vez
  - CI do Archipelago verde
out_of_scope:
  - merge em produção
  - exclusão automática da Conversation remota
  - equivaler Conversation API à conversa web do ChatGPT
```
