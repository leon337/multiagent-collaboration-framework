# MCF World 3D — Web-first Hosted Mission

Status: `IN_PROGRESS`
Issue: #324
Branch: `mission/mcf-world-web-first-2026-09-23`

## Goal

Transform MCF World 3D into a web-first hosted application that runs on Windows 10 and Linux through modern browsers, while retaining an optional Electron desktop shell for native/browser-surface capabilities.

## Authority boundary

LEANDRO explicitly authorized continuous execution without intermediate continuation gates for this mission. Reversible planning, code, tests, documentation, branch and PR preparation are inside the boundary. Irreversible/external publication actions outside this boundary are excluded unless separately authorized.

## Constraints

- The notebook and desktop that contain the previous local workspace are powered off.
- Previous Task 6 local changes are not available for inspection and must not be reconstructed as if exact.
- Hosted/web work must remain independent of those machines.
- Windows 10 and Linux are first-class targets.
- Electron becomes an optional shell, not the application core.

## Mission phases

1. Reconcile current MCF governance.
2. Discover versioned MCF World assets/code.
3. Produce web-first architecture/specification.
4. Produce implementation plan.
5. Implement all work possible without the offline notebook.
6. Validate with evidence.
7. Prepare review/PR and document remaining host-dependent reconciliation.
