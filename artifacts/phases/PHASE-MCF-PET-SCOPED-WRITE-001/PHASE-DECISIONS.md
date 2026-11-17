# Architectural boundaries
- No permission from voice/model-generated JSON or proposal review state.
- Exact mission UUID, operation, resource, expiry and gate are required.
- Default without a connected PermissionEngine verifier is DENY.
- No arbitrary path; notes restricted to a private workspace.
- Idempotent receipts SHA256, rollback checks digest and uses a tombstone.
- Playwright access is limited to read-only tab listing under permission.
- Pet can request dry-run, never actual execution in this phase.
- Capability Registry record is inactive and not authorized.
- Production runtime, browser clicks, public actions and HUMAN_GATE unchanged.
