# MCF Agent Bridge Adapter — observacional

**Classificação:** `EXPERIMENTAL` enquanto não houver integração autorizada ao
`MissionRuntime → ExternalActionDispatcher → EvidenceValidator` canônico.
**Fonte de verdade:** [Protocolo Dual Browser Runtime Discovery](../../docs/protocols/MCF-PROTOCOLO-DUAL-BROWSER-RUNTIME-DISCOVERY.md).

Este é um adaptador local de leitura do `mcf-dual-browser-agent-bridge`,
com CLI e um servidor MCP stdio mínimo (sem dependências externas).
Ele **não** é uma nova fonte de governança e **não** autoriza automaticamente
navegação, cliques, envio de mensagens, digitação, captura ou outras mutações.

## Pré-requisitos

- Linux com Python 3.10+ e MCF Dual Browser Cockpit em execução.
- Bridge ligada numa instância concreta, por exemplo `notebook-team2`.
- Descriptor mantido pelo Cockpit:
  `~/.config/mcf-dual-browser-cockpit/instances/<instance>/agent-bridge.json`
  com owner local e modo `0600`.
- O token **nunca** é passado em argumentos, arquivos versionados, logs ou stdout.

## Verificação direta

```bash
python3 tools/agent-bridge-adapter/bridge_adapter.py --instance notebook-team2 doctor
python3 tools/agent-bridge-adapter/bridge_adapter.py --instance notebook-team2 read agents
python3 tools/agent-bridge-adapter/bridge_adapter.py --instance notebook-team2 read state
python3 -m unittest discover -s tools/agent-bridge-adapter -p 'test_*.py'
```

A interface CLI exige `--instance` ou `MCF_BRIDGE_INSTANCE`, jamais seleciona
um Cockpit por inferência. Toda consulta reconcilia `GET /v1/discovery`
com o identificador da instância, schema, e `falseGreenAllowed=false`.
Sem descriptor, token válido ou discovery confiável, **falha fechado**.

## MCP stdio local (integração com clientes MCP locais)

```bash
python3 tools/agent-bridge-adapter/bridge_adapter.py --instance notebook-team2 mcp
```

Suporta `initialize`, `tools/list`, `tools/call` e `ping`,
via JSON-RPC newline-delimited em stdio. Tools:
`bridge_discovery`, `bridge_state`, `bridge_agents`,
`bridge_missions`, `bridge_sessions`, `bridge_snapshot`,
`bridge_text`, `bridge_interactive`.

Todos os tools são de leitura. Conectar um cliente MCP depende da configuração
desse cliente e **não ocorre automaticamente** ao instalar este script.
O adaptador é invocável pelo MESTRE no notebook via uma conexão remota autorizada
(como Desktop Commander), sem tornar a porta `47831` pública.

## Auditoria e proteção de segredos

Cada leitura produz um receipt mínimo em
`~/.local/state/mcf-agent-bridge/receipts.jsonl` (`0600`).
O receipt contém apenas instância, operação, sucesso/erro e timestamp,
sem página, URL, prompt, título ou token.
O diretório é protegido com `0700`.
O token é recuperado do descriptor a cada requisição, inclusive após rotação
do token pelo Cockpit.

*Não confundir estes receipts observacionais com os receipts canônicos
do MCF: não há inscrição automática no ledger nem certificado de conclusão
da missão.*

## Limites

- Somente `127.0.0.1`, sem proxy nem exposição por Tailscale, host externo ou túnel.
- `GET` allowlist: discovery/state/agents/missions/sessions/snapshot/text/interactive.
- No máximo 2 MB por resposta, timeout 4s, erro sem revelar resposta bruta.
- Postagens e ações que mudem estado exigem integração futura ao
  Human Delegation Firewall e validação pós-ação com evidências semânticas.
- A integração com clientes ChatGPT remotos exige transporte autenticado específico,
  fora do escopo deste adaptador local.

## MVP de navegação governada (MCF-AUTONOMOUS-BROWSER-RESEARCH)

A evolução `governed_browser.py` usa o mesmo descriptor local de instância e funciona **sob demanda**. Não fornece autonomia geral por LLM: o plano é uma sequência **determinística** de rótulos semânticos de links; a execução das etapas é automática e limitada ao escopo expresso. O processo grava checkpoints antes de cada navegação e verifica URL, título, texto e digest após cada etapa.

Exemplo de entrada pela `stdin` (sem token, sem credenciais):

