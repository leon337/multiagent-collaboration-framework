# MCF World Read-Only Checkpoint — Filesystem Preflight Gate

Audited SHA: 1fba6a814d5541f3a9f04c0eb6caf48451ab050b

## Sofia

Verdict: PASS.

The delta remains strictly environmental/defensive hardening.

Verified sequence:

    threshold validation
      -> TMPDIR exists/is directory
      -> writable + searchable
      -> measure free bytes
      -> measure free inodes
      -> byte threshold
      -> inode threshold
      -> mktemp
      -> existing 12-stage checkpoint
      -> EXIT cleanup

Exit codes distinguish:
- 2: invalid configuration/environment;
- 3: insufficient free bytes;
- 4: insufficient free inodes.

The negative suite verifies no mcf-world-readonly-v051.* workspace is created before abort.

Qualification:

- df -PB1 / df -Pi and permission checks assume a POSIX/GNU-like environment;
- the thresholds are operational guards, not architectural requirements;
- the preflight does not reserve bytes/inodes;
- quotas, ACLs, concurrency and later I/O failures remain possible.

## Emily

Verdict: PASS — environment/test-harness hardening only.

Critical: none.
High: none.
Medium blocking: none.

Verified:
- cleanup remains limited to the directory created by the checkpoint's own mktemp;
- threshold values accept digits only and are not evaluated as shell;
- TMPDIR is quoted and only selects the parent;
- inode availability is an observation, not a reservation;
- the preflight has an unavoidable TOCTOU window;
- the later 12/12 regression PASS remains the completion evidence.

No World semantics changed.

## Boundary

Functional expansion remains:

    HOLD_PENDING_HUMAN_VALIDATION

Findability R remains:

    NOT_STARTED_DEFERRED

This gate authorizes no product feature.

Allowed:
- targeted hardening;
- regression;
- security;
- documentation.

Not authorized:
- Product GO;
- new functionality;
- persistent service;
- mutation;
- production;
- 3D.
