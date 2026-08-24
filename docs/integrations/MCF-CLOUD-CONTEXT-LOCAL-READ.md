# MCF → Cloud context local read

## Boundary

`GET /v1/mcf/context/cloud/g2a` is a local, evidence-only Context Fabric read. It asks the
Cloud-owned CLI for the fixed `context.get` projection over a disposable
`leon337/g2a-smoke/dev` layout.

This adapter does **not** connect to NODE-01, SSH, the VPS, staging or production. It does not
turn the remote `cloud.workspace.g2a.read` capability into a live connection. Operational Cloud
state remains `LIVE_REQUIRED` until separately observed through its own authorized transport.

The endpoint has its own ingress secret and accepts it only through
`x-mcf-cloud-context-token`. `MCF_CLOUD_CONTEXT_INGRESS_TOKEN` must be 32–4096 characters and must
differ from `MCF_CONTEXT_READ_TOKEN`, `MCF_COGNITIVE_LEDGER_INGRESS_TOKEN` and
`MCF_COGNITIVE_LEDGER_BEARER_TOKEN`. It must have exact untrimmed identity and cannot contain CR,
LF or commas. Reusing any Context/TriView/Ledger secret disables the Cloud adapter. The HTTP guard
also requires exactly one raw `x-mcf-cloud-context-token` occurrence; arrays, coalesced values and
duplicates fail closed.

The endpoint is disabled when its dedicated token or `MCF_CLOUD_CONTEXT_READ_CONFIG_JSON` is
absent or invalid. A successful response is marked `read_only: true`, `material_action: false`,
`provider_payload_persisted_by_mcf: false` and `evidence_only: true`. The narrower name distinguishes
provider-payload persistence from the AppModule's expected HMAC abuse counter.

## Fixed request

The HTTP client supplies no operation, command, path, URL or environment. MCF creates exactly one
newline-terminated request:

```json
{
  "protocol": "MCF_CLOUD_CONTEXT_READ_V1",
  "request_id": "MCF-CLOUD-<generated UUID>",
  "project_id": "cloud-infrastructure",
  "operation": "context.get",
  "arguments": {}
}
```

The provider is started directly, without a shell, as:

```text
<exact canonical python3 executable> -I platform/control-bridge/mcf-cloud-context-read
```

Its working directory is the exact configured disposable root. Its environment contains only
`MCF_CLOUD_CONTEXT_READ_ENABLE=DISPOSABLE_LOCAL_LAB_ONLY`.

## Configuration allowlist

The JSON configuration is strict and bounded. The values below are placeholders, not a usable
configuration:

```json
{
  "enable": "DISPOSABLE_LOCAL_LAB_ONLY",
  "repository_root": "/absolute/disposable/workspaces/leon337/g2a-smoke/dev",
  "python_executable": "/absolute/copies-venv/bin/python3.12",
  "python_executable_sha256": "<lowercase SHA-256>",
  "expected_verified_file_sha256": {
    ".mcf/project-capsule.yaml": "<lowercase SHA-256>",
    "context/mcf-cloud-context.yaml": "<lowercase SHA-256>",
    "control_plane/__init__.py": "<lowercase SHA-256>",
    "control_plane/g2a/__init__.py": "<lowercase SHA-256>",
    "control_plane/g2a/local_context_adapter.py": "<lowercase SHA-256>",
    "platform/control-bridge/mcf-cloud-context-read": "<lowercase SHA-256>",
    "platform/control-bridge/mcf-cloud-context-read-config.yaml": "<lowercase SHA-256>",
    "platform/manifests/g2a-smoke.yaml": "<lowercase SHA-256>",
    "platform/schemas/mcf-cloud-context-read-config.schema.json": "<lowercase SHA-256>",
    "platform/schemas/mcf-cloud-context-read-result.schema.json": "<lowercase SHA-256>",
    "platform/schemas/mcf-cloud-context.schema.json": "<lowercase SHA-256>",
    "platform/schemas/mcf-project-capsule.schema.json": "<lowercase SHA-256>",
    "platform/schemas/project.schema.json": "<lowercase SHA-256>",
    "scripts/yaml_strict.py": "<lowercase SHA-256>",
    "state/control-bridge-g2a.yaml": "<lowercase SHA-256>",
    "state/control-bridge-g2b.yaml": "<lowercase SHA-256>"
  }
}
```

The Python executable must be a canonical, non-symlinked executable named `python3` or a versioned
`python3.x`, have ELF identity and match its configured SHA-256. A virtual environment created with
`python3 -m venv --copies` keeps that executable inside the controlled runtime root. The adapter
never installs dependencies.

