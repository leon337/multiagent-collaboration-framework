# MCF World Read-Only Stack v0.5.1 — Known-Good Checkpoint

Mission: MCF-WORLD-PROJECTION-001

Baseline SHA:

    931877e4afbddf7f975073d878f6786e8415b842

Status:

    PASS — reproducible regression baseline over frozen/controlled inputs

Functional expansion:

    HOLD_PENDING_HUMAN_VALIDATION

Findability R:

    NOT_STARTED_DEFERRED

## One-command verification

    tools/world-model/verify_readonly_stack_v051.sh

The verifier reconstructs its temporary operational base and executes 12 stages.

## Exact baseline result

Observed on baseline SHA:

    READONLY_STACK_V051 PASS

Stages passed:

1. World Model contract + schema;
2. core adapter + deterministic rebuild;
3. generated adapter output schema;
4. Context Consumer v0.1;
5. Context Consumer v0.2;
6. full architecture pipeline;
7. real-source adapter;
8. operational base reconstruction;
9. Operational Context v0.1;
10. Context Navigation v0.3 + Source Preview v0.4;
11. Evidence Anchor v0.5 + v0.5.1 hardening + anchor metadata verifier;
12. scoped forbidden client primitive grep.

Core rebuild execution fingerprint observed:

    ad58e6485ddf7110ea389681ca75cc14b8771628283a2d493f05cbe7c68b2db2

This digest is recorded as the fingerprint of that controlled execution. It is not a universal World identity and is not currently asserted by the harness as a permanent expected constant.

## Reproducibility boundary

The checkpoint uses a frozen provider snapshot and fixed evaluation time for deterministic regression.

It proves:

    the same controlled inputs still satisfy the read-only architecture invariants

It does not prove:

    the external providers are currently in the same live state

Live freshness remains owned by the relevant source/provider and must be observed separately when needed.

## Known-good architecture chain

    canonical / owned source facts
      -> typed read-only adapters
      -> disposable ContextSlice / ProjectedObjects / AgentContextPacket
      -> Operational Context
      -> Decision
      -> observed Evidence
      -> digest-bound Source Preview
      -> explicit declared Anchor
      -> reversible presentation navigation

No layer above the canonical sources becomes operational truth.

## Hold point

The stack is technically complete enough for the current hypothesis.

Further product feature expansion is intentionally stopped until later human validation can test whether this chain actually reduces context-recovery effort.

Hardening, regression, security and documentation may continue without lifting the HOLD.
