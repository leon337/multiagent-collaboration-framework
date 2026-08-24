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
differ from `MCF_CONTEXT_READ_TOKEN`, the key used by recovery/capabilities clients such as
TriView. Reusing the general Context token disables the Cloud adapter; presenting that token at
either header never opens this route.

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
  "expected_source_sha256": {
    ".mcf/project-capsule.yaml": "<lowercase SHA-256>",
    "context/mcf-cloud-context.yaml": "<lowercase SHA-256>",
    "control_plane/g2a/local_context_adapter.py": "<lowercase SHA-256>",
    "platform/control-bridge/mcf-cloud-context-read": "<lowercase SHA-256>",
    "platform/control-bridge/mcf-cloud-context-read-config.yaml": "<lowercase SHA-256>",
    "platform/manifests/g2a-smoke.yaml": "<lowercase SHA-256>",
    "platform/schemas/mcf-cloud-context-read-config.schema.json": "<lowercase SHA-256>",
    "platform/schemas/mcf-cloud-context-read-result.schema.json": "<lowercase SHA-256>",
    "platform/schemas/mcf-cloud-context.schema.json": "<lowercase SHA-256>",
    "platform/schemas/mcf-project-capsule.schema.json": "<lowercase SHA-256>",
    "platform/schemas/project.schema.json": "<lowercase SHA-256>",
    "state/control-bridge-g2a.yaml": "<lowercase SHA-256>",
    "state/control-bridge-g2b.yaml": "<lowercase SHA-256>"
  }
}
```

The Python executable must be a canonical, non-symlinked executable named `python3` or a versioned
`python3.x`, have ELF identity and match its configured SHA-256. A virtual environment created
with `python3 -m venv --copies` preserves this boundary while allowing the Cloud repository's
pinned local dependencies. The runtime never installs dependencies.

Every provider source must be a non-symlinked regular file below the configured root and match the
complete 13-file hash allowlist before and after execution. The returned provider schema is loaded
from that same hash-bound root. MCF validates the response against it and independently recomputes
all 13 provenance digests.

## Limits and failure behavior

- stdin: 4 KiB;
- stdout: 64 KiB;
- stderr: 4 KiB;
- each provider source: 256 KiB;
- Python executable: 256 MiB;
- execution timeout: 20 seconds;
- forced termination settlement: 1 second after `SIGKILL`.

Any drift, symlink, invalid schema, response mismatch, stderr output, non-zero exit, timeout or
limit excess fails closed. Public errors never include the configured root, executable, child
output, either ingress token or raw provider response. Responses use
`Cache-Control: private, no-store`.

## Real local E2E

The committed real E2E is skipped unless its external Cloud source and exact revision are supplied.
It copies only the provider contract into a disposable suffix-compatible layout; it never invokes
VPS or SSH.

```bash
MCF_CLOUD_CONTEXT_E2E_SOURCE_ROOT=/absolute/path/to/cloud-feature-worktree \
MCF_CLOUD_CONTEXT_E2E_SOURCE_REVISION=<exact-40-character-SHA> \
MCF_CLOUD_CONTEXT_TEST_PYTHON=/absolute/copies-venv/bin/python3.12 \
MCF_CLOUD_CONTEXT_E2E_ADMIN_DATABASE_URL=<synthetic-lab-admin-url> \
pnpm --filter @rsa/server exec vitest run \
  src/mcf-context/mcf-cloud-context-read.real-e2e.test.ts --reporter=verbose
```

The harness creates a uniquely named database in an already-running shared lab PostgreSQL,
applies the repository migrations, starts the full `AppModule` on an ephemeral loopback port and
drops only that database during teardown. It never stops or removes the shared container.

The test proves the real sequence MCF `AppModule` HTTP → global abuse guard → dedicated Cloud
guard/controller → bounded process adapter → Cloud CLI → Cloud schemas/state. It also proves the
TriView/general Context key cannot open the Cloud route, query/path injection and non-GET methods
fail before execution, and no absolute configuration, token or provider payload reaches the
response, logs or MCF stores. All non-abuse database tables remain byte-semantically identical;
the only expected MCF write is the opaque HMAC technical counter in `abuse_rate_limits`. The
complete source and disposable filesystem fingerprints remain unchanged, the child process and
ephemeral HTTP listener close, and the unique database is absent after teardown.

After teardown the connection is truthfully `DISCONNECTED`, runtime is `INACTIVE`, and the E2E is
only historical lab evidence. It says nothing about NODE-01/VPS freshness or production.
