# MCF → Cloud local context read — lab E2E evidence

## Verdict

`PASS`, limited to a disposable local lab.

The tested flow was full MCF `AppModule` HTTP → global abuse protection → dedicated Cloud ingress
guard → fixed MCF adapter → Cloud-owned stdio CLI → Cloud schemas and state. It did not use SSH,
NODE-01, the VPS, staging, production or a paid API.

After teardown the truthful lifecycle is:

- implementation: `IMPLEMENTED`;
- connection: `DISCONNECTED`;
- runtime: `INACTIVE`;
- verification: `HISTORICALLY_VERIFIED`;
- freshness: `LIVE_REQUIRED` for operational/remote claims.

This evidence belongs to `cloud.context.local.read`. It does not alter or activate the separate
remote/VPS capability `cloud.workspace.g2a.read`.

## Pinned inputs

- MCF initial implementation checkpoint: `e98bb353a941a68b4bf61fc767ae1273b4d5e1a4`;
- MCF initial security/AppModule checkpoint: `e2663fc3bf95283b1ea8bf4cb264aecae9ecf359`;
- MCF complete execution-closure/security checkpoint:
  `425e258bb110799f33ad3942fbed7ae1be17313d`;
- Cloud provider feature content: `cb97df4bcc0bb374c7524e6aa395309af8967297`;
- Cloud PR #26 lab-target merge: `dbd772a6c37452008b7c8debd58d2782127514db`;
- Node.js: `24.18.0`;
- pnpm: `11.17.0`;
- provider Python: canonical non-symlinked `python3.12` in a disposable `venv --copies`; its ELF
  and all 16 owned provider/execution files were SHA-256-bound.

The Cloud feature content was copied into a temporary path ending exactly in
`leon337/g2a-smoke/dev`; the original Cloud worktree was never executed as a writable target.

The Python runtime was built as a disposable copied venv. Dependency acquisition populated a
disposable wheelhouse first; that acquisition is outside the offline-install claim. The measured
runtime installation itself used only that local wheelhouse:

```bash
PYTHON_RUNTIME=$(mktemp -d /tmp/mcf-cloud-runtime-e2e-XXXXXXXX)
WHEELHOUSE=$(mktemp -d /tmp/mcf-cloud-wheelhouse-e2e-XXXXXXXX)
/usr/bin/python3.12 -m pip download --disable-pip-version-check --only-binary=:all: \
  --dest "$WHEELHOUSE" 'jsonschema==4.26.0' 'PyYAML==6.0.3'
/usr/bin/python3.12 -m venv --copies "$PYTHON_RUNTIME"
strace -f -qq -e trace=network -o "$PYTHON_RUNTIME/install-network.trace" \
  "$PYTHON_RUNTIME/bin/python3.12" -m pip install \
  --disable-pip-version-check --no-cache-dir --no-index --find-links "$WHEELHOUSE" \
  'jsonschema==4.26.0' 'PyYAML==6.0.3'
chmod -R go-w "$PYTHON_RUNTIME"
```

The trace contained no `connect` syscall (pip opened and bound only an IPv6 loopback socket). The
resolved runtime set was `attrs==26.1.0`, `jsonschema==4.26.0`,
`jsonschema-specifications==2025.9.1`, `PyYAML==6.0.3`, `referencing==0.37.0`,
`rpds-py==2026.6.3` and `typing_extensions==4.16.0`, with `pip==24.0`. These exact versions and the
wheel SHA-256 values below belong to this historical run; they are integrity evidence, not a claim
that the transitive dependency graph is repository-locked:

```text
attrs-26.1.0: c647aa4a12dfbad9333ca4e71fe62ddc36f4e63b2d260a37a8b83d2f043ac309
jsonschema-4.26.0: d489f15263b8d200f8387e64b4c3a75f06629559fb73deb8fdfb525f2dab50ce
jsonschema-specifications-2025.9.1: 98802fee3a11ee76ecaca44429fda8a41bff98b00a0f2838151b113f210cc6fe
PyYAML-6.0.3: ba1cc08a7ccde2d2ec775841541641e4548226580ab850948cbfda66a1befcdc
referencing-0.37.0: 381329a9f99628c9069361716891d34ad94af76e461dcb0335825aecc7692231
rpds-py-2026.6.3: ecabd69db66de867690f9797f2f8fa27ba501bbc24540cbdbdc649cd15888ba6
typing_extensions-4.16.0: 481caa481374e813c1b176ada14e97f1f67a4539ce9cfeb3f350d78d6370c2e8
```

## Gates executed

Focused Cloud guard/controller/service plus abuse-policy suite:

```text
Test Files  4 passed (4)
Tests       43 passed (43)
```

Real full-AppModule suite:

```text
Test Files  1 passed (1)
Tests       3 passed (3)
```

Additional gates passed:

