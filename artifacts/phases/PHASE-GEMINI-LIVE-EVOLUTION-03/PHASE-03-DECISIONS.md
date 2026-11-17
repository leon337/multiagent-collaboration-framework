# Decisões de arquitetura F3

1. LEANDRO autorizou conceder MCP Playwright e ferramentas ao agente. Implementar inicialmente em branch F3 isolada e staging local, sem alterar a produção nem fingir fechamento das fases anteriores.
2. Integrar o servidor real oficial @playwright/mcp via MCP SDK e stdio; não chamar Puppeteer de MCP e não executar comandos livres gerados pelo modelo.
3. Expor só sete funções, ler snapshots automaticamente dentro da origem aprovada e exigir autorização por ação para navegação/clique/digitação/fechamento.
4. Escopo escrito apenas no TodoMVC, egress restrito por lista de origens; proibir reutilização de perfis Brave e cookies autenticados nesta fase.
5. A aprovação local não equivale ao HUMAN_GATE/HDF nativo MCF. Produção depende de PermissionEngine, identidade, isolamento de rede, receipts duráveis, idempotência e revisão independente.
6. Revisão LÉO e passos de F3 restantes são gates separados; nenhum merge ou deploy público automático.
