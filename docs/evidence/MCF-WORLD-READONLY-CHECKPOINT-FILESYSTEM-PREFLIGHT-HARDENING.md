# MCF World Read-Only Checkpoint — Filesystem Preflight Hardening

Mission: MCF-WORLD-PROJECTION-001
Scope: technical/environment hardening only
Functional expansion: HOLD_PENDING_HUMAN_VALIDATION

## Purpose

Extend the existing disk-space preflight so the checkpoint distinguishes additional filesystem failures before creating its temporary workspace.

This responds to environmental failure modes explicitly noted in prior gates:

- invalid TMPDIR;
- non-writable TMPDIR;
- inode exhaustion.

No product semantics changed.

## New preflight checks

Before mktemp, the checkpoint now verifies:

1. MCF_WORLD_MIN_FREE_BYTES is a non-negative integer;
2. MCF_WORLD_MIN_FREE_INODES is a non-negative integer;
3. TMPDIR resolves to an existing directory;
4. TMPDIR is writable and searchable;
5. available bytes are measurable;
6. available inodes are measurable;
7. available bytes meet the configured minimum;
8. available inodes meet the configured minimum.

Default thresholds:

    MCF_WORLD_MIN_FREE_BYTES = 67108864
    MCF_WORLD_MIN_FREE_INODES = 128

Exit codes:

    2 = invalid preflight configuration/environment
    3 = insufficient free bytes
    4 = insufficient free inodes

## Fail-closed negative tests

test_readonly_checkpoint_preflight.sh now verifies:

- impossible free-byte requirement -> exit 3;
- nonnumeric byte threshold -> exit 2;
- nonnumeric inode threshold -> exit 2;
- impossible free-inode requirement -> exit 4;
- TMPDIR pointing to a regular file -> exit 2;
- non-writable TMPDIR -> exit 2.

For every negative case:

    no mcf-world-readonly-v051.* workspace is created

## Successful regression after hardening

Observed preflight:

    preflight_free_bytes = 882724864
    preflight_min_free_bytes = 67108864
    preflight_free_inodes = 5862232
    preflight_min_free_inodes = 128

Result:

    READONLY_CHECKPOINT_PREFLIGHT_TEST PASS
    READONLY_STACK_V051 PASS
    checkpoint_temp_dirs = 0

All existing 12 regression stages passed.

## Boundary

This is an environmental guard only.

It does not prove:
- bytes/inodes are reserved after the check;
- concurrent consumers cannot exhaust the filesystem;
- quotas or later I/O cannot fail.

It adds no:
- World object;
- relation;
- navigation;
- search/discovery;
- inference;
- authority;
- persistence;
- mutation;
- production;
- 3D behavior.
