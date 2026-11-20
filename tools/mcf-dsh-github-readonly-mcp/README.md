# MCF — GitHub MCP de leitura para DSH

Servidor MCP (stdio, Python 3, sem dependências externas) com cinco ferramentas de leitura do GitHub público e uma ferramenta para registrar propostas locais (nenhum write remoto). O executor GitHub App é um módulo separado e NÃO é registrado como ferramenta do DSH.

## Segurança e governança

- Sem token GitHub; não usa credenciais do humano.
- Apenas GET na API pública; repositório fixo e allowlist de ferramentas.
- A ferramenta github_submit_proposal apenas grava um envelope local não autorizado, incluindo digest SHA-256; não cria branch ou PR.
- Nenhuma ferramenta do modelo realiza escrita no GitHub, merge, GitHub Actions ou deploy.
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

Executar: python3 -m unittest -v test_server.py test_governed.py

## Paralelismo

MESTRE usa o GitHub conectado com sua autoridade para escritas governadas; DSH e subagentes podem ler código, Issues e PRs públicos via MCP. Decisões/handoffs devem registrar ID, intenção, escopo, autoridade e evidências.

## Evolução: gateway de escrita governada (ainda desabilitado)

- DSH/subagentes chamam github_submit_proposal. Campos: mission_id, phase_id, agent_id, branch no namespace agent/dsh3085/, base_sha exato, title, body e files com path/content. O spool é local, 0600; não há write remoto.
- O módulo app_executor.py não é exposto via MCP nem deve ser executado como usuário sentinelx. Ele só pode ser conectado à execução autenticada do MissionRuntime (PermissionEngine, HDF, ExternalActionDispatcher e ledger), com callback de autorização independente do input do agente.
- Para execução real, provisionar uma **GitHub App dedicada** com acesso somente ao repo MCF e permissões Contents:write, Pull requests:write, Metadata:read. Instalar somente no repositório alvo.
- O executor exige MCF_GITHUB_APP_ID, MCF_GITHUB_INSTALLATION_ID e MCF_GITHUB_APP_PRIVATE_KEY_FILE, sob um usuário de serviço distinto de sentinelx. O arquivo de chave deve estar em pasta externa ao workspace DSH, com permissão 0600. Nenhuma chave deve ser armazenada neste repositório ou em prompt.
- O token de instalação é efêmero e solicitado com escopo reduzido ao repo MCF; o executor exige prova do escopo retornado. Ele rejeita qualquer execução sem autorização canônica, replay, mudança de SHA da main ou tentativa de gravar arquivo já existente.
- As gravações suportadas pela primeira versão são somente criação de branch agent/dsh3085/*, novos arquivos tools/ ou docs/ e abertura de PR draft. Não inclui alteração de arquivos existentes, merge, push para main nem deploy.
- Em erro após mutação potencial, ledger local fica EFFECT_UNKNOWN; é proibido retry cego, exigindo reconciliação. E2E externo de escrita ficará bloqueado até GitHub App + integração autenticada ao MissionRuntime.

## Limites atuais

- Integração GitHub App / PermissionEngine e produção **NÃO CONCLUÍDAS**.
- Para leitura a API pública dispensa autenticação; para escrita não usar token pessoal de LEANDRO.
- Avaliação de segurança independente e E2E autenticado de escrita ainda necessários.
