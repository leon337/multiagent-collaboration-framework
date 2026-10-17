# Offline Git Bundle Import — ChatGPT Bubble Executor

Status: **IMPLEMENTED FOR IMPORT ONLY**  
Associated tracking: [Issue #445](https://github.com/leon337/multiagent-collaboration-framework/issues/445)

## Problem

The ChatGPT session sandbox may have `git` available but no outbound DNS/HTTPS. An authorized, connected external executor may successfully clone a repository, but that clone is **not** physically inside the ChatGPT session sandbox. A `git bundle` can preserve the Git objects for an offline checkout **after** an authorized transport delivers the bundle into the sandbox.

## Boundary 1: Authorized external archive creation

From an **authorized** repository checkout, use the real Git CLI:

```bash
git bundle create /path/to/repo.bundle --all
sha256sum /path/to/repo.bundle
git rev-parse HEAD
```

Do not publish a private repository bundle at a public URL. Do not assume an external runner's filesystem and the ChatGPT sandbox share the same mount.

## Boundary 2: Transport

An authenticated file-transfer channel must deliver the **exact bytes** of `repo.bundle` to the ChatGPT session sandbox. This repository does not currently implement that transport.

Until a transfer is verified, record:

```text
BUNDLE_TRANSPORT_NOT_VERIFIED
SANDBOX_CLONE_NOT_MATERIALIZED
```

Do not declare a clone success based on an external machine's `git clone` result or based on the presence of an importer script alone.

## Boundary 3: Offline import and validation

Once `/mnt/data/repo.bundle` is verified by source+destination SHA-256:

```bash
bash ops/bubble-executor/import-git-bundle.sh \
  /mnt/data/repo.bundle \
  /mnt/data/target-repository \
  EXPECTED_40_CHARACTER_COMMIT_SHA \
  https://github.com/owner/repo.git
```

The importer fails closed for missing/invalid bundles, preexisting destinations, invalid expected SHA, and a mismatch between `git rev-parse HEAD` and the expected SHA. It clones to an isolated staging directory, then moves to the final path only after the checks pass. It does not access external networks, install packages, alter the source repository, or publish anything.

## Tests

```bash
bash tests/bubble-executor/test-import-git-bundle.sh
```

The test suite validates: success with a synthetic two-commit Git bundle, missing bundle, occupied destination, mismatched SHA and invalid bundle. The CI workflow runs these tests on the affected PR.

**Proof restriction:** these tests prove the importer, not the end-to-end transfer channel. A real sandbox clone requires a successful artifact transport and a post-import receipt from inside the actual sandbox.
