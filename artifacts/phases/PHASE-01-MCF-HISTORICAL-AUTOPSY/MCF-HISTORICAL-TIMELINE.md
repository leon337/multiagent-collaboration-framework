# MCF — Linha do tempo e transições arquiteturais

**Snapshot de código usado:** main SHA 460d6e6fc4c5ac8dc8b0962bcf76a62c059a1615, consulta 2026-10-13.
**Método:** decisões, release metadata, commits e leitura de código atual. Um evento versionado não prova deployment atual.

| Data | Evento | Significado | Limite |
|---|---|---|---|
| 2026-08-02 | DEC-007 | Inicialização de projeto/chat, autoridade, contrato, seleção dinâmica e charter. | Norma escrita não prova instalação em todo chat. |
| 2026-08-04 | DEC-050 | Quatro papéis transversais para observabilidade, avaliação, memória e governança; roster relatado passa de 25 a 29. | Válido naquele marco. |
| 2026-08-04 | DEC-051 / commit b5047b9 | ESEV e PRF de nove artefatos, para ação/evidência/handoff cronológicos. | Requisito; cada fase requer conformidade própria. |
| 2026-08-12 | v1.0.0-RC1 | Primeiro release candidate visível na série. | Metadata não prova runtime. |
| 2026-08-14 | v1.0.0 | Primeira release estável 1.0.0 listada. | Não prova deployment. |
| 2026-08-16 | v1.1.0 | Continuação da série inicial. | Metadata. |
| 2026-08-27 | v1.2.0 | Título enfatiza controle humano/copresença. | Título não é prova comportamental. |
| 2026-08-28 | v1.3.0 | Título enfatiza controle autenticado/sucessão governada. | Título não é prova live. |
| 2026-08-30 | DEC-066 | Sobriedade epistêmica global; anti-sycophancy sem contrarianismo reflexivo. | Eficácia exige avaliações. |
| 2026-09-18 | 3bd149e / PR #245 | Commit descreve executor persistente para chat/bubble. | Mensagem não prova execução live. |
| 2026-09-25 | 84c4444 | Protocolo canonicaliza runtime discovery do Dual Browser. | Cada sessão ainda requer evidência de discovery. |
| 2026-10-01 | v1.4.0 | Título menciona contrato provider-independent e execution control plane. | Metadata de release. |
| 2026-10-08 | v1.5.0/v1.5.1 | Reconciliação browser inline, session identity e foco do composer. | Não garante estado de desktop atual. |
| 2026-10-09 | main 460d6e6 | WebSocket DSH corrigido; Cognitive Ledger continua read-only no adapter documentado. | Commit e conteúdo versionado. |
| 2026-10-09 | Issue #427 | Readiness dependency audit bloqueado. | Reauditar após remediation. |
| 2026-10-12 | PR #438 | Integração documental do Manual em PR aberta. | Não merged; instalação em settings é manual. |
| 2026-10-13 | Issue #441 / PR #442 | Abre autópsia Dots × MCF isolada. | Estado da consulta. |

## Arquitetura visível no código atual

- mission-runtime.controller.ts: API de missão/fase, guardas de autenticação/token e validação de payload.
- chat-runtime-bridge.service.ts: preparação de steps/dispatch; não comprova que provedor externo concluiu trabalho.
- skill-executor.ts: conjunto de skills explicitamente executáveis e integração com evidência/despacho.
- evidence-validator.ts: canonicalização/digests e validação de receipts/HMAC e resultados de CI.
- external-action-ledger.ts: tentativas externas persistentes, incluindo UNKNOWN para resultado ambíguo, além de estados de evidência validada/rejeitada.
- agent-execution.service.ts: valida envelope/capabilities e delega ciclo de vida ao provider registry.
- human-control-policy.ts: comando humano reservado, checkpoint pausado e retomada por instrução explícita.
- mcf-production-readiness.yml: audit, format/lint/typecheck, migrações, integração, sandbox, testes/build e backup/restore.

## Conclusões
1. MCF não é só um prompt/playbook: a árvore atual tem runtime, provider adapters, ação externa persistente e verificação de evidência.
2. Maturidade mista: há implementação e testes versionados, mas o readiness gate observado está bloqueado no dependency audit.
3. A cadeia de prova deve ligar intenção, autoridade, ação, recurso, receipt e postcondição; mensagem narrativa não é suficiente.
4. Audits antigos precisam manter seu SHA/data e não devem ser usados como fato live sem reconciliação.
5. Componentes internos de Dots não publicados serão classificados UNKNOWN.

## Fontes
- DEC-007: https://github.com/leon337/multiagent-collaboration-framework/blob/main/docs/decisions/MCF-DEC-007-PROTOCOLO-DE-INICIALIZACAO-DE-NOVO-CHAT-E-PROJETO.md
- Protocolo: https://github.com/leon337/multiagent-collaboration-framework/blob/main/docs/protocols/MCF-PROTOCOLO-OPERACIONAL-UNIFICADO-DE-AGENTES.md
- Main: https://github.com/leon337/multiagent-collaboration-framework/commit/460d6e6fc4c5ac8dc8b0962bcf76a62c059a1615
- Readiness workflow: https://github.com/leon337/multiagent-collaboration-framework/blob/main/.github/workflows/mcf-production-readiness.yml
- Issue #427: https://github.com/leon337/multiagent-collaboration-framework/issues/427