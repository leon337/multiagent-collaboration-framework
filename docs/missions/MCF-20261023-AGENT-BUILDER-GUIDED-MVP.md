# MCF — Agent Architect Guided Builder (MVP)

**Mission:** MCF-20261023-AGENT-BUILDER-GUIDED-001
**Existing context:** Issue #467, PR #468 (draft)
**Risk class:** B — new local app and private workspace files; no changes to deployed presets without explicit approval
**Owner:** MESTRE; external audit Emily/Beatriz and formal Leo gate NOT claimed.

## /plan
Deliver a guided six-step interface (goal, behavior, tools, workspace, test, review) that supports both **create** and **modify**. Each agent receives its own persistent workspace under a Studio-controlled directory with validated identity, metadata, configuration and version history. Reuse DSH authenticated planner/mentor; allow creation of safe drafts without registering/publishing unknown plugins. For modifications of Hello World, allow proposal/preview through existing safe Studio API. Verify mobile layouts without absolute positioning, save/resume, security and error behavior. Preserve existing Hello World published profile, session, r6 draft and Lab history.

## /tasks
1. Inspect existing app, MCF mission status and user draft.
2. Implement dedicated workspace repository and API with validation and traversal prevention.
3. Implement interactive Agent Architect stepper and optional DSH-backed coaching.
4. Implement safe draft simulation and explicitly distinguished publication gate.
5. Run automated tests, browser E2E including DSH planner when available, capture screenshots and audit UX/accessibility.
6. Reconcile before/after hashes of existing agent profile and user draft; record evidence, PRF and push draft branch. No main merge.

## ./checklist
- [x] Create/modify choice
- [x] Guided goals and behavioral requirements
- [x] Tool allowlist and informed limits
- [x] Dedicated agent workspace, versioning, restart persistence
- [x] Step navigation (back/forward) and assistive DSH mentor
- [x] Preview by simulation without mutating active agent
- [x] Clear distinction: new draft is NOT installed in DSH
- [x] Security: input validation, no arbitrary filesystem paths/credentials
- [x] Responsive and keyboard UX
- [x] Unit/integration and real browser E2E
- [x] Main draft, lab history and published profile remain untouched
- [x] PRF with evidence and explicit governance caveats

## /autonomous-run /run
Execution delegated to MESTRE in this local scoped branch. Stop only when real app is usable or a hard blocker requires explicit user action. Gate: the MVP must not deploy a new arbitrary agent or edit live Hello World without separate approval.


## ESEV: execução e validação

1. Plano, tarefas e checklist registrados antes do desenvolvimento.
2. Store de workspaces UUID em diretórios privados. Cada pasta contém agent.json, README.md e versões numeradas. As ferramentas são restritas a calculator e clock.
3. Interface Step by Step de seis etapas, criar ou evoluir, voltar, retomar e revisar. Link direto para cada workspace.
4. Mentor MCF Agent Architect utilizou realmente a sessão DSH e salvou o conselho no workspace.
5. Teste do rascunho: calcule 12*6*5 retornou 360, sem mudar o agente ativo.
6. Evolução do Hello World foi encaminhada como proposta para revisão no editor. A comparação mostrou nome, modo, instruções e ferramentas diferentes; não houve aplicação automática.
7. Navegador Brave CDP: início, objetivo, comportamento, ferramentas, workspace, testes, revisão, mentor, reload e editor. Viewports 768, 390 e 320 sem overflow e zero exceções JavaScript.
8. Testes automatizados: nove aprovados. Bloqueios de caminhos inválidos, ferramentas desconhecidas e origem externa testados.
9. Ambiente principal: workspace de demonstração agent-f99e2930-8c4d-47e2-a024-cf76d79ea7cc, etapa revisão, r6, teste 360 e orientação DSH persistidos. O rascunho r6 principal e os arquivos de sessão antigos foram preservados.

## Limites e aceite

MVP funcional aprovado para criar rascunhos separados e evoluir o Hello World com proposta revisável. Novo workspace não instala automaticamente um preset novo no Harness. Publicar o Hello World continua exigindo revisão e confirmação separadas. Sem fine-tuning de pesos. Sem merge na main, sem execução da auditoria independente Emily/Beatriz nem gate formal delegado de Leo.

Evidências: docs/missions/evidence/agent-builder-guided-20261023.
