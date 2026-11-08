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
