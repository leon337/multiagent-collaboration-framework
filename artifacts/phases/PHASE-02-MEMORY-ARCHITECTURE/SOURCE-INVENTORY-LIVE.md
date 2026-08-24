# Live source inventory — architecture input

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`
Owner of this artifact: Mestre
Purpose: provide specialists a current, evidence-backed starting point without exposing private memory content or secrets.

## MCF canonical repository

- Repository: `leon337/multiagent-collaboration-framework`
- Current canonical main after Phase 2 opening: `5fd36516f22f847495906f710d27dfb8976980ad`
- Main remains protected/PR-driven.
- Active mission issue: `#164`.
- Phase 2 opening PR: `#167`, merged after MCF Production Readiness success.
- Agent-execution gate/roster PR: `#168`, active when this inventory was written.

## MCF runtime implementation recovered

Implementation root:
`apps/rede-social-agentes/apps/server/src/mcf-runtime/`

Verified behavior from current repository code:

- mission/chat controllers and mission lifecycle are real executable software;
- skill selection binds executable skill IDs to official agent identities;
- permission/evidence/receipt machinery is implemented;
- external skills can remain pending until external evidence arrives;
- governed cognitive/internal skills consume validated `execution_evidence` supplied in inputs;
- Chat bridge automatically executes only the bootstrap/planning subset and leaves governed specialist work as `READY_AGENT`/equivalent pending work;
- this runtime therefore cannot by itself be treated as the cognitive originator of Sofia/Miriam/Ricardo/etc. artifacts.

## MCF staging runtime

Render service recovered live:

- service: `mcf-runtime-staging-api`
- Render service id: `srv-d9p1r6vlk1mc73a7gtj0`
- URL: `https://mcf-runtime-staging-api.onrender.com`
- auto deploy: disabled
- latest observed live deploy commit: `3d6367fb6a821c2e1b4acb7976aef82fac06daf5`

This live staging runtime is behind current MCF main and must not be used as exact-SHA evidence for the new mission until a governed staging promotion occurs.

## Cognitive Ledger repository/provider split

Repository: `leon337/cognitive-ledger`

- default `main` is bootstrap-level;
- implementation line recovered from `design/cognitive-ledger-foundation`;
- Git is not the operational source of truth for private memory;
- current mission policy: new real memory stays in private Supabase/Postgres and is not automatically exported to public Git.

## Supabase/Postgres live provider

Project recovered directly from provider tooling:

- project ref: `glyfavvwarffkkthpwlj`
- name: `cognitive-ledger`
- region: `sa-east-1`
- status: `ACTIVE_HEALTHY`
- PostgreSQL engine: `17`
- database release observed: `17.6.1.155`

Aggregate data state checked without reading private content:

- Eventos Cognitivos: `26`
- Fontes: `26`
- Relações: `39`
- events with non-null embedding: `0`
- events with non-null embedding model: `0`
- oldest event timestamp: `2026-08-21 03:50:00+00`
- newest event timestamp: `2026-08-22 12:36:00+00`

This confirms existing memory data that must be preserved and also confirms that no current event has a stored embedding at this checkpoint.

## OAuth client state

Aggregate check of `public.clientes_autorizados`:

- clients: `0`
- active clients: `0`
- capabilities currently present: none

Therefore no live MCF OAuth client/write capability can be inferred from the provider state.

## Live Edge Function

Provider tooling recovered:

- function: `cognitive-ledger-api`
- version: `6`
- status: `ACTIVE`
- `verify_jwt: false` because the function contains its own auth boundaries; this is not by itself proof of an exposure.
- live package digest: `5fda0451baeeaa0c07b2e6f5e31c67b25c0e0483e7e38e87065bcddf13b1a77e`

Observed live behavior from function source:

1. legacy boundary uses Basic auth backed by private configuration;
2. `GET /timeline` reads operational events;
3. `POST /registros` validates minimum event shape then calls transactional RPC `registrar_evento_cognitivo`;
4. ID collision is mapped to HTTP 409;
5. OAuth `/v1` authenticates a client but then currently returns `rota_nao_encontrada` instead of serving the newer repository read routes;
6. default OAuth capabilities in this live version are only `ler_diario`, `buscar_eventos`, `recuperar_contexto`;
7. no live `cognitive-ledger.memory.write` capability exists;
8. successful legacy writes schedule embedding indexing in the background;
9. the embedding implementation uses `OPENAI_API_KEY` when present and otherwise fails internally; it does not implement the newer explicit provider opt-in policy.

The mission must reconcile this live/code drift before any governed write activation.

## Embedding state and policy implication

Although live v6 contains background OpenAI embedding logic, the database aggregate currently shows `0/26` events with stored embeddings. This proves only the stored state, not whether failed/attempted external calls ever occurred.

The accepted v1.2.0 contract therefore requires:

- textual/structured search independent of vector search;
- external embedding provider disabled by default;
- explicit opt-in separate from the presence of an API key;
- no architecture assumption that embeddings are necessary for durable memory proof.

## Supabase advisors recovered

Security advisor currently reports informational `RLS enabled / no policy` notices for:

- `auditoria_acessos`
- `clientes_autorizados`
- `configuracao_privada`
- `eventos_cognitivos`
- `fontes`
- `relacoes`

This may be intentional for a service-role-only private backend, but Ricardo must determine whether it remains appropriate after the OAuth/read/write boundary is redesigned. It must not be automatically 'fixed' without threat-model context.

The advisor also reports `Leaked Password Protection Disabled` for Supabase Auth. This is a security input, not an automatic change authorization.

Performance advisor reports the HNSW embedding index as unused, consistent with the current `0` stored embeddings. This is not authorization to drop the index.

## Architecture blockers/invariants derived from live state

- preserve all 26/26/39 current records/relationships/sources;
- do not use public Git as a new private-memory sink;
- reconcile deployed Edge Function v6 with repository design before live change;
- add a capability-limited OAuth write route rather than exposing `service_role` to MCF;
- prove read-back and Receipt before telling the user a memory was stored;
- separate normal supersession from privileged definitive deletion;
- ensure embedding behavior is explicit opt-in;
- establish real named-agent execution before attributing specialist artifacts;
- update/stage from an exact mission SHA before release evidence can be accepted.

No secret values or private memory payloads were read into this artifact.
