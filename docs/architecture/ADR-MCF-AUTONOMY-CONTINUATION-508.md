# ADR — MCF-AUTONOMY-001: continuação durável e gate humano único

> **Estado:** PROPOSED / NOT_IMPLEMENTED. **Issue:** [#508](https://github.com/leon337/multiagent-collaboration-framework/issues/508). **Bloqueio de release relacionado:** [#506](https://github.com/leon337/multiagent-collaboration-framework/issues/506).
> **Baseline auditada:** `main@0bcea848934ada8593a9ff8be86ea3a41157e546` (2026-11-09). Mudanças posteriores devem reler o GitHub e revalidar as evidências.

## Problema e decisão

O MCF registra missões/fases/recibos e governa operações externas, mas o objetivo de uma missão grande pode depender do chat para redescobrir estado e pedir novamente a mesma autorização. O PR #505 terminou na `main` com 5/5 CI, porém produção continuou na imagem anterior. Isso é um fluxo corretamente fail-closed, mas operacionalmente **sem reconciliador para avançar dependências**.

**Decisão proposta:** não criar outro runtime. Acoplar ao MCF um **Mission Continuation Reconciler** persistente, inicialmente só leitura e sem mutação de produção, que identifique o próximo passo delegável, execute quando autorizado e emita **no máximo um GateRequest aberto por decisão causal**. O release continua exigindo prova de identidade de LEANDRO e gate operacional de LÉO, com SHA exato e alvo atestado.

## Evidência e limites

- `apps/rede-social-agentes/packages/database/migrations/0030_human_authority_binding_bootstrap.sql`: o alvo de binding legado permite somente `STAGING`. Não é seguro trocar a constraint isoladamente; requer bootstrap trust model, migração e revisão.
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/production-authorization.service.ts`: resolve missão v1.1 e fase `MCF-DEPLOY-VALIDATE`, autenticação de decisão humana e evento operacional LÉO no SHA exato.
- `.github/workflows/mcf-runtime-production-deploy.yml`: fluxo manual em `main` depende de secrets de URL de produção e mission_id/phase_id persistidos. CI verde não libera deploy.
- `apps/rede-social-agentes/ops/production-authorization-resolver.mjs`: verifica procedência por resposta do control plane e token, mas não prova sozinho que hook, banco e instância são o mesmo alvo; requere-se target binding robusto.
- `apps/rede-social-agentes/apps/server/src/mcf-runtime/local-agent-team.adapter.ts`: workers locais isolados e receipt consolidado têm `cognitiveIndependenceProven: false`. Uma execução de testes do escopo `local-agent-team*` validou 10/10; isso não é uma auditoria de múltiplas LLMs.
- Auditoria externa [Claude.ai](https://claude.ai/chat/ef3be621-cc47-4850-9ce6-22e80e8efcd1), leitura do SHA, identificou o ciclo de bootstrap e recomendou B-lite. As severidades propostas são hipóteses de revisão, não vulnerabilidades exploradas.
- Codex CLI atingiu quota; Gemini CLI e DSH headless exigiram credenciais não disponíveis nas respectivas rotas. Não foram usados como revisores concluídos e nenhuma senha foi movida para o chat.

## Alternativas consideradas

| Alternativa | Benefício | Limite | Disposição |
|---|---|---|---|
| A. Apenas endurecer o workflow GitHub | Menor mudança; detecta missing secrets e SHA | Mantém dependência da conversa para retomar; não resolve bootstrap | Não suficiente |
| **B. Reconciliador durável + vínculo de alvo (B-lite)** | Reusa ledger, missões, política e CI; retoma após reinício e deduplica gates | Necessita novas tabelas/contratos e E2E de segurança | **Recomendada** |
| C. Transformar aprovação de GitHub Environment em autorização de produção | UI simples | Não é equivalente à autorização canônica em missão/fase; quebra segregação | Rejeitada como atalho |

## Confiança e autorização

1. **BootstrapGrant** (uma vez por alvo/instalação): após descoberta somente leitura, LEANDRO confirma a identidade verificável da instância, o canal de execução (notebook local `LOCAL_PULL` ou Render), o escopo e sua expiração. O operador credenciado instala/associa o executor sem expor secret no chat. Não é um release authorization de validade ilimitada.
2. **GateRequest de promoção** (no máximo um para cada SHA de release, targetBinding e pacote de evidência): o MESTRE prepara CI, diff, review técnico, rollback, PIP/recibo e mostra um resumo único. LEANDRO decide pelo mecanismo autenticado oficial; LÉO registra sua avaliação operacional com identidade e evidência próprias. O modelo nunca os imita.
3. **AuthorizationReceipt**: uso único, SHA/target/evidence/nonce/expiry vinculados e validação de procedência no mesmo trust root. Em um reenvio/replay, bloquear ou retornar idempotentemente o receipt existente; nunca criar nova autorização por repetição do chat.
4. **Policy alignment:** revisão por Claude é evidência técnica; review GitHub é um evento distinto. A regra de GitHub e os requisitos da Issue não podem divergir silenciosamente. Decisão humana sobre a política aplica-se prospectivamente, jamais retroage para inventar review.

## Contratos mínimos (proposta, não schema implantado)

| Contrato | Campos obrigatórios e invariante |
|---|---|
| `RuntimeTargetBinding` | `bindingId`, `environment`, `targetKind`, `runtimeInstanceFingerprint`, `databaseFingerprint`, `reachabilityMode`, `discoveredAt`, `verifiedAt`, `expiresAt`, `evidenceDigest`, `status`. Origem do `deployHook` e dos secrets atestada, não inferida |
| `MissionContinuation` | `continuationId`, `missionId`, `goal`, `releaseSha`, `targetBindingId`, `state`, `stateVersion` CAS, `progressFingerprint`, `lastProgressAt`, `deadlineAt`, `nextAttemptAt`, `retryCount`, `leaseOwner`, `leaseExpiry`, `openGateRequestId` |
| `ExternalDependency` | `code`, `responsibleActor`, `observedFrom`, `evidenceDigest`, `retryPolicy`, `resolutionCondition`, `firstSeenAt`, `lastChangedAt`; dependência estrutural não gera polling infinito |
| `GateRequest` | `gateRequestId`, `decisionKey=hash(kind,sha,target,evidenceDigest)`, `kind`, `scope`, `evidenceDigest`, `validUntil`, `status`, `audience`, `notificationCount`; índice único parcial para estado OPEN |
| `GateDecision` | `gateRequestId`, `humanAccountId`, `sessionRef`, `nonce`, `decision`, `scope`, `signedDigest`, `decidedAt`, `expiresAt`, `consumedBy`; operação LEANDRO ≠ operação LÉO |
| `DeployExecution` | `executionId`, `receiptId`, `idempotencyKey=hash(receipt,sha,target)`, `previousHealthySha`, `targetSha`, `actionLedgerRef`, `state`, `healthReadback`, `rollbackReceipt`, `finishedAt` |

## Máquina de estados e anti-loop

```text
DISCOVERING -> PREFLIGHT -> READY_FOR_GATE -> WAITING_HUMAN -> AUTHORIZED
                    |                   |                |
                    +-> BLOCKED_EXTERNAL +-> EXPIRED     +-> REJECTED
AUTHORIZED -> EXECUTING -> VERIFYING -> COMPLETED
                  |             |
                  +-> UNKNOWN -> RECONCILING -> VERIFYING | ROLLING_BACK
                                |
                                +-> STALLED | FAILED | ROLLED_BACK
ANY -> SUPERSEDED (SHA changed) | CANCELLED
```

- Persistir transição com CAS e lease com `fencingToken`; execução duplicada não inicia novo efeito. Dois workers em concorrência disputam claim transacional.
- `progressFingerprint = sha256(goal, sha, targetBinding, blockers ordenados, evidenceDigests, etapa)`. Igualdade por *K* ciclos sem mudança => `STALLED` e no máximo uma notificação; jamais reemitir gate idêntico.
- `BLOCKED_EXTERNAL` para secret ausente, alvo sem prova, credencial/provedor esgotado e PIP inacessível: aguardar mudança **observada** da dependência; não tentar recuperação fictícia.
- Retry somente para falha transitória com backoff exponencial e teto, deadline e jitter. Se uma requisição com efeito ficou `UNKNOWN`, consultar o estado externo antes de tentar qualquer mutação.
- `SUPERSEDED` invalida autorização do SHA anterior sem reutilizá-la; `CANCELLED` revoga leases e bloqueia tentativas novas. **Concluído** somente com SHA no alvo + readiness + receipt + rollback verificado.

## Ordem de implementação e gates

**PR-A: Observador somente leitura.** Extrair do preflight do laboratório o vínculo seguro de SHA/CI e descobridor de alvo; reportar `ExternalDependency` e fingerprint. Consultar presença de secrets por nome; provider quota/health; nenhuma conexão ou mutação em produção. Verificar que staging não pode ser identificado como produção e que não há duplicação de notificação.

**PR-B: Continuação durável (sem execução de produção).** Migração + contratos + reconciliador + GateRequest único por decisionKey; `WAITING_HUMAN` com interface de revisão, aceitação/rejeição de escopo fixo, retomada após restart, concorrência e snapshot. Provar 100 polls -> 1 gate, 1 notificação, zero deploy.

**PR-C: Bootstrap/provedor governado.** Protocolo de binding one-time independente do runtime a atualizar, validação de autoridade existente, promoção exact-SHA pelo canal verificado (local pull/self-hosted ou Render), assinatura/replay e rollback. Revisão de segurança e HUMAN_GATE canônico antes de ativar. Ensaiar staging e recuperação de efeito `UNKNOWN` antes de production.

## Aceitação e métricas

- Para bloqueio persistente, **100 consultas => 1 GateRequest, <=1 notificação, zero autorizações inventadas**.
- Com reinício forçado em cada etapa, a missão retoma sem recomeçar a conversa e sem duplicar efeito externo.
- `PENDING` por secret ausente precisa produzir `owner + resolutionCondition`, não uma nova pergunta ao humano.
- A identidade do release é o merge commit da `main` e deve coincidir com o SHA no alvo. Nenhum workflow executa com binding divergente.
- Medir por missão `humanPrompts`, `duplicateGateRequests`, `progressAfterRestart`, `actualAutonomousActions` e `minutesBlockedByExternalDependencies`. Meta inicial: **um gate humano por release** após o bootstrap único (salvo mudança material de SHA/alvo/escopo).
- A Issue #506 só poderá ser marcada concluída com `DeployExecution=COMPLETED` e evidências verificadas no runtime oficial, não por merge, aprovação de LLM ou CI.

## Papéis e limites

MESTRE orquestra e reconcilia; Sofia revisa arquitetura; Rafael/Eduardo implementam os contratos; Emily audita segregação e prova criptográfica; Renato qualifica E2E; LÉO emite decisão operacional independente, quando autorizado; LEANDRO conserva autoridade final. Estes são papéis propostos, não prova de execução por LLMs independentes. Quota/autenticação de agentes externos é uma dependência do runtime, não motivo para elevar privilégios ou repetir HUMAN_GATE.

## Regras de não implementação automática

Esta ADR não ativa daemon, não provisiona segredo, não migra produção, não dispensa PIP/recibo, não cria missão/fase fictícias, não transforma parecer Claude em review GitHub e não autoriza standing production grants. Uma mudança dessas exigirá decisão explícita e audível pela autoridade competente.
