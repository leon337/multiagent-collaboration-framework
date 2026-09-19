# MCF Content Studio N4 — Preflight Boundary

**Mission:** `MCF-CONTENT-STUDIO-N4-EVOLUTION-001`

## Role

Instavar remains an editorial/preflight system in the architecture. N4 does not silently assume that its internal lesson schema is identical to whatever Instavar MCP contract is active at runtime.

The executable boundary is:

```text
N4 TechnicalLessonSpec
        ↓
local preflight
        ↓
adapter-neutral payload
        ↓
external preflight/storyboard tool when available
        ↓
returned findings
        ↓
N4 correction
        ↓
render
```

## Local rules implemented

- title density;
- visual variety;
- narration timeline coverage;
- missing narration cues;
- scene headline density;
- scene body density;
- too many list-like items;
- extremely short scene duration;
- internal production-label leak.

## Non-claim

This module does **not** claim full Instavar schema/API compatibility.

Before calling an actual Instavar tool, the active tool contract must be inspected and the adapter adjusted to it.

That distinction is intentional governance, not missing functionality.
