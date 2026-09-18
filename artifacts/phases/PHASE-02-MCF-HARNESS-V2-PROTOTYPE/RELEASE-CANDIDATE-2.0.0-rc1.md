# MCF Harness V2 — Release Candidate 2.0.0-rc1

Status: `READY_WITH_FORMAL_DEFERMENTS`

## Technical gates

- R0 governance: PASS
- R1 reverse engineering: PASS
- R2 durable runtime: PASS_PROTOTYPE
- R3 local technical fan-out: PASS
- R4 executor interface/crash recovery: PASS; G08 cognitive backend blocked
- R5 durable sessions: PASS_INFRASTRUCTURE
- R6 workspace/capabilities: PASS_PROTOTYPE
- R7 technical adversarial audit: PASS_TECHNICAL
- R8 clean-store/clean-workspace recovery: PASS_TECHNICAL
- R9 telemetry/adaptive policy: PASS_TELEMETRY
- R10: HUMAN_GATE

## Formal deferments

1. `G08/L02`: no independent bubble-native cognitive LLM backend is verified.
2. `M09`: fresh-process/workspace recovery is proven; a separate ChatGPT conversation must be initiated by the human/product surface.
3. `P05`: no authoritative V1 packet schema was located in the repository/search basis. A V1→V2 contract will not be fabricated.

## Promotion

Do not merge/promote stable until LEANDRO explicitly accepts these deferments or the blockers are resolved.
