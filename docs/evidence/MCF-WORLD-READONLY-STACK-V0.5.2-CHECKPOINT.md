# MCF World Read-Only Stack v0.5.2 — Known-Good Hardening Checkpoint

Mission: MCF-WORLD-PROJECTION-001

Baseline SHA:

    daf94d2fdae90c04c96dfc7d84b3c92757aabf28

Status:

    PASS — reproducible regression baseline over frozen/controlled inputs

Functional expansion:

    HOLD_PENDING_HUMAN_VALIDATION

Findability R:

    NOT_STARTED_DEFERRED

## Verification

Command:

    tools/world-model/verify_readonly_stack_v051.sh

Exact-SHA result:

    READONLY_STACK_V051 PASS

All 12 stages passed with a clean working tree.

Core controlled rebuild fingerprint observed:

    f29ffbdef9fe2421a6c6d95db39086391d009b0412d7579f9a682ea7536ec22d

This fingerprint identifies that controlled execution only. It is not a universal World identity, live-state proof or Product GO signal.

## v0.5.2 delta

The anchor runtime now rejects every structural condition already rejected by the gated metadata schema:

- wrong schema identifier;
- additional document fields;
- additional anchor fields;
- non repo-file source type;
- additional declaredBy fields;
- empty provenance strings;
- boolean line numbers.

The existing v0.5.1 security and fail-closed behavior remains.

## Operational note

During the first exact-SHA verification attempt the notebook root filesystem reached ENOSPC.

Only mission-owned temporary files under /tmp were removed.

After cleanup:

    approximately 259 MB free remained on /

The exact-SHA checkpoint was then rerun successfully.

This disk-space observation is an operational environment constraint, not a World architecture failure.

## Hold point

No v0.6 functional work is authorized.

Continue only:
- hardening;
- regressions;
- security;
- documentation;

until later human validation.