- contracts/database build;
- server typecheck;
- focused ESLint;
- Prettier and `git diff --check`;
- Vitest worker assertion for Node.js `24.18.0` (not only the pnpm parent);
- Cloud provider result validation with its own Draft 2020-12 schema;
- independent recomputation of all 13 provider provenance hashes before and after the child;
- independent before/after verification of the three extra owned imports, for a 16-file closure;
- cache refusal for owned `__pycache__`, `.pyc` and `.pyo` paths;
- complete disposable-tree, Cloud-source-tree, Git and copied-venv fingerprint equality;
- copied-venv UID and non-group/world-writable checks for every regular file/directory;
- child-process cleanup and refusal of a listener connection after AppModule shutdown.

## Authentication isolation

The route accepts only `x-mcf-cloud-context-token`, backed by
`MCF_CLOUD_CONTEXT_INGRESS_TOKEN`. The E2E proved all of the following:

- no token → `401`;
- the general Context/TriView key in `x-mcf-context-token` → `401`;
- that same key copied into `x-mcf-cloud-context-token` → `401`;
- the Ledger ingress and provider-bearer keys in the Cloud header → `401`;
- a Cloud token equal to any Context/TriView/Ledger key disables configuration;
- leading/trailing whitespace, CR/LF, commas, arrays and duplicate raw Cloud headers fail closed;
- the distinct Cloud key reaches the fixed read path;
- none of the four keys appears in response, runtime log, database counter or Git.

## Process and contract boundary

The client supplied no command, path, operation, URL or environment. MCF generated the exact
one-line `MCF_CLOUD_CONTEXT_READ_V1` / `cloud-infrastructure` / `context.get` / `{}` request and
spawned one hash-bound Python ELF directly with `-I`, no shell, a fixed relative CLI and only the
provider's explicit local-lab enable variable.

Negative tests passed for missing/invalid configuration, drift and symlinks in each of the three
extra imports (including drift during execution), owned bytecode caches, provider-source drift,
executable digest drift, spawn error without `close`, timeout without `close`, stdout overflow,
stderr overflow, bulkhead saturation/release, query/path injection and a non-GET method. The
timeout Promise settled after the bounded post-`SIGKILL` grace even when the injected child never
emitted `close`; this proves bounded adapter settlement, while the real-process E2E separately
proved PID cleanup.

The exact GET route used policy `mcf-cloud-context-local-read` at 10 requests/minute, and the MCF
service allowed one active Cloud read per process. Saturation failed immediately with normalized
`503`; unit tests proved release after success, child error and timeout.

The successful HTTP response used `Cache-Control: private, no-store` and exposed no repository
root, Python path, absolute host path, token, arbitrary header value or raw error. It declared:

```text
read_only=true
material_action=false
provider_payload_persisted_by_mcf=false
evidence_only=true
workspace_observation=LIVE_LOCAL_DISPOSABLE
operational_state=LIVE_REQUIRED
```

## MCF database proof

The harness created a random, uniquely named database in the already-running shared lab Postgres,
applied all MCF migrations, ran AppModule on an ephemeral loopback HTTP port, closed all pools and
dropped only that database. A postflight query proved the database absent. The shared Postgres
container remained running and was neither stopped nor removed.

Before/after snapshots of every public table except `abuse_rate_limits` were identical. The only
MCF mutation was one expected row in `abuse_rate_limits`:

- key: 64-character HMAC-SHA256 of the loopback subject;
- policy: `mcf-cloud-context-local-read`;
- request count: `7` for the seven matched GET requests that reached AppModule abuse protection;
- columns: only key hash, policy, time window, count and update timestamp.

The counter schema and values contained no token, path, request payload, Cloud response or provider
content. Runtime logs were captured and checked against the same forbidden values.

## Runtime TCB and hermetic harness

The harness removed inherited environment variables before `AppModule` construction, installed an
exact 13-name allowlist with a temporary isolated `HOME`, and restored the complete original
environment after teardown. This prevented unrelated Context/Ledger/provider settings from being
activated accidentally.

The lab bound the canonical Python ELF and all 16 files owned by the Cloud adapter. It also
fingerprinted the entire copied venv before/after and required the E2E user's UID (when available)
and no group/world write bit on every regular file/directory. This is integrity evidence for that
specific lab run, not complete Python supply-chain attestation: the external standard library,
site-packages/native extensions and transitive runtime dependencies remain TCB, and the stdlib
outside the venv remains a residual trust boundary. The provider's Python audit hook is defense in
depth, not an operating-system sandbox, and this evidence does not cover a hostile same-UID process
or compromised host.

## Explicit non-claims

- no live VPS/NODE-01 observation;
- no SSH or external network transport;
- no Cloud workspace mutation;
- no provider payload persistence in MCF;
- no staging or production deploy;
- no paid AI/API call;
- no complete Python/stdlib/site-packages supply-chain attestation;
- no OS-sandbox or hostile-host claim;
- no claim that G2-A remote freshness is current.
