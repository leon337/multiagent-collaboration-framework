# MCF Content Studio N4 — Asset & License Policy

## Scope

Applies to visual assets, audio, fonts, code-derived components and Remotion runtime usage in mission `MCF-CONTENT-STUDIO-N4-001`.

## Canonical rules

1. Render canônico não depende de asset remoto em runtime.
2. Every non-MCF asset records:
   - source URL;
   - pinned revision or immutable identifier;
   - license;
   - evidence;
   - attribution requirement;
   - modification note.
3. Generated assets record generator/model and prompt provenance when retained.
4. Fonts are referenced by license and family; font binaries are never distributed as mission evidence.
5. Unknown license = not approved.
6. "Free to download" is not interpreted as permission to redistribute.
7. External code components follow the governed importer.
8. Assets with attribution requirements preserve notices in `THIRD_PARTY_NOTICES.md`.
9. Production render uses local/static assets or controlled artifact storage.
10. Temporary preview URLs are not a source of truth.

## Remotion licensing

The N4 experiment pins Remotion packages, but package availability does not itself establish commercial-use entitlement.

Before promotion from `experimentos/` to a production application:
- review the current official Remotion license;
- determine whether the intended organization/use case requires a commercial/company license;
- record the decision and evidence in the phase pack.

Until that review, Remotion is approved for this experimental branch only, not asserted as commercially cleared for every future deployment.

## Asset lifecycle

`DISCOVERED → REVIEWED → LICENSED → ADAPTED → APPROVED → DEPRECATED`

Only APPROVED assets may be auto-selected by production templates.
