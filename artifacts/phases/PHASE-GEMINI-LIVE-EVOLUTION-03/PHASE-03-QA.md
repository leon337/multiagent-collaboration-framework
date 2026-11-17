# QA F3 — MCP Playwright real

- Dependências fixas: @playwright/mcp 0.0.85 e @modelcontextprotocol/sdk 1.32.2 (npm lock).
- Descobertas 25 tools no handshake MCP. Expostas 7 funções restritas ao Gemini Live.
- 18/18 testes Node: argumentos, domínios privados e desconhecidos, one-time gate, TTL, read, redirecionamento, escopo, recibos e sanitização.
- 2/2 testes HTTP reais com MCP e Chrome: navegação example.com, snapshot, find, tabs, desconexão e rejeições HTTP.
- 1/1 teste MCP real no TodoMVC público: digitar e clicar com aprovação de teste simulada, nenhum login, nenhum dado de usuário.
- 9/9 testes Chrome simulando chamadas Gemini: função declarada, modal humano, autorizar/recusar, toolResponse vinculado ao ID, evento e limpeza.
- E2E real Gemini 2.5 Flash Live: o modelo escolheu playwright_navigate, pediu aprovação ao frontend, recebeu retorno do MCP e respondeu corretamente Example Domain. Não chamou snapshot nesse caso; não declarar teste de cadeia autônoma multi-tool.
- 111/111 testes Node acumulados F0/F1/F2/F3, nenhum fail.
- npm audit omit dev com audit-level high: zero vulnerabilidades reportadas naquele instante.
- Evidence JSON e hashes SHA-256 neste PRF. Sem chave de API, cookies, transcrição pessoal, arquivos de mídia ou snapshots sensíveis armazenados no repo.
- F2 source manifest é histórico do SHA F2 base; o F3 modifica apps e workflow. F3 source manifest valida novo estado, e F2 artifact manifest é preservado.
- Pendente: auditoria independente F3 e gate LÉO normativo, HDF, rede em sandbox, política para novos domínios, revisão de autenticação, gates F0/F1/F2.


## Correção pós-auditoria e retestes
O Codex CLI externo original devolveu RETURN_FOR_CORRECTION (dois HIGH e seis MEDIUM).
Os dois HIGH de cancelamento foram reproduzidos em testes de corrida e corrigidos com
epoch e encerramento do cliente ainda em inicialização, mais mcpEpoch no lado Gemini.
TTL abandonado, escopo real TodoMVC, refs de snapshot e preflight do elemento foram
corrigidos. O teste de UI agora é 9/9, com cancelamento de lote. O teste REAL de
Gemini 2.5 Flash Live executou duas ferramentas: playwright_navigate e
playwright_snapshot. Os receipts SUCCESS com URL e título foram correlacionados
ao toolResponse, sem depender de palavras aleatórias da fala do modelo.
Os domínios de navegação de leitura foram ampliados de seis para doze,
incluindo Google AI Studio, Wikipedia e YouTube; não há compartilhamento de cookies do Brave.
A aprovação local continua não sendo HDF nativa e o egress não é sandbox de rede.
