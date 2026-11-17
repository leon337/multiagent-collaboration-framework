# F3 — Playwright MCP Bridge para Gemini Live Studio

Missão MCF-GEMINI-LIVE-EVOLUTION-20261116-001. Desenvolvimento local do gateway de ferramentas, não substitui o runtime canônico MCF.

Fluxo real: Gemini Live model toolCall -> public/app.js -> public/playwright-tools.js -> POST /api/browser/prepare -> política de ferramenta e escopo -> diálogo de aprovação se ação modificadora -> POST /api/browser/decision -> Node MCP SDK (stdio) -> servidor oficial @playwright/mcp -> Chrome headless isolado -> resposta e recibo -> toolResponse/functionResponses original para Gemini Live.

Ferramentas permitidas:
- playwright_navigate: browser_navigate, destino HTTPS público da allowlist, confirmação individual.
- playwright_snapshot: browser_snapshot, leitura após navegação aprovada.
- playwright_find: browser_find, busca de texto no snapshot.
- playwright_tabs: browser_tabs somente action=list, sem manipulação.
- playwright_click: browser_click, unicamente TodoMVC, confirmação individual.
- playwright_type: browser_type, unicamente TodoMVC, sem campo de senha, confirmação individual.
- playwright_close: browser_close, confirmação e descarte da sessão.

Descobertas 25 ferramentas originais, sete aliases expostos. Negado: browser_evaluate, browser_run_code_unsafe, file_upload, inspeção irrestrita de rede, CDP externo e perfis autenticados.
A política é local com token de sessão efêmero e requestId de uso único, expiração de 45s, não reenvia operações desconhecidas após erro e limita texto retornado ao modelo a 6500 caracteres. Conteúdo da web é rotulado como não confiável. Recibos são metadados em memória, sem valores digitados.

MCP inicia sob demanda via processo stdio do SDK oficial com Chrome headless e perfil isolado; arquivos temporários permanecem em diretório /tmp modo 0700 e são eliminados ao encerrar. Browser não compartilha Brave, cookies de outros perfis ou chave Gemini. Lista curta de sites públicos de laboratório e documentação, expansão exige gate.

Instalação: executar npm ci em apps/gemini-live-studio, iniciar PORT=18375 node server.js em loopback, abrir http://127.0.0.1:18375, selecionar Laboratório e habilitar Ferramentas locais + MCP Playwright antes de conectar. O frontend exige aprovações por ação e mostra receipts.

## Navegacao e voz sob consentimento
Navegacao aceita dominios HTTPS publicos sob aprovacao unica. A API Web Speech reconhece autorizacao em PT-BR independentemente do Gemini, com codigo de quatro digitos e TTS do navegador. Os sites e as falas nunca concedem autoridade ao modelo. Escrita fora do TodoMVC continua bloqueada.

## Isolation while voice approval is active
Camera/screen capture and model playback are stopped before generating the UI challenge. Pending mic setup is invalidated by micGeneration and the voice gate guards startMic. Mic can resume only in the same Live generation; visual capture does not auto-resume.
