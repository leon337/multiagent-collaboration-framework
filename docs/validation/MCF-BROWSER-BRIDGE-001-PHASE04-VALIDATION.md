# Phase04B local provenance protocol v2 — draft validation

2026-10-21 · MCF-BROWSER-BRIDGE-001 / PHASE-04.
Registro inicial da execução em sandbox do Codex. Resultados reais posteriores estão no final deste documento.
Nesta execução inicial não houve commit, push, deploy, merge, interação em conta real ou perfil pessoal.
The existing uncommitted Phase04 adapter/docs were inspected and extended.

## Implementation

- Adapter generates a fresh UUID actionId from trusted execution context; fixed
  mission/phase and canonical mission version go through explicit CLI flags.
- CLI validates strict v2 identity and the same-owner 0700 socket directory,
  0600 socket/capability file, expiry and bounded response. No token stdout/logs.
- Broker binds the request to its human-opt-in grant, pending deadline and paired
  document. Worker enforces consentRef, delegation, lease, exact current document,
  expiry and replay checks; canonical identity is echoed and revalidated.
- Legacy Phase02/manual and Phase03 summary-only response remain compatible.
- Adapter rejects unbound summaries and mismatched/expired envelopes before
  EvidenceValidator.createTrustedReceipt. Signed metadata excludes text/raw URL/
  token and includes actionId, mission/phase/version, consentRef/expiry, sanitized
  fixture origin/title, SHA256 summaryDigest and untrusted=true. externalId equals
  actionId; commitSha equals summaryDigest. Later verification validates the signed
  digest binding, not unavailable original summary text. It cannot prove page
  content truth or defend against a compromised trusted same-UID process.
- verifyForSkill checks signature, metadata allowlist, scope/owner/context, consent
  expiry, UUIDs and digest consistency. PermissionEngine restricts provider to the
  exact experimental synthetic route and input allowlist.
- Conditional DI requires MCF_BROWSER_BRIDGE_ENABLED=true,
  MCF_BROWSER_BRIDGE_SAME_HOST=true and NODE_ENV other than production. The socket
  directory is trusted operator configuration, never an action input. CLI checks
  filesystem safety before connecting. SkillExecutor additionally requires the
  separate MCF_BROWSER_BRIDGE_SKILL_ENABLED=true flag and exact route. Defaults off.
- Skill stays EXPERIMENTAL/SCOPED_WRITE with Mestre/Rafael owners. Only its provider
  allowlist changes. No constitutional agents/dynamic actions/parallel runtime.
- Native Messaging runs on the browser host. Remote/cloud MCF cannot reach this
  Unix socket; no separate host-initiated remote channel is implemented.

## Checks actually executed

| Check | Result |
| --- | --- |
| Bridge Node tests | 19 PASS, 0 FAIL, 1 skipped |
| JavaScript syntax/MV3/host template check | PASS |
| git diff --check | PASS |
| Real Unix IPC (legacy + canonical test) | NOT_RUN: sandbox denies Unix socket listen |
| Host subprocess smoke | NOT_RUN: spawnSync /usr/bin/node EPERM |
| e2e:brave | NOT_RUN: OPTIONAL_PUPPETEER_CORE_UNAVAILABLE |
| e2e:agent | NOT_RUN: OPTIONAL_PUPPETEER_CORE_UNAVAILABLE |
| e2e:canonical | NOT_RUN: OPTIONAL_PUPPETEER_CORE_UNAVAILABLE |
| Server typecheck | NOT_RUN: tsc unavailable, node_modules absent |
| Server adapter Vitest | NOT_RUN: vitest unavailable, node_modules absent |

No dependencies were installed and no lockfile changed. E2E harness NOT_RUN exits
successfully by its existing convention; that exit code is not evidence of PASS.
Smoke/typecheck commands failed at environment prerequisites, not at executed
application assertions. No real browser was launched.

## Coverage and pending external gates

Node tests exercise strict canonical schema, wrong mission/phase/action/version,
forged/unbound result, consent reference, revoked/expired grant, timeout and replay.
The existing worker scenario matrix now runs both versions: opt-in, STOP, popup
close, tab switch, document drift, expired request, replay, busy and post-snapshot
revocation. Existing legacy tests pass. Real socket tests now include v2 envelope
binding and replay, but were skipped here.

