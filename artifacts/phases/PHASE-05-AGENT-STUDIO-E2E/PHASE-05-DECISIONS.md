# PHASE-05 — Decisions and gates

Mission: MCF-20261022-AGENT-STUDIO-MVP-001
Date: 2026-10-23T01:58:52-03:00
Risk: Class B

- MESTRE rejected the first test after stale behavior, even though file publication succeeded.
- Root cause was DSH asynchronous profile HMR; Studio now waits for fresh runtime proof before reporting success.
- Bad confirmation is denied. Correct authorization publishes the isolated Hello World preset only.
- Runtime proof returned from native DSH in session session-6abc0cc4-4a1b-4766-bd52-7574af497938.
- Posttest rollback confirmed byte-identical profile; user draft preserved.
- This is a technical acceptance, not an independent Emily or Beatriz audit. Such agent actions were not executed or simulated.
- Formal delegated Leo gate remains pending; the PR stays draft. No merge or public deployment.
