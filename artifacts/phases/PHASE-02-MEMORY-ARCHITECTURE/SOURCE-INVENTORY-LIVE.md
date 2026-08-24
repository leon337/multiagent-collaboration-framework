# Live source inventory — architecture input

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`
Owner: Mestre
Purpose: provide specialists a current, evidence-backed starting point without exposing private memory content or secrets.

## MCF canonical repository

- Repository: `leon337/multiagent-collaboration-framework`
- Main remains protected/PR-driven.
- Active mission issue: `#164`.
- Current Phase 2 documentation PR: `#169`.

## MCF runtime implementation recovered

Implementation root:
`apps/rede-social-agentes/apps/server/src/mcf-runtime/`

Verified behavior from repository code:

- mission/chat controllers and lifecycle are executable software;
- skill selection binds executable skill IDs to official agent identities;
- permission/evidence/receipt machinery exists;
- governed cognitive/internal skills consume validated `execution_evidence` supplied in inputs;
- Chat bridge executes bootstrap/planning work but does not itself originate specialist cognitive artifacts.

Therefore coordinator output cannot be treated as Sofia/Miriam/Ricardo/etc. work without a real distinguishable executor.

## MCF staging runtime

Render service recovered live earlier in this mission:

- service: `mcf-runtime-staging-api`;
- URL: `https://mcf-runtime-staging-api.onrender.com`;
- auto deploy: disabled;
- latest observed live deploy commit: `3d6367fb6a821c2e1b4acb7976aef82fac06daf5`.

This staging lineage is behind the mission candidate and cannot count as exact-SHA evidence until a governed staging promotion occurs.

## Cognitive Ledger repository/provider split

Repository: `leon337/cognitive-ledger`.

- default `main` is bootstrap-level;
- implementation line recovered from `design/cognitive-ledger-foundation`;
- Git is not the operational source of truth for private memory;
- new real memory remains in private Supabase/Postgres and is not automatically exported to public Git.

## Supabase/Postgres live provider

Provider state recovered earlier in the mission:

- project ref: `glyfavvwarffkkthpwlj`;
- name: `cognitive-ledger`;
- region: `sa-east-1`;
- status: `ACTIVE_HEALTHY`;
- PostgreSQL 17;
- aggregate state: 26 Eventos Cognitivos / 26 Fontes / 39 Relações;
- events with stored embedding at checkpoint: 0.

Existing data must be preserved.

## OAuth/live Edge Function

Earlier provider recovery established:

- `cognitive-ledger-api` live version 6;
- legacy Basic-auth boundary including `POST /registros`;
- transactional RPC write path already exists;
- OAuth `/v1` live is behind the newer repository read-only implementation;
- no live `cognitive-ledger.memory.write` capability exists;
- live code contains background embedding logic while mission policy requires explicit opt-in.

The live/repository drift remains an architecture blocker.

## External managed-agent executor — current verified state

Provider: Brainbase MCP.

- organization: `Leandro Carlos's Team`;
- team: `General`;
- official MCF managed-agent identities: **29/29 created**;
- private Phase 2 orchestration: `33296bb3-2020-43cf-8d62-e5c1d364f6b0`;
- selected Phase 2 chain: Mestre, Miriam, Sofia, Manoel, Ricardo, Júlia, Rafael, Eduardo, Bruno, Renato, Beatriz, Augusto, Emily, Léo;
- automatic schedules/triggers: none;
- billable task runs executed: none;
- real personal Ledger content sent to Brainbase: none;
- raw `fontes.conteudo_bruto` sent to Brainbase: none;
- provider secrets/tokens sent to Brainbase: none.

`GATE-RUNTIME-REALITY = SATISFIED_FOR_EXECUTOR_IDENTITY_AND_CONFIGURATION`.

Brainbase task execution is billable, so the next boundary is reserved human cost authorization:

`GATE-BRAINBASE-BILLABLE-RUN = PENDING_HUMAN_AUTHORIZATION`.

## Current architecture invariants

- preserve existing Ledger records;
- do not use public Git as a private-memory sink;
- reconcile deployed Edge Function v6 with repository design before live change;
- add a capability-limited OAuth write route rather than exposing `service_role` to MCF;
- prove read-back and Receipt before declaring a memory stored;
- separate normal supersession from privileged definitive deletion;
- ensure embedding behavior is explicit opt-in;
- attribute specialist artifacts only to real task executions;
- update/stage from an exact mission SHA before release evidence can be accepted.

No secret values or private memory payloads are stored in this artifact.
