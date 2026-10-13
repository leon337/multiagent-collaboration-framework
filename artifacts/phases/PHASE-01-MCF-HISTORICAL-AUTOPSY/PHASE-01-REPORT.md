# PHASE-01 — Relatório de autópsia histórica MCF

**Status:** IN_PROGRESS. Amostragem documental e leitura estática concluídas; testes atuais e revisão independente não executados.
**Snapshot usado:** main SHA 460d6e6fc4c5ac8dc8b0962bcf76a62c059a1615.

## Linha do tempo resumida
- 2026-08-02 — DEC-007: inicialização padronizada, contrato, seleção dinâmica de agentes, charter e regra de não autorizar merge por padrão.
- 2026-08-04 — DEC-050: quatro papéis de controle (observabilidade, avaliação, memória/conhecimento e governança); documento relata roster de 25 + 4 = 29 à época.
- 2026-08-04 — DEC-051 e commit b5047b9: ESEV e PRF de nove artefatos para execução cronológica, evidências e handoffs verificáveis.
- 2026-08-12 a 2026-08-16 — releases v1.0.0-RC1, v1.0.0 e v1.1.0.
- 2026-08-27/28 — releases v1.2.0 e v1.3.0, cujos títulos destacam copresença, controle humano autenticado e sucessão governada.
- 2026-08-30 — DEC-066: sobriedade epistêmica global e anti-sycophancy sem contrarianismo reflexivo.
- 2026-09-18 — commit 3bd149e / PR #245: executor persistente de chat descrito no registro de commit.
- 2026-09-25 — commit 84c4444: protocolo de discovery para Dual Browser.
- 2026-10-01 — v1.4.0, título focado em contrato de agente provider-independent e execution control plane.
- 2026-10-08 — v1.5.0/v1.5.1, browser inline por conversa, identidade de sessão e correção de foco.
- 2026-10-09 — main 460d6e6: contrato de transporte WebSocket DSH corrigido e fronteira read-only Cognitive Ledger explicitada.
- 2026-10-09 — Issue #427: falha de readiness no dependency audit, separada desta auditoria.
- 2026-10-12/13 — PR #438 abre integração documental do Manual; Issue #441 e PR #442 isolam a autópsia.

## Componentes atuais lidos (código presente, não executado nesta missão)
- mission-runtime.controller.ts: API de missão/fase; imports de SessionAuthGuard/McfRuntimeTokenGuard e validação de body.
- chat-runtime-bridge.service.ts: cria steps/plano e coordena dispatch; não comprova que um provedor concluiu trabalho delegado.
- skill-executor.ts: conjunto explícito de skills executáveis e integração com despacho/evidência.
- evidence-validator.ts: canonicalização, digest e validação de receipts/HMAC e resultados CI.
- external-action-ledger.ts: estado persistente de tentativas externas, incluindo UNKNOWN e estados de evidência validada/rejeitada.
- agent-execution.service.ts: valida envelope de autoridade/capabilities e delega start/resume/interrupt/cancel/status/collectEvidence ao provider registry.
- human-control-policy.ts: comando humano reservado, checkpoint pausado e retomada condicionada a instrução explícita.
- mcf-production-readiness.yml: audit, formatação, lint, typecheck, migrações, integração, sandbox, testes/build e backup/restore.

## Achados
**H-01 — Implementação além de documentos (VERIFIED_FACT, alta confiança para presença).** O snapshot contém mission API, bridge, skill executor, provider execution service, evidence validator, ledger e testes correspondentes. Limite: não prova que testes passam agora nem que produção executa esse SHA.

**H-02 — Governança expressa em decisão, protocolo e runtime (VERIFIED_FACT).** DEC-007/050/051/066 e o protocolo definem autoridade, seleção, handoffs, ESEV e PRF. O controller inclui guardas de sessão e token. Limite: leitura estática não é auditoria adversarial completa.

