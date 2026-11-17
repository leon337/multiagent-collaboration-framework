# MCF → Remotion — adaptador local experimental

- Transporte: MCP Streamable HTTP `http://127.0.0.1:4777/mcp` autenticado
- Política: allowlist de ferramentas; leitura conectada; escrita bloqueada até callback verificável do HDF/PermissionEngine canônico
- Escopo: laboratório local, sem roteamento remoto, sem merge/deploy de produção
- Evidências: recibos de saída SHA-256; smoke validando produção real e negação de escrita sem gate
- Segurança: o token fica fora do repositório, com permissões 0600

Teste: `npm install && npm test && npm run smoke`.

A integração final ao `ExternalActionDispatcher` do runtime central e o cadastro de skill executável dependem de gate canônico, autenticação do MCF e revisão independente.
