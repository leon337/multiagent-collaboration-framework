# PHASE-MCF-WORLD-WEB-FIRST-001 — Decisions

1. **MESTRE** — classified the work as Class B and kept execution inside the explicitly authorized reversible repository boundary.
2. **Leonardo** — MVP limited to terrain/PET movement/follow camera/Local URL intent/return-to-world/browser-safe fallback; accounts, multiplayer and complex persistence deferred.
3. **Sofia** — chose additive standalone `apps/mcf-world-web/` so the unavailable local Electron workspace is not overwritten.
4. **Helena** — implemented a static ESM browser shell with Three.js 0.180.0 and a capability-specific Browser Surface.
5. **Ricardo** — required HTTP(S)-only normalization, restrictive iframe sandbox without `allow-same-origin`, `noopener,noreferrer`, and server root confinement.
6. **Renato** — used RED->GREEN evidence for domain, hosted UI and server; final matrix runs on Ubuntu and Windows.
7. **Bruno** — provider selection and production deploy remain deferred; the artifact is portable and locally served without external package installation.
8. **Miriam** — legacy Electron state remains an evidence source to reconcile later, never a state to reconstruct.
9. **Gabriel** — branch and draft PR #343 are the reviewable integration point; no merge/release/deploy is implied.
10. **Emily audit** — evidence supports the hosted MVP claims; it does not support a real-browser visual claim or Electron reconciliation. Same-session audit limitation is recorded; no separate reviewer runtime was available.
11. **Leo gate** — APROVAR_COM_RESSALVAS for this phase: hosted MVP and repository validation pass; real-browser visual smoke is not available in this runtime and Electron reconciliation remains blocked on Issue #330.
12. **MESTRE closeout** — phase can be ENTREGUE; parent mission remains AGUARDANDO_DEPENDENCIA_EXTERNA for the offline-host reconciliation only.
