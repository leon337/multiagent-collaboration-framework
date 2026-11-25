# PHASE-03 — Relatório de integração revisável

**Status:** IN_PROGRESS — draft aberto; publicação, testes e revisão humana ainda pendentes.
**Data:** 2026-10-13 UTC.

## I-01 — Código de manual conferido no banco correto
**VERIFIED_FACT.** O projeto Neon correspondente ao Manual foi encontrado pelo nome exato; a branch default foi resolvida pela flag default. Consulta SQL read-only listou apenas metadados de todos os registros: AGT-001, DEP-001 e DEP-002, todos published. Não havia DEP-003 nem o slug proposto em qualquer status. Nenhum texto de manual ou segredo foi consultado pelo SQL; nenhuma escrita foi realizada.

## I-02 — Rascunho persistido em PR separada
**VERIFIED_FACT.** Manual PR #1 está OPEN / DRAFT / NOT MERGED: https://github.com/leon337/manual-do-agente-gpt/pull/1
Branch: docs/draft-dep-003-dots-mcf-architecture
HEAD: b5d41c2bf2d4027389dbd137a228beb3053a063c.
Alteração: somente db/seed.sql; inclui code DEP-003, slug arquitetural único, category agentes-ia e status draft. Foi criado idempotentemente e não foi inserido no Neon.
O deployment Vercel de preview reportou success no último status check consultado. Isso não prova que npm test/build passaram; eles não foram executados por esta missão.

## I-03 — Estado atual da auditoria MCF e readiness
**VERIFIED_FACT.** MCF PR #442 segue OPEN / DRAFT / NOT MERGED: https://github.com/leon337/multiagent-collaboration-framework/pull/442
O workflow MCF Production Readiness #38341765114 foi concluído com FAILURE no commit auditado fcf4512de443e508c763475e88e17e0a0df41a0c: https://github.com/leon337/multiagent-collaboration-framework/actions/runs/38341765114
Job production-candidate-readiness, ID 115114119458: https://github.com/leon337/multiagent-collaboration-framework/actions/runs/38341765114/job/115114119458
Falha na etapa Dependency vulnerability gate, comando pnpm audit --prod --audit-level high. O log conta 27 vulnerabilidades: 16 moderadas, 10 altas e 1 crítica. Os passos de formatação, lint, typecheck, migrations, bootstrap, sandbox, tests, build, restore e release-contract foram SKIPPED; não passaram nem foram avaliados nesse run. Issue #427 rastreia o bloqueio de dependências. Esta auditoria não alterou dependências nem afrouxou o gate.

Advisories observados incluem GHSA-jqcg-44mw-7w3h (proxy-addr), GHSA-qw65-cvwx-89v3 e GHSA-58mr-gqgx-xq4g (fast-uri), GHSA-9c5c-9qcx-q35q (@nestjs/platform-fastify), GHSA-667r-xxjv-c9mm, GHSA-p68q-wchp-6fh7, GHSA-hwr6-493r-vm6h e GHSA-9q9j-q6p8-xq58 (fastify), e GHSA-6qxp-vccf-f47h (@modelcontextprotocol/sdk).

O resultado Vercel está dividido no último snapshot: um contexto passou e o contexto mcf-ecosystem-roadmap falhou; o link de destino aponta para uma página com upgradeToPro=build-rate-limit. A causa-raiz não está confirmada, então esse status não deve ser tratado como diagnóstico de falha de código sem evidência adicional.

## I-04 — Recomendações prioritárias
1. **P0 — fechar o dependency audit em trilha própria:** atualizar dependências/lockfile com análise de compatibilidade, executar regressões e só liberar readiness após auditoria verde. Não silenciar o gate.
2. **P1 — Policy Decision Gate não contornável:** padronizar ALLOW / DENY / REQUIRE_CONFIRMATION / HUMAN_HANDOFF / SAFE_ALTERNATIVE / STOP, com recurso, operação, escopo, risco, destinatário e autorização. Validar que outputs do agente não possam substituir a decisão.
3. **P1 — read-only de verdade:** capacidades de pesquisa limitadas por adapter/tool; tentativa de escrita deve falhar tecnicamente, não apenas por instrução de prompt.
4. **P1 — prova de ação:** correlacionar missão, ator, attempt/idempotency, receipt, recurso, timestamp e pós-condição. Timeout vira UNKNOWN até reconciliação.
5. **P1 — herança e revogação do escopo:** tarefas delegadas herdam somente o escopo mínimo; alteração de destinatário, efeito ou recurso exige nova autorização.
6. **P1 — avaliação encadeada e indireta:** regressões para prompt injection, mudança de permissão, escopo por intermediários, bypass de review, estado UNKNOWN e tentativas de retomar pausa.
7. **P2 — lifecycle de contexto:** explicitar origem, finalidade, retention, cópias, revogação, correção e deleção entre armazenamentos.
8. **P2 — observabilidade/interrupção:** timeline mostra estado real do provider, handoffs, motivo de bloqueio, evidências, cancelamento e necessidade de intervenção.
9. **P2 — DEP-003:** manter como draft até revisão editorial/técnica e tests do repositório; publicar somente pelo processo DEP-002 com sincronização Neon/seed autorizada.

## I-05 — Fontes e limites
As alegações sobre Dots são provenientes das fontes oficiais no Phase 02. O System Card relata avaliações finitas e residuals moderados de scope em tarefas encadeadas; isso não representa risco zero. Os internos não publicados de Dots permanecem UNKNOWN.
Não foram executados testes MCF ou Manual localmente; não houve chamada MCP, escrita no Neon, merge ou deploy de produção. Nenhuma revisão independente foi realizada por um segundo agente.
