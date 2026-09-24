# PHASE-01 Report — UI Semantic Manual

## Execution summary
MESTRE opened Issue #361 and dispatched four parallel design/audit sub-missions.

Agent outputs:
- Sofia — COMPLETED — result SHA `e7513431d0505871494b8eeb47c9f9fb767bf5dfa01ba37b55aba46165373529`.
- Emily — COMPLETED — result SHA `c8239230d28ec37652a6ea7454d6d4931246d2e6614c39a5dc37e61c5879e805`.
- Patrícia — COMPLETED — result SHA `db715df3051974bbf39804c319d1620da44476ccdb977c910051a8e277ddd712`.
- Rafael — COMPLETED — result SHA `ba32a417f434c40193876ea597e9593e87013498fc0a84d89f5d4f6466062ecb`.

## Live inventory
Across the four panes, MESTRE observed:
- project links with accessible names `Abrir projeto ...` and stable project href identity;
- `Novo chat`;
- `#prompt-textarea` / role=textbox;
- `#composer-submit-button` when actionable/generating;
- current conversation identity in WebContents URL;
- isolated Cockpit pane bindings.

## Canonical decisions
1. Persist `semanticId`, invariants, ordered locator strategies and postconditions.
2. Do not persist runtime CSS selectors as canonical identity.
3. Local account/project IDs belong in a local binding profile, not the generic repository.
4. >1 candidate is AMBIGUOUS and executes zero action.
5. Runtime observation never auto-edits the contract.
6. Screenshot/coordinates are secondary evidence only.
7. Human manual and machine contract share the same semantic IDs.
8. `chatgpt.composer.submit` is stateful and may legitimately be unavailable when composer is empty and generation inactive.

## Delivered repository artifacts
- `docs/operations/MCF-UI-OPERATING-MANUAL.md`
- `docs/contracts/MCF-UI-SEMANTIC-CONTRACT.json`
- `docs/MCF-CURRENT-STATE.md` pointer

## Delivered local artifact
- `~/.config/mcf-dual-browser-cockpit/ui-semantic-bindings.json`
- mode 0600
- SHA-256 `d540428b4f0fab4f241e15a38c450bdaf0b7f0ef5b894b77456bc89256c3f70f`

No chat was deleted and no new chat was created in this phase.

## Independent audit R1 and remediation
Emily final R1: PASS; Critical=0; High=0; Medium=2; Low=1.
Result SHA: `9ca3f609f8491703bae28784f695847fb283a31eb543a2fb03d08002a095c51b`.

Medium findings were remediated before merge:
- stop semantic locator now distinguishes `data-testid=stop-button` from DOM `#composer-submit-button`;
- state predicates for `send / stop-generation / unavailable / unknown` are encoded in contract v1.0.1.

Low traceability finding was remediated with `PHASE-01-CANONICAL-HASHES.sha256`.

Smoke R3 on contract v1.0.1: PASS 44/44.
Local binding SHA-256 after version sync: `a6c9a71c970974c0284f9c1fc9c632f2e81f2d880c0c8e3eda717b5c15ae9c27`.
R3 evidence SHA-256: `1e03880808fa0e9b7cf8f03e663d9a205d079a5ebf4f3db4a3089c7d9da6bd03`.
