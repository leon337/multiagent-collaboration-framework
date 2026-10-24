# MCF Web Panel Gateway — registro e interoperabilidade

**Registro de projeto:** `context/projects/mcf-web-panel-gateway.yaml`
**Contrato de capacidade:** `context/capabilities/mcf-web-panel-discovery-read.yaml`
**Repositório de código (privado):** `leon337/mcf-web-panel-gateway`
**Autoridade final:** LEANDRO · **orquestrador:** MESTRE

## Intenção canônica

Capacidade MCF para descobrir, inspecionar e — somente com gate humano específico e adaptador qualificado — dialogar com superfícies de IA da web por meio do MCF Dual Browser Cockpit. O gateway consolida o Cockpit Electron e o Parallel Chat em um monorepo sem quebrar o histórico dos dois repositórios originários.

**Gatilho para chats sucessores:**

> MESTRE, RECUPERAR MCF WEB PANEL GATEWAY.

Ao receber esse gatilho, o MESTRE deve ler o registro canônico, o projeto `.mcf/project-capsule.yaml` e `docs/SUCCESSOR-CHAT-BOOTSTRAP.md` no repositório consolidado, consultar o runtime live/discovery e checar contas, máquinas, perfis, mecanismos e limites antes de operar. Não há direito implícito de acesso a uma máquina ou conta.

## Maturidade de provedor

| Provedor | Operação | Estado |
|---|---|---|
| Gemini | discover/inspect + envio autorizado local | IMPLEMENTADO / E2E local validado |
| Claude | descoberta genérica com domínio em catálogo | DECLARADO / SEM E2E de envio |
| Kimi | descoberta genérica com domínio em catálogo | DECLARADO / SEM E2E de envio |
| DeepSeek Chat | descoberta genérica com domínio em catálogo | DECLARADO / SEM E2E de envio |
| DeepSeek Harness | contrato de executor governado **separado** | não é interface Web; consultar `context/executors/deepseek-harness-agent-teams.yaml` |

O novo registro de capacidade é **READ_ONLY e NOT_AUTHORIZED** para dispatch do runtime MCF até integração e promoção próprias. O fato de o Gemini ter sido testado localmente não significa que o runtime MCF já tenha executor nativo conectado.

## Autoridade, segurança e evidência

O envio de mensagens web continua exigindo instrução humana explícita para o conteúdo e o destino, `--approve-send` no CLI de laboratório e gates do Human Delegation Firewall. Não revelar tokens, sessões, cookies, credenciais, informações de outras conversas ou CDP em rede pública. Nunca confundir `MCF-LOCAL-RULES` com MESTRE/GPT-6.

Cada operação deve distinguir `actor_id`, `provider_id`, `trace_id`, `turn_id`, `target_id`, `status`, `receipt/evidence` e `verified postcondition`, sem alegar assinatura criptográfica ainda inexistente.

## Regras de promoção

1. Adicionar adapter específico com host allowlist, fixture DOM, seleção de conta/target e cenário de falha.
2. Provar autenticação e envio+resposta em E2E com consentimento e controle de duplicidade.
3. Integrar o executor ao registry e Human Delegation Firewall do MCF.
4. Atualizar capacidade `NOT_AUTHORIZED`/disconnected somente mediante nova evidência e decisão humana/operacional aplicável.
5. Não promover release, serviço público, produção, API paga ou acesso VPS por merge documental.

## Fontes

- `leon337/mcf-web-panel-gateway@c5e2c165da61783f9c59ec2ebc935d4df57b03fd`
- `docs/protocols/MCF-PROTOCOLO-DUAL-BROWSER-RUNTIME-DISCOVERY.md`
- `docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md`
- `docs/runtime/MCF-DEEPSEEK-HARNESS-AGENT-TEAMS-EXECUTOR.md`
