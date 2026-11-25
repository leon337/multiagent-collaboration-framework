# PHASE-10 Decisions
1. Map each allowed preset to one canonical path and native DSH workspaceId.
2. Fail closed when a preset workspace is missing, never fallback to one generic cwd.
3. Do not change immutable historical Session headers. Preserve 17 prior sessions in Legado.
4. On migration, use new Brain/Lab sessions, retain old ids in private log, preserve Lab messages with context reset notice.
5. Sessions created manually in DSH can choose their own workspace; only Studio-originated sessions are enforced.
6. Explicit orchestration rather than implicit cross-workspace filesystem access.
7. No agent publication and no main merge without MCF governance gate.
