# Architecture and security decisions

1. Keep MESTRE Agent identity and memory. Do not create a parallel AI agent.
2. Support separate scopes: conversation (default) and read_only (opt-in).
3. Sign ticket scopes in HMAC v2; v1 accepted only as conversation.
4. Only fixed local GET endpoints; service name allowlist; strict arg schema.
5. Allowlist five functions only; cap 12 calls/session, four/message and data size.
6. Return verified tool results to Gemini via toolResponse; emit UI audit status.
7. The provider receives filtered telemetry on opt-in; disclose explicitly.
8. Log receipt metadata only, owner-only 0600; fail closed if audit unavailable.
9. Recover audio after a silent tool turn with a bounded text followup.
10. Preserve all MissionRuntime, HDF, permission gates and tools with effects.
11. Read-only status is not approval, authorization, or proof of task success.
12. Further tool classes require an independent governed phase.
