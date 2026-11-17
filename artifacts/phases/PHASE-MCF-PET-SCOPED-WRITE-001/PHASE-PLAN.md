# MCF-PET-SCOPED-WRITE-001 Plan
Authority: LEANDRO. Orchestrator: MESTRE. Operational gate: LEO.
References: MCF DEC-052 / DEC-055, PermissionEngine and HDF.

Goal: create a bounded reversible-write adapter, never broad shell access.
Scope: private notes only; browser.tabs.read only by explicit scope.
API surface: preview-only for Pet, no write/rollback exposed in Live.
Real activation requires canonical mission, trusted verifier and gates.
Local tests use synthetic grants in isolated temporary directories only.