Vitest cases use the actual broker result-routing function with a fake transport
runner to construct a correlated envelope, then exercise receipt creation and
EvidenceValidator verification, wrong binding, stale expiry, wrong summary digest,
forged metadata, denied scope/URL/agent/operation, unbound Phase03 and feature off.
This is a deterministic protocol test, not evidence of a real host/browser read.
These TypeScript tests have not run in this environment.

MESTRE/CI must run server typecheck and relevant runtime tests with frozen existing
dependencies, module/dispatcher/ledger regressions, real sockets/host smoke, and all
three disposable Brave/Xvfb E2Es. Canonical E2E asserts identity echo, consentRef,
expiry, sanitized summary, and CLI DENIED with empty stdout after STOP. No production
activation is authorized by this document or by code presence on the draft branch.


## Verificação independente MESTRE — 2026-10-21 (após sandbox Codex)

**Escopo e atribuição:** verificações executadas no notebook autorizado `leo-N43SM` por MESTRE, fora da sandbox do Codex, sobre a branch experimental. Este registro atualiza os resultados `NOT_RUN` da execução **anterior do Codex**, sem alterar seu histórico. Não houve integração em produção, uso do perfil pessoal Brave, login em contas reais ou publicação.

| Comando/verificação | Evidência observada |
| --- | --- |
| `npm test` (apps/mcf-browser-bridge) | **21 PASS, 0 FAIL, 0 SKIP**; IPC Unix real, protocolo v2 e resposta atrasada descartada corretamente |
| `npm run check` | **PASS**, sintaxe JS, permissões MV3 e manifesto |
| `npm run smoke:host` | **4/4 PASS**, origem incorreta/config ausente/escrita negadas |
| `npm run e2e:brave` | **PASS**, Brave 155 + host Native Messaging + fixture descartável |
| `npm run e2e:agent` | **PASS**, CLI opt-in + redação + STOP |
| `npm run e2e:canonical` | **PASS**, correlação missão/fase/ação/consentRef por CLI em navegador verdadeiro, fixture sintética e recusa após STOP |
| `pnpm install --frozen-lockfile --ignore-scripts --filter '@rsa/server...'` | **PASS**, dependências de teste somente; lockfile inalterado, instalação local sem scripts |
| `pnpm build:packages` | **PASS**, pacotes contracts/database |
| `pnpm --filter @rsa/server exec vitest run ...` (6 suites selecionadas) | **60/60 PASS**, cobrindo adapter, EvidenceValidator, SkillExecutor, PermissionEngine e AdapterRegistry |
| `pnpm exec tsc --noEmit -p tsconfig.browser-bridge-verify.tmp.json` (adapter + teste) | **PASS**, configuração temporária removida após execução |
| Typecheck global `pnpm --filter @rsa/server typecheck` | **BLOCKED**, erro TS1005 em `src/mcf-runtime/agent-execution.contracts.test.ts:97`, arquivo idêntico ao commit-base, não alterado por esta missão |
| Readiness global / issue #427 | **BLOCKED**, vulnerabilidades do projeto independente da qualificação local |

### Correções de auditoria do MESTRE

1. **Isolamento de contexto:** o runner recebeu uma cópia `{ ...canonical }` em vez da referência canônica original. Caso um runner mutável altere indevidamente sua entrada, a validação compara com o contexto original e retorna `INVALID_RESPONSE`. O teste negativo `missionVersion` inicialmente falhou no ambiente real e passou após a correção, sem redução de cobertura.
2. **Registro canônico:** o runtime usa `skills/registry.yaml`, não apenas `skills/web/MCF-WEB-INTERACT.yaml`; o provider experimental foi adicionado ao registro principal. Teste lê a definição real e exige escopo sintético exato.
3. **Débito anterior do registry:** duas skills experimentais `MCF-WEB-EVENTS` e `MCF-WEB-FAST-NAV` não possuíam `fallback` e `handoff_to` exigidos pelo loader; metadados de bloqueio/handoff seguro foram propostos somente nesta branch para tornar o catálogo inteiro carregável. **Revisão humana de governança requerida antes de aceitar esses defaults.**
4. **Nenhum gate foi enfraquecido:** flags de runtime/despacho permanecem desligadas por padrão; status EXPERIMENTAL; nenhuma autorização de operação em contas, transferências, publicações ou acesso remoto.

