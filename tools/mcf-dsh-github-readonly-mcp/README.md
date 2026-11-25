# MCF — GitHub MCP de leitura para DSH

Servidor MCP (stdio, Python 3, sem dependências externas) com cinco ferramentas tipadas para consultar somente o repositório público leon337/multiagent-collaboration-framework.

## Segurança e governança

- Sem token GitHub; não usa credenciais do humano.
- Apenas GET na API pública; repositório fixo e allowlist de ferramentas.
- Sem ferramentas de escrita, merge, PR, GitHub Actions ou execução remota.
- Limites de payload e de caminhos; sujeito ao rate limit da API pública.
- Não equivale a autenticação privada nem habilita escrita.
- Escritas futuras devem passar por Permission Engine / HDF, autorização e receipts do MCF.

## Instalação

1. Copiar server.py para diretório persistente legível pelo usuário Linux da instância DSH.
2. No arquivo $DSH_HOME/profiles/web/cordis.patch.yml adicionar patch do tipo insert (e não id-targeted):

    - insert:
      - id: mcf_github
        name: '@deepseek-ai/dsh-mcp-client'
        config:
          serverName: mcf_github
          transport: stdio
          command: python3
          args: ["/CAMINHO/PERSISTENTE/server.py"]
          env: {}
          failOnStartupError: false

3. Reiniciar serviço de maneira governada. Manter backups fora do diretório profiles/web: backups root-only nesse diretório causaram EACCES no watcher DSH.
4. Verificar a ferramenta mcp__mcf_github__github_main_head e comparar SHA com fonte GitHub independente.

## Testes

Executar: python3 -m unittest -v test_server.py

## Paralelismo

MESTRE usa o GitHub conectado com sua autoridade para escritas governadas; DSH e subagentes podem ler código, Issues e PRs públicos via MCP. Decisões/handoffs devem registrar ID, intenção, escopo, autoridade e evidências.
