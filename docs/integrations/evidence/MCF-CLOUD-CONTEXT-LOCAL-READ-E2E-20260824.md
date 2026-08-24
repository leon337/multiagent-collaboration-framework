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

- MCF implementation checkpoint: `e98bb353a941a68b4bf61fc767ae1273b4d5e1a4`;
- MCF security/AppModule checkpoint: `e2663fc3bf95283b1ea8bf4cb264aecae9ecf359`;
- Cloud provider feature content: `cb97df4bcc0bb374c7524e6aa395309af8967297`;
- Cloud PR #26 lab-target merge: `dbd772a6c37452008b7c8debd58d2782127514db`;
- Node.js: `24.18.0`;
- pnpm: `11.17.0`;
- provider Python: canonical non-symlinked `python3.12` in a disposable `venv --copies`, with its
  executable and every provider source bound by SHA-256.

The Cloud feature content was copied into a temporary path ending exactly in
`leon337/g2a-smoke/dev`; the original Cloud worktree was never executed as a writable target.

## Gates executed

Focused guard/controller/service suite:

```text
Test Files  3 passed (3)
Tests       13 passed (13)
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
- Cloud provider result validation with its own Draft 2020-12 schema;
- independent recomputation of all 13 provider provenance hashes before and after the child;
- complete disposable-tree, Cloud-source-tree and Git fingerprint equality;
- child-process cleanup and refusal of a listener connection after AppModule shutdown.

## Authentication isolation

The route accepts only `x-mcf-cloud-context-token`, backed by
`MCF_CLOUD_CONTEXT_INGRESS_TOKEN`. The E2E proved all of the following:

- no token → `401`;
- the general Context/TriView key in `x-mcf-context-token` → `401`;
- that same key copied into `x-mcf-cloud-context-token` → `401`;
- a Cloud token equal to the general Context token disables configuration;
- the distinct Cloud key reaches the fixed read path;
- neither key appears in response, runtime log, database counter or Git.

## Process and contract boundary

The client supplied no command, path, operation, URL or environment. MCF generated the exact
one-line `MCF_CLOUD_CONTEXT_READ_V1` / `cloud-infrastructure` / `context.get` / `{}` request and
spawned one hash-bound Python ELF directly with `-I`, no shell, a fixed relative CLI and only the
provider's explicit local-lab enable variable.

Negative tests passed for missing/invalid configuration, source drift, symlinked source,
executable digest drift, spawn error without `close`, timeout without `close`, stdout overflow,
stderr overflow, query/path injection and a non-GET method. The timeout Promise settled after the
bounded post-`SIGKILL` grace even when the injected child never emitted `close`.

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
- policy: `read`;
- request count: `5` for the five matched GET requests;
- columns: only key hash, policy, time window, count and update timestamp.

The counter schema and values contained no token, path, request payload, Cloud response or provider
content. Runtime logs were captured and checked against the same forbidden values.

## Explicit non-claims

- no live VPS/NODE-01 observation;
- no SSH or external network transport;
- no Cloud workspace mutation;
- no provider payload persistence in MCF;
- no staging or production deploy;
- no paid AI/API call;
- no claim that G2-A remote freshness is current.
