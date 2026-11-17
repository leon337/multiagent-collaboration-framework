# MCF → Remotion — adaptador local experimental

- Transporte: MCP Streamable HTTP `http://127.0.0.1:4777/mcp` autenticado
- Política: allowlist de ferramentas; leitura conectada; escrita bloqueada até callback verificável do HDF/PermissionEngine canônico
- Escopo: laboratório local, sem roteamento remoto, sem merge/deploy de produção
- Evidências: recibos de saída SHA-256; smoke validando produção real e negação de escrita sem gate
- Segurança: o token fica fora do repositório, com permissões 0600

Teste: `npm install && npm test && npm run smoke`.

A integração final ao `ExternalActionDispatcher` do runtime central e o cadastro de skill executável dependem de gate canônico, autenticação do MCF e revisão independente.

## Discovery para novas sessões do MESTRE

Na máquina autorizada, usar npm ci e npm run discover. Esse comando apenas lê health e provedores de voz: não gera áudio, não altera projeto, não imprime segredos e não concede escrita no MCF. Um resultado LOCAL_READ_VERIFIED não é prova de autorização para ações com efeitos.

O ponto de entrada universal é AGENTS.md do MCF, que encaminha à skill skills/video/mcf-remotion-produce/SKILL.md e ao guia docs/operations/MCF-REMOTION-CAPABILITY-DISCOVERY.md. Repositórios privados exigem permissão GitHub.

Para a reconciliação não destrutiva de origens privadas, SHAs e alterações locais dos três repositórios, executar npm run reconcile. O comando usa git ls-remote e não faz fetch/checkout/reset.
