# MCF Current Work Reconciliation — MCF-CURRENT-WORK-RECONCILIATION-001

Snapshot: 2026-10-01
Mission: #388
Baseline: main@88151a798a08c7dc95d33b895bb3a337526f0a36
Release: v1.4.0 at the same SHA.

## Finding

The MCF does not need another broad runtime rewrite now. The immediate work is to stabilize and exercise the execution/control boundary already released, then reduce the backlog to dependency-ordered missions.

## NOW

| Issue | Work | Evidence |
|---|---|---|
| #370 | deterministic WebAgent actions + policy gates | IMPLEMENTATION_AUTHORIZED; PR #371 open |
| #372 | ChatGPT new-chat reconciliation | active reconciliation; PR #373 open |
| #164 | Cognitive Ledger memory.write | prerequisite for #316 |
| #238 | Harness 2.1 hardening | active hardening; PR #239 open |
| #304 | native web read provider | PR #304 open; foundation for #301 |
| #381 | Agent Workspace | PR #382 open; read-only MVP evidence |
| #383 | governed WhatsApp channel | implementation PR open |

## NEXT

| Issue | Work | Dependency |
|---|---|---|
| #301 | Web Capability Provider for MCF-WEB-* | follow #304 |
| #316 | Governed Shared Memory phases 3–6 | follow #164; no second write path |
| #290 / #284 / #229 / #283 | Cockpit family | reconcile into one canonical surface |
| #277 / #302 / #281 / #279 | Content Studio family | separate from runtime core |
| #379 | World Projection | projection/read-model-first |
| #195 | Hy4/TokenHub integration | controlled provider work |

## HUMAN_GATE / DESIGN

- #147 Architecture Convergence: implementation explicitly false; compatibility audit and separate authorization required.
- #141 Mission Control: discovery; implementation false.
- #165 NextGen reconciliation: planning; boundary decision pending.

## BLOCKED / EXTERNAL

- #378 WebGL-100: notebook/push dependency.
- #377 Phone/Drive cleanup: notebook/ADB dependency.
- #384 MMD 3D PDF: notebook-bound contract.
- #221 Cockpit sandbox incident: visual retest required.
- #359 Dual Browser expansion: notebook-bound contract.

## EXPERIMENTAL

- #350 Jev red-team harvest.
- #366 Jev boundary drill, dependent on #350.
- #345 Jev9 production-provenance audit.

## Side/project-specific

- #375 Pão Nosso V4.
- #205 Gama Fund: recorded deadline 2026-09-28; status requires reconciliation before treating G3 as current.

## Dependency conclusion

MCF v1.4.0
  -> lifecycle reconciliation (#372)
  -> web provider (#304) -> #301
  -> memory.write (#164) -> #316
  -> one concrete provider qualification
  -> durable run identity + evidence reconciliation
  -> separately governed promotion

The v1.4.0 Agent Contract does not itself activate Dots, ChatGPT Work, Codex, or another concrete provider.

## Rules

Cockpit issues are one reconciliation family, not four independent runtime priorities.
Memory #164 owns memory.write; #316 must not create a competing path.
Web #304 is the immediate provider path; #301 is the broader capability boundary.
Operational surfaces must consume canonical MCF state rather than create a second runtime or source of truth.

## Conclusion

The current core queue is:

#370 -> #372 -> #304 -> #164 -> #301 / #316 -> one concrete provider qualification against the v1.4.0 Agent Contract.

CLAIM <= EVIDENCE.
