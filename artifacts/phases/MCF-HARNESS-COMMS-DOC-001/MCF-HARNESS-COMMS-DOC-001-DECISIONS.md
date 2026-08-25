# MCF-HARNESS-COMMS-DOC-001 — Decisões

Cronológico com autor. Decisões operacionais dentro do boundary autorizado.

## 2026-08-25

- **DEC-001** (Ox) — Localização da spec: `docs/integrations/MCF-HARNESS-MESTRE-OX-CHANNEL.md` +
  `docs/integrations/evidence/MCF-HARNESS-MESTRE-OX-E2E-20260825.md`.
  Motivo: convenção existente de integrações (`MCF-*` + `evidence/*-E2E-*`) e índice por domínio em
  `docs/README.md`. Alternativa descartada: criar pasta nova de specs (duplicaria taxonomia).
- **DEC-002** (Ox) — Enquadramento do DSH como *execution provider/adapter candidato*, citando
  `artifacts/phases/PHASE-02-MEMORY-ARCHITECTURE/AGENT-EXECUTION-PROVIDER-OPTIONS.md`; nenhuma
  redefinição do MCF como dependente do Harness.
  Motivo: determinação de origem, item 5.
- **DEC-003** (Ox) — Separação explícita NORMATIVO vs DEPLOYMENT vs EVIDENCE em seção própria,
  com marcadores aplicados ao longo do texto.
  Motivo: determinação, item 6; doutrina do repo sobre valores voláteis (`READ_GITHUB_LIVE`).
- **DEC-004** (Ox) — `BRANCH-AUDIT-REPORT-20260825.md` (não rastreado, de outro esforço)
  preservado intocado e excluído do commit da missão.
  Motivo: proibição de sobrescrever trabalho alheio.
- **DEC-005** (Ox) — Credenciais: nenhum arquivo de credenciais lido; providers/modelos
  documentados apenas por endpoints que não expõem chaves (`llm.providers`, `session.models`,
  `agentPreset.list`).
  Motivo: critério "nenhuma credencial exposta".
- **DEC-006** (Ox) — Regra terminal documentada como invariante: timeout de observador ≠ fim/falha;
  só `turn/end` + `running=false` comprovados (ou erro classificado via CAF) encerram.
  Motivo: determinação, item 9; incidentes observados de SSE reconectável na mesma install.
