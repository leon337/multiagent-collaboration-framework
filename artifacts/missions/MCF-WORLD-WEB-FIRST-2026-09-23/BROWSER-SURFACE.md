# Browser Surface Capability Split (draft)

World logic must call a platform-neutral navigation interface.

## Web adapter

- embed only when the destination permits framing;
- otherwise present a controlled external/open-new-context fallback and a clear return-to-world path;
- never bypass CSP/X-Frame-Options.

## Electron adapter

- use the secured desktop browser-surface flow already proven by the earlier local mission;
- keep IPC/security boundaries outside the shared world engine;
- reconcile exact implementation when the offline host returns.
