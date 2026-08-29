# MCF Mission Control — GPT Action staging bridge

Status: `IMPLEMENTATION_CANDIDATE — STAGING ONLY`

This boundary lets an explicitly configured GPT Action create a canonical MCF
mission without using an OpenAI API key. `MCF_MISSION_CONTROL_TOKEN` is an
opaque authentication secret for this API only; it has no AI-token billing.

## Fixed boundary

- `POST /v1/mcf/mission-control/dispatch` calls the existing deterministic chat
  planner/runtime and only auto-executes its internal bootstrap.
- External phases remain `READY_AGENT` or `READY_EXTERNAL` and continue to
  require their existing evidence, permissions and human gates.
- `GET /v1/mcf/mission-control/latest` is read-only and returns one composed
  mission/timeline/observability snapshot.
- Both routes require the dedicated Bearer credential.
- Prompts, internal reasoning, passwords and tokens are not copied into the
  event ledger. The objective and declared operational metadata are canonical
  mission inputs.

The Action schema is
[`MCF-MISSION-CONTROL-GPT-ACTION.openapi.yaml`](MCF-MISSION-CONTROL-GPT-ACTION.openapi.yaml).
Its server is deliberately staging. Production promotion is outside this
candidate and requires a separate gate.
