# MCF World Read-Only Checkpoint — Disk Preflight Hardening

Mission: MCF-WORLD-PROJECTION-001
Scope: technical checkpoint hardening only
Functional expansion: HOLD_PENDING_HUMAN_VALIDATION

## Trigger

A previous exact-SHA regression run failed with:

    OSError: [Errno 28] No space left on device

The architecture itself had not failed. The checkpoint lacked an environmental preflight and discovered ENOSPC only after tests had started writing temporary output.

## Change

verify_readonly_stack_v051.sh now checks the filesystem used for temporary work before creating the checkpoint workspace.

Default minimum free space:

    67108864 bytes
    64 MiB

Override for controlled environments:

    MCF_WORLD_MIN_FREE_BYTES

Temporary parent:

    TMPDIR when supplied
    otherwise /tmp

The checkpoint prints:

- preflight_tmp_parent;
- preflight_free_bytes;
- preflight_min_free_bytes.

## Fail-closed behavior

If the threshold is not a non-negative integer:

    exit 2

If available bytes are below the threshold:

    exit 3

In both cases the checkpoint aborts before creating its mcf-world-readonly-v051 temporary workspace.

## Temporary workspace ownership

Checkpoint temporary directories now use the explicit prefix:

    mcf-world-readonly-v051.*

The existing EXIT trap removes the workspace.

A post-run assertion confirmed no prefixed workspace remained after the normal successful checkpoint.

## Executed negative tests

test_readonly_checkpoint_preflight.sh verifies:

1. an artificially impossible free-space requirement returns exit 3;
2. the error contains "insufficient free space";
3. no checkpoint workspace is created before abort;
4. an invalid nonnumeric threshold returns exit 2;
5. no checkpoint workspace is created in that case either.

Result:

    READONLY_CHECKPOINT_PREFLIGHT_TEST PASS

## Normal regression after hardening

Observed free bytes before the successful run:

    270635008

Configured minimum:

    67108864

Result:

    READONLY_STACK_V051 PASS

All 12 existing stages passed.

## Boundary

This change adds no product capability.

No change to:
- World objects;
- relations;
- adapters semantics;
- navigation;
- evidence/source/anchor semantics;
- Findability R;
- Product GO;
- mutation;
- service architecture;
- production;
- 3D.

It only converts a known environmental ENOSPC failure mode into an early explicit diagnostic.