```bash
cat <<'JSON' | ~/.local/bin/mcf-browser-mission
{"missionId":"mcf-example-public-001","instanceId":"notebook-team2","objective":"Examinar documentacao publica do MCF","startUrl":"https://github.com/leon337/multiagent-collaboration-framework","allowedHosts":["github.com"],"waypoints":["docs","MCF-CURRENT-STATE.md"],"maxSteps":4,"authorizedScope":true,"restoreWorkspace":true}
JSON
```

As rotas de destino devem ser HTTPS, sem parâmetros, credenciais, fragmentos ou caminhos sensíveis, e pertencer a `allowedHosts`. A seleção de links exige texto exato e **um único destino distinto**: duplicatas de rótulo apontando para o mesmo link são permitidas; dois destinos diferentes bloqueiam a missão. Os recursos de contas, pagamentos, publicação, formulários e ações destrutivas ficam fora do contrato.

A saída traz `status=COMPLETED`, `verified=true` **somente** se todas as etapas foram observadas e o Workspace original foi restaurado. Os demais resultados são `RECOVERING` / `BLOCKED`. Caso haja queda no meio da navegação, a retomada apenas reconcilia o estado com a última observação verificada; não reenvia cegamente ações de resultado desconhecido. Locks impedem missões paralelas na mesma instância e os limites máximos são oito etapas. Checkpoints locais: `~/.local/state/mcf-agent-bridge/missions/` (diretório `0700`, journals `0600`), sem conteúdo bruto da página nem bearer.

### Integração canônica com o runtime

O adaptador `GovernedBrowserExternalAdapter` é registrado em `McfRuntimeModule`/`AdapterRegistry`. A rota governada é **exclusivamente** `MCF-AUTONOMOUS-BROWSER-RESEARCH` / provider `mcf-agent-bridge` / operação `inspect-governed-browser` / recurso `local-workspace`. A fase passa por `PermissionEngine`, `SkillExecutor`, `ExternalActionDispatcher`, reserva do ledger, `recordExecuting`, persistência de metadados de reconciliação PREPARED, execução real, recibo HMAC do `EvidenceValidator` e posterior verificação da evidência e atualização de ledger.

Em ambientes locais habilitados, configurar:

```text
NODE_ENV=development
MCF_AGENT_BRIDGE_GOVERNED_ENABLED=true
MCF_AGENT_BRIDGE_MISSION_SCRIPT=/home/leo/.local/share/mcf-agent-bridge/governed_browser.py
MCF_AGENT_BRIDGE_TIMEOUT_MS=90000
```

**Produção continua impedida** pela validação de configuração e por uma verificação redundante no adapter. A opção permanece `false` por padrão; não altere essa restrição sem revisão de segurança. A configuração não transfere autorização do HUMAN_GATE; o adapter rejeita autocertificação de HUMAN_GATE e decisões sensíveis.

Verificação de regressão Python:

```bash
python3 -m unittest discover -s tools/agent-bridge-adapter -p 'test_*.py' -v
```

Teste real opt-in do runtime + navegador, sem exigência de DB real (ledger de teste simulado):

```bash
MCF_AGENT_BRIDGE_REAL_E2E=1 \
MCF_AGENT_BRIDGE_MISSION_SCRIPT="$HOME/.local/share/mcf-agent-bridge/governed_browser.py" \
node ../../node_modules/vitest/vitest.mjs run \
  src/mcf-runtime/governed-browser.real-e2e.test.ts
```

Executar a partir de `apps/rede-social-agentes/apps/server` com dependências de build e variáveis de teste adequadas. O teste verifica navegação **real**, mas usa **ledger em memória**, não demonstra persistência PostgreSQL de missão. A integração completa do `MissionRuntime` em um deploy contínuo, aprovação de UI e ensaios com DB real são fronteiras futuras.

### Limitações de segurança relevantes

- Navegações são feitas pelo WebContents via URL e podem seguir redirecionamentos de terceiros **antes da verificação final**. O postcondition impede falso sucesso, mas não substitui um bloqueador de rede/redirect no momento da requisição. Para domínios de maior risco, exigir bloqueio na camada `webRequest`/egress antes de ampliar a capacidade.
- O planejador é de links de texto exato, não um agente LLM que inventa ações ou caminhos; essa limitação é deliberada nesta versão.
- A classificação de público não inspeciona automaticamente cada byte da página, embora o receipt guarde somente digest e metadados. Não usar em páginas autenticadas ou privadas.
- O `ExternalActionDispatcher` prepara reconciliação durable quando conectado ao ledger real; o E2E atual verifica o fluxo com ledger simulado. Nenhum merge, publicação ou deploy de produção é realizado por este pacote.