The exact 16-file MCF allowlist comprises 13 paths reported by the Cloud provider's provenance plus
the three additional Python files executed/imported by that CLI:
`control_plane/__init__.py`, `control_plane/g2a/__init__.py` and `scripts/yaml_strict.py`. Every one
must be a non-symlinked regular file below the configured root and match its configured SHA-256
before and after execution. MCF validates the provider response against the hash-bound result
schema, independently recomputes its 13 reported provenance digests, and separately proves the
three execution dependencies unchanged. Owned import directories containing `__pycache__`, `.pyc`
or `.pyo` artifacts are refused before spawn and after exit.

### Python runtime trust boundary

`-I`, the hash-bound ELF, the 16-file repository closure and cache refusal constrain the adapter's
own code. They do **not** prove the complete supply chain of Python's standard library,
site-packages, native extensions or their transitive dependencies. Those remain a controlled
runtime trusted computing base (TCB). In the lab E2E, the complete copied venv tree is fingerprinted
before and after, every regular file/directory must be owned by the E2E user (when UID is available)
and must not be group/world writable. The standard library outside that venv remains residual TCB;
no production-level supply-chain claim is made. The provider's Python audit hook is defense in
depth, not an operating-system sandbox; a hostile same-UID process or compromised host remains
outside this disabled-by-default local-lab boundary.

## Limits and failure behavior

- stdin: 4 KiB;
- stdout: 64 KiB;
- stderr: 4 KiB;
- each verified provider/execution file: 256 KiB;
- Python executable: 64 MiB;
- execution timeout: 20 seconds;
- forced termination settlement: 1 second after `SIGKILL`;
- global abuse policy for this exact GET route: 10 requests/minute per HMAC-hashed direct socket
  peer; client-selected `Authorization` and forwarded request IP values cannot split the bucket;
- per-MCF-process bulkhead: one active Cloud child; excess work fails immediately with `503`.

Any drift, symlink, invalid schema, response mismatch, stderr output, non-zero exit, timeout or
limit excess fails closed. Public errors never include the configured root, executable, child
output, any Context/Cloud/Ledger secret or raw provider response. Responses use
`Cache-Control: private, no-store`. The one-second post-`SIGKILL` grace guarantees bounded Promise
settlement even for an injected child that never emits `close`; that synthetic guarantee is not an
OS-process cleanup claim. The real E2E separately proves the actual child PID is gone.

## Real local E2E

The committed real E2E is skipped unless its external Cloud source and exact revision are supplied.
It copies only the provider contract into a disposable suffix-compatible layout; it never invokes
VPS or SSH.

```bash
PATH=/absolute/node-v24.18.0/bin:/usr/local/bin:/usr/bin:/bin \
MCF_CLOUD_CONTEXT_E2E_SOURCE_ROOT=/absolute/path/to/cloud-feature-worktree \
MCF_CLOUD_CONTEXT_E2E_SOURCE_REVISION=<exact-40-character-SHA> \
MCF_CLOUD_CONTEXT_TEST_PYTHON=/absolute/copies-venv/bin/python3.12 \
MCF_CLOUD_CONTEXT_E2E_ADMIN_DATABASE_URL=<synthetic-lab-admin-url> \
pnpm --filter @rsa/server exec vitest run \
  src/mcf-context/mcf-cloud-context-read.real-e2e.test.ts --reporter=verbose
```

The harness creates a uniquely named database in an already-running shared lab PostgreSQL,
applies the repository migrations, starts the full `AppModule` on an ephemeral loopback port and
drops only that database during teardown. It asserts the Vitest worker itself is Node.js 24.18.0,
replaces inherited `process.env` with an exact allowlist and isolated temporary `HOME`, then restores
the original environment completely. It never stops or removes the shared container.

The test proves the real sequence MCF `AppModule` HTTP → global abuse guard → dedicated Cloud
guard/controller → one-child bulkhead → bounded process adapter → Cloud CLI → Cloud schemas/state.
It proves the Context/TriView and both Ledger keys cannot open the Cloud route, duplicate raw Cloud
headers fail at the HTTP/guard boundary, query/path injection and non-GET methods fail before
execution, and no absolute configuration, token or provider payload reaches the response, logs or
MCF stores. Eleven requests carrying the correct Cloud ingress token and eleven different synthetic
Bearer values remain in one direct-peer bucket; the eleventh is rejected with `429` before a child
can start. All non-abuse database tables remain byte-semantically identical; the only expected
application write is the opaque HMAC technical counter in `abuse_rate_limits`. The 16-file closure,
disposable tree, original repositories and controlled venv fingerprints remain unchanged, the
actual child process and ephemeral HTTP listener close, and the unique database is absent after
teardown. The committed credential strings are synthetic fixtures, not real secrets; the E2E proves
that neither repository's Git fingerprint changes during execution.

After teardown the connection is truthfully `DISCONNECTED`, runtime is `INACTIVE`, and the E2E is
only historical lab evidence. It says nothing about NODE-01/VPS freshness or production.
