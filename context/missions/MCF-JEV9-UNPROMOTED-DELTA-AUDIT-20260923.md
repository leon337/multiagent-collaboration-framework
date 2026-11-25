# MCF-JEV9-UNPROMOTED-DELTA-AUDIT-20260923

## Objective

Audit MCF changes that exist in GitHub but are not proven to be in production, using nine independent Jev evaluation lanes before any promotion decision.

## Authority boundary

- LEANDRO remains final human authority.
- Jev is advisory/evidence only.
- No Jev may merge, deploy, release, mutate production, or grant authorization.
- `OPEN`, `MERGED`, `main`, `CI_GREEN`, `RELEASED`, and `PRODUCTION` are distinct states.
- Production is read-only for this mission unless a later explicit HUMAN_GATE changes the boundary.

## Nine Jev lanes

1. Inventory and provenance — identify candidate PRs, merges and commits and bind exact SHAs.
2. Functional regression — test expected behavior and backward compatibility.
3. Security and authority — test fail-closed behavior, privilege and authorization boundaries.
4. HUMAN_GATE semantics — distinguish CONTINUE / RETRY / REQUEST_HUMAN / STOP.
5. Production compatibility — evaluate configuration, schema, migration and runtime assumptions without production mutation.
6. CI/workflow integrity — inspect exact-head workflows, artifacts, reproducibility and stale-green evidence.
7. Semantic divergence — compare candidate behavior against canonical MCF contracts and oracle expectations.
8. Reliability and latency — measure failures, timeout behavior, retries and tail latency.
9. Independent adversarial audit — challenge lanes 1–8, identify contradictions and issue a non-authoritative evidence verdict.

## Initial GitHub inventory

Open candidates observed at mission start include PRs #343, #321, #320, #319, #317, #315, #314, #312, #304 and additional older open/draft work. Inclusion in this list is not evidence that a candidate should merge or deploy.

## Execution protocol

For each candidate:

`exact SHA -> current PR state -> workflow evidence -> production-presence evidence -> 9 Jev lanes -> divergence record -> MESTRE synthesis -> HUMAN_GATE when promotion is proposed`

A candidate with unknown production presence remains `UNPROVEN_NOT_PROMOTED` rather than being inferred deployed or undeployed.

## Required outputs

- exact candidate inventory and SHA lineage;
- nine lane results per tested candidate or candidate class;
- safety metrics;
- latency/reliability metrics where executable;
- divergent IDs and explanations;
- failing workflow step/error when applicable;
- evidence artifact(s);
- final matrix separating `READY_FOR_HUMAN_REVIEW`, `BLOCKED`, `EXPERIMENTAL`, and `INSUFFICIENT_EVIDENCE` without automatically promoting anything.
