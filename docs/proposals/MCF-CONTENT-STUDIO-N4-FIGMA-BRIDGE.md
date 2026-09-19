# MCF Content Studio N4 — Figma Bridge Contract

**Mission:** `MCF-CONTENT-STUDIO-N4-EVOLUTION-001`

## Purpose

The bridge converts a concrete Figma component/node plus token snapshot into a versioned intermediate specification that can be reviewed before React/Remotion implementation.

```text
FIGMA NODE
  ↓ get_design_context / variables
BRIDGE SPEC
  ├─ source identity
  ├─ token snapshot
  ├─ component dimensions
  ├─ editable props
  └─ token bindings
  ↓
N4 COMPONENT DEFAULTS / CONFLICT REPORT
  ↓
REACT + REMOTION
```

## Governance

A bridge spec is not considered `FIGMA_DERIVED` unless:
- a real `fileKey` and `nodeId` are recorded;
- design context was read from Figma;
- token conflicts were reconciled;
- screenshot/metadata validation exists.

The committed `bridge.placeholder.json` is deliberately marked as a contract fixture, not Figma evidence.

## Current external dependency

The authenticated Figma account exposes multiple writable plans. The Figma connector requires an explicit target plan/file and forbids guessing when multiple plans exist.

Therefore:
- bridge implementation: IMPLEMENTED;
- schema/tests: IMPLEMENTED;
- real Figma-derived component proof: BLOCKED_BY_AMBIGUOUS_EXTERNAL_TARGET.

This blocker does not stop other N4 evolution waves.