### Limites de evidência

O E2E canônico testa a extensão e a CLI no Brave isolado, mas não inicia um MissionRuntime completo ligado ao browser; a verificação do adapter usa um runner injetado que devolve envelope construído pelo roteador real. Ambos passaram **separadamente**. Não se deve confundir sua combinação com prova de produção ou atestado de assinatura de uma sessão externa não confiável.

A proveniência é verificável apenas dentro da fronteira local confiável (host + extensão + processo sob o mesmo UID), não criptograficamente contra malware com o mesmo UID. Sem canal MCF cloud→notebook. Sem auditoria canônica atribuível de Emily ou gate operacional LÉO. PR deve permanecer **DRAFT**, sem merge ou promoção.


### Correção P2 de respostas atrasadas — MESTRE (2026-10-21)

A segunda revisão automatizada encontrou uma falha real na função `routeAgentResult`: resposta válida porém **antiga**, de `actionId` diferente da leitura pendente, podia ser comparada prematuramente contra o vínculo canônico atual e interromper o host. O MESTRE alterou a ordem de verificação para validar o formato e descartar resultados antigos antes de comparar a identidade do pedido ativo. Foi adicionado teste determinístico para resposta v2 atrasada, resposta v1 atrasada, ausência de pending e rejeição de identidade forjada com mesmo `actionId`.

**Reteste independente após o patch:**
- `npm test` → **21/21 PASS**, zero skipped/fail;
- `npm run check` → **PASS**;
- `npm run smoke:host` → **4/4 PASS**;
- `npm run e2e:brave`, `npm run e2e:agent`, `npm run e2e:canonical` → **3/3 PASS**, todos em perfil Brave e XDG efêmeros;
- `pnpm --filter @rsa/server exec vitest run src/mcf-runtime/mcf-browser-bridge.adapter.test.ts` → **33/33 PASS**;
- seis suites selecionadas de regressão do runtime (adapter, permissões, SkillExecutor, EvidenceValidator, registry) → **60/60 PASS** (verificação anterior ao patch do broker, sem tocar nos testes do servidor depois);
- packages contracts/database compilados sem erros; typecheck isolado do adapter e teste → PASS;
- typecheck global do servidor continua bloqueado pelo mesmo `agent-execution.contracts.test.ts:97` existente no baseline, fora deste PR;
- Security Production Readiness (#427) e homologação real de contas/produção continuam bloqueadas.

O teste `e2e:canonical` **não** exercita um processo completo MissionRuntime do servidor; ele valida a correlação local com o broker/CLI. Os testes unitários do adapter validam a criação/assinatura/verificação de receipt com um runner de transporte injetado. Juntos sustentam um candidato experimental, não uma liberação para produção. As correções documentais no registry de duas skills existentes propõem `fallback/handoff_to` conservadores para compatibilidade com o loader; dependem de aprovação no PR draft.


### Revisão adicional e critérios antes do merge

- A segunda revisão automática por `codex review --uncommitted` (após correção P2 de stale responses) encerrou **sem defeitos acionáveis identificados**. No sandbox do revisor, 20 testes passaram e um teste de socket foi marcado skipped; no notebook MESTRE executou a mesma suíte fora do sandbox com **21/21 PASS** e verificou três E2Es reais descartáveis. Essa revisão automatizada não equivale à auditoria canônica de Emily.
- `prettier --check` aplicado aos arquivos alterados acusou **19 caminhos com divergência de formatação**. Para evitar um diff amplo em arquivos de runtime/registry preexistentes, a formatação automática global **não foi aplicada**. **Gate de estilo/CI global pendente antes do merge**; não tratar a revisão local como aprovação integral de produção.
- Typecheck completo do servidor bloqueado por erro TS1005 preexistente em `agent-execution.contracts.test.ts:97`, já presente em HEAD-base. A correção desse débito deve ocorrer em PR separado/revisado, não foi incluída nesta implementação.
- Prontidão de produção do MCF permanece condicionada à segurança #427, revisão da alteração de duas skills no registry, auditoria independente de Emily e gate LÉO.
