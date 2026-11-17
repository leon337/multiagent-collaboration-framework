# Decisões e limites de segurança

- O mesmo Pet/MESTRE Agent permanece a identidade cognitiva; sem segundo agente.
- Contratos conversation, read_only e read_and_propose separados por ticket HMAC.
- A criação de proposta só é declarada no modelo em read_and_propose.
- Texto do modelo é um artefato não confiável, nunca script executável.
- SQLite local privado, estado inicial pending_review e versão otimista.
- Proposta exige objetivo, resumo, etapas, riscos, reversão e prioridade.
- Referências instrumentais vêm exclusivamente dos receipts observados na sessão.
- O status reviewed_for_planning não autoriza operação, não substitui LÉO
  e não é um HUMAN_GATE.
- Rotas /api/pet-voice/proposals/list e /review exigem cookie, CSRF e Origin.
- UI usa textContent, não innerHTML, para conteúdo produzido pelo modelo.
- Propostas não entram automaticamente no MissionRuntime canônico.
- Nenhuma automação de shell, serviço, deploy ou browser foi habilitada.
- Escopo dependente de PR #533, sem merge automático na main.
