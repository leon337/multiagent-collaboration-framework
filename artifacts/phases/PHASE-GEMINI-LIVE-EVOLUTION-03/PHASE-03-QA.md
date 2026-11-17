# QA F3 — MCP Playwright real

- Dependências fixas: @playwright/mcp 0.0.85 e @modelcontextprotocol/sdk 1.32.2 (npm lock).
- Descobertas 25 tools no handshake MCP. Expostas 7 funções restritas ao Gemini Live.
- 13/13 testes Node: argumentos, domínios privados e desconhecidos, one-time gate, TTL, read, redirecionamento, escopo, recibos e sanitização.
- 2/2 testes HTTP reais com MCP e Chrome: navegação example.com, snapshot, find, tabs, desconexão e rejeições HTTP.
- 1/1 teste MCP real no TodoMVC público: digitar e clicar com aprovação de teste simulada, nenhum login, nenhum dado de usuário.
- 8/8 testes Chrome simulando chamadas Gemini: função declarada, modal humano, autorizar/recusar, toolResponse vinculado ao ID, evento e limpeza.
- E2E real Gemini 2.5 Flash Live: o modelo escolheu playwright_navigate, pediu aprovação ao frontend, recebeu retorno do MCP e respondeu corretamente Example Domain. Não chamou snapshot nesse caso; não declarar teste de cadeia autônoma multi-tool.
- 106/106 testes Node acumulados F0/F1/F2/F3, nenhum fail.
- npm audit omit dev com audit-level high: zero vulnerabilidades reportadas naquele instante.
- Evidence JSON e hashes SHA-256 neste PRF. Sem chave de API, cookies, transcrição pessoal, arquivos de mídia ou snapshots sensíveis armazenados no repo.
- F2 source manifest é histórico do SHA F2 base; o F3 modifica apps e workflow. F3 source manifest valida novo estado, e F2 artifact manifest é preservado.
- Pendente: auditoria independente F3 e gate LÉO normativo, HDF, rede em sandbox, política para novos domínios, revisão de autenticação, gates F0/F1/F2.

## Requalificacao da navegacao e voz
25/25 policy Node, 7/7 browser voz simulada, 9/9 agent browser, 2/2 real MCP site publico e recusas, 118/118 offline geral. Microfone fisico do usuario nao testado. Ver PHASE-03-VOICE-NAVIGATION.md e evidencias JSON.

Browser UI evidence updated after changes: 9/9 cases in current source SHA, including model-side cancellation and one-time approval. Historical Gemini real E2E remains tied to its original source SHA; user microphone ASR is not physically tested.
