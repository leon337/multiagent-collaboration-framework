# MCF-GOVERNED-BROWSER-001 — execução semântica governada

**Estado:** EXPERIMENTAL (MVP local, não produção)
**Origem:** missão de LEANDRO de conectar navegação do Cockpit ao runtime do MCF.
**Autoridade:** LEANDRO (HUMAN_GATE), MESTRE (orquestrador).
**Fonte:** `docs/protocols/MCF-PROTOCOLO-DUAL-BROWSER-RUNTIME-DISCOVERY.md` e `skills/desktop/MCF-OPERATE-DUAL-BROWSER.yaml`.

## Contrato arquitetural

```text
Entrada explícita (missão, instância, hosts, rótulos, limite)
    ↓
McfMissionRuntime / SkillExecutor
    ↓
PermissionEngine: READ_AND_PROPOSE + proibições canônicas
    ↓
ExternalActionDispatcher: reserva do ledger → EXECUTING → PREPARED
    ↓
GovernedBrowserExternalAdapter (habilitado somente no notebook local)
    ↓
Python planner determinístico → descriptor local 0600 → discovery
    ↓
Verificação de mutationAllowed → URL HTTPS allowlist → navegação via Agent Bridge
    ↓
Observação: /v1/state + /v1/text + /v1/interactive (link semântico único)
    ↓
Checkpoint atômico → próximos passos limitados → restauração do Workspace
    ↓
Receipt HMAC → EvidenceValidator → ledger VALID / INVALID
```

**Não substitui** o protocolo de descoberta, skill registry, PermissionEngine, Human Delegation Firewall ou o próprio MissionRuntime.

## Limites e anti-falso-verde

O plano é fornecido como `waypoints` de rótulos semânticos de links e autoexecutado após validação. O executor só aceita links a um **único URL distinto** dentro da allowlist e navega por GET no Workspace. Não há automação de formulários, envio ao ChatGPT, credenciais, compra, postagem, coordernadas, JavaScript arbitrário nem proxy público. Ocorrências de recuperação obrigatória no Cockpit, target ambíguo, timeout ou erro encerram em `RECOVERING` sem alegar sucesso.

Os checkpoints são gravados antes de cada ação e são reconciliáveis por inspeção, nunca por repetição cega de uma navegação em trânsito. A conclusão exige URL final exata, conteúdo observável não vazio, digest por etapa, digest da timeline e restauração da URL que existia antes da missão. A CLI guarda recibos locais sanitizados; no runtime, o EvidenceValidator assina e verifica o receipt, sem conteúdo bruto.

## Evidências de qualificação local (08/11/2026)

- Teste Python de regras, locks e checkpoints (15 cenários PASS).
- Navegação real `mcf-browser-autonomy-e2e-20261108` no notebook `leo-N43SM`:
  `github.com/leon337/multiagent-collaboration-framework` → `tree/main/docs` → `blob/main/docs/MCF-CURRENT-STATE.md`, resultado `COMPLETED/verified/restored`; houve diagnóstico e recuperação de ambiguidade antes da conclusão.
- Teste `governed-browser.real-e2e.test.ts`: navegador real via SkillExecutor/Dispatcher/EvidenceValidator, ledger in-memory, PASS.
- Typecheck TypeScript da aplicação server, PASS depois de reconstrução local de `@rsa/contracts` e `@rsa/database`.

## Gates futuros

1. Testar persistência real de missão, fase, PREPARED, receipt HMAC e estado de ledger em PostgreSQL isolado.
2. Acrescentar controle de rede **pré-redirect** (host allowlist de requisições, recursos e URLs pós-redirect), seguido de teste adversarial.
3. Adicionar seletor semântico mais genérico e planejador cognitivo com supervisão, classificando explicitamente ações conforme risco e escopo.
4. Expor estados de missão/checkpoints no painel, com interrupção, progresso e HUMAN_GATE visual.
5. Auditar em PR, validar CI e só depois considerar integração a deployments governados; produção continua desativada.