**H-03 — Arquitetura separa pedido, execução, estado externo e evidência (INFERENCE, alta confiança).** Os serviços lidos dividem essas responsabilidades e representam resultados ambíguos como UNKNOWN. A prova de ação real ainda depende de receipts/postcondições válidos e testes.

**H-04 — Evolução de playbook a control plane (INFERENCE, média-alta).** Cronologia de ESEV/PRF, executor/chat, provider-independent contract e runtime atual sustenta a trajetória; título de release não é certificação de prontidão.

**H-05 — Preview verde não significa readiness (VERIFIED_FACT).** No HEAD observado da PR #442, dois contexts Vercel passaram, mas MCF Production Readiness run 1338 falhou em pnpm audit --prod --audit-level high e pulou gates seguintes. Log: 16 moderadas, 10 altas, 1 crítica. Issue #427 já rastreia o blocker. Os passos skipped não passaram nem falharam: não foram executados nesse run.

**H-06 — Audits antigos têm limite de SHA (SECONDARY_EVIDENCE + INFERENCE).** O audit de memória faz referência a main SHA 08fef949... e snapshots de staging antigos. A main evoluiu; conclusões antigas não podem ser copiadas como fatos atuais sem revalidação.
Fonte: https://github.com/leon337/multiagent-collaboration-framework/blob/main/artifacts/phases/PHASE-02-MEMORY-ARCHITECTURE/RUNTIME-EXECUTION-BOUNDARY-AUDIT.md

**H-07 — PR #438 contém defeito de tabela (VERIFIED_FACT).** project-instructions/README.md contém \n literal entre linhas adjacentes de uma tabela. Esta missão registra o finding sem editar aquela branch.

## Riscos priorizados
- P0: readiness/security gate de dependências bloqueado; manter Issue #427 aberta até remediação compatível, lockfile revisado, testes/regressão e audit verde.
- P1: nenhum teste local/build/runtime foi executado nesta fase.
- P1: confirmar source-to-deployment provenance antes de afirmar estado live.
- P1: receipts devem vincular ação, autoridade, recurso e postcondição; narrativa não basta.
- P1: corrigir o finding de PR #438 no contexto daquela PR.
- P2: MCP do Manual não foi testado.
- P2: arquitetura interna Dots não publicada permanece UNKNOWN.

## Limitações
Não foram executados pnpm install, build, unit/integration/e2e, migrações, sandbox ou runtime smoke. Checks/commits/releases foram lidos via GitHub. Não houve segunda auditoria independente nem ação no provider do Cognitive Ledger. Nenhum agente separado é creditado por trabalho que não executou.

## Referências
- DEC-007: https://github.com/leon337/multiagent-collaboration-framework/blob/main/docs/decisions/MCF-DEC-007-PROTOCOLO-DE-INICIALIZACAO-DE-NOVO-CHAT-E-PROJETO.md
- DEC-050: https://github.com/leon337/multiagent-collaboration-framework/blob/main/docs/decisions/MCF-DEC-050-QUATRO-AGENTES-DE-CONTROLE-E-PADRAO-OPERACIONAL-UNIFICADO.md
- DEC-051: https://github.com/leon337/multiagent-collaboration-framework/blob/main/docs/decisions/MCF-DEC-051-EXECUCAO-SEQUENCIAL-VISIVEL-E-RASTREABILIDADE-POR-FASE.md
- DEC-066: https://github.com/leon337/multiagent-collaboration-framework/blob/main/docs/decisions/MCF-DEC-066-SOBRIEDADE-EPISTEMICA-E-ANTI-SYCOPHANCY.md
- Protocolo: https://github.com/leon337/multiagent-collaboration-framework/blob/main/docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md
- Workflow: https://github.com/leon337/multiagent-collaboration-framework/blob/main/.github/workflows/mcf-production-readiness.yml
- Issue #427: https://github.com/leon337/multiagent-collaboration-framework/issues/427