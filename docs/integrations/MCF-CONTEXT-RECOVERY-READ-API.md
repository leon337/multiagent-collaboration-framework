# MCF Context Recovery read API

## Boundary

The endpoints are an optional laboratory/staging projection of Context Fabric. They read the MCF
Project and Capability Registries plus the owning repository Capsule.

```text
GET /v1/mcf/context/recovery
GET /v1/mcf/context/capabilities
```

It never accepts a material-action flag, persists a Receipt, invokes an external-action adapter,
or mutates a repository/provider. TriView is a consumer of the Receipt and is not a source of
truth.

The boundary is disabled unless both are configured:

- `MCF_CONTEXT_READ_TOKEN`: a dedicated token, distinct from `MCF_RUNTIME_TOKEN`;
- `MCF_CONTEXT_CONFIG_JSON`: a bounded, strict configuration with exact repository roots and Git
  revisions.

## Recovery request

Header:

```text
x-mcf-context-token: <dedicated read-only token>
```

Query:

| Field                                | Required | Accepted values                                              |
| ------------------------------------ | -------- | ------------------------------------------------------------ |
| `project_hint`                       | yes      | stable project id, canonical repository, or registered alias |
| `requires_current_operational_state` | no       | `true` or `false`; default `false`                           |

Example:

```bash
curl --fail-with-body --silent --show-error \
  --header "x-mcf-context-token: ${MCF_CONTEXT_READ_TOKEN}" \
  "http://127.0.0.1:3000/v1/mcf/context/recovery?project_hint=TriView&requires_current_operational_state=true"
```

## Capability Registry request

The capability endpoint uses the same dedicated read token. With no query it returns every
configured entry; an optional stable `project_id` filters entries where that project is the
provider or a consumer.

```bash
curl --fail-with-body --silent --show-error \
  --header "x-mcf-context-token: ${MCF_CONTEXT_READ_TOKEN}" \
  "http://127.0.0.1:3000/v1/mcf/context/capabilities?project_id=triview-workspace-linux"
```

The response is an evidence-only `McfCapabilityRegistrySnapshot`. Lifecycle fields distinguish
implemented code from a currently connected, authorized and verified capability. A bounded-write
entry cannot become `ACTIVE` merely because its code exists.

## Laboratory configuration

`MCF_CONTEXT_CONFIG_JSON` has this strict shape:

```json
{
  "registry_repository_root": "/absolute/path/to/multiagent-collaboration-framework",
  "schema_directory": "/absolute/path/to/multiagent-collaboration-framework/schemas/context",
  "registry_sources": [
    {
      "source_ref": "context/projects/triview-workspace-linux.yaml",
      "source_revision": "<exact-40-or-64-character-git-commit>"
    }
  ],
  "capability_sources": [
    {
      "source_ref": "context/capabilities/mcf-context-recovery-read.yaml",
      "source_revision": "<exact-40-or-64-character-git-commit>"
    }
  ],
  "project_repositories": {
    "triview-workspace-linux": {
      "repository_root": "/absolute/path/to/triview-workspace-linux",
      "source_revision": "<exact-40-or-64-character-git-commit>"
    }
  }
}
```

Every Capsule is loaded from the root mapped by stable `project_id`; equal paths such as
`.mcf/project-capsule.yaml` cannot collide across repositories. Provenance is qualified as
`repo://<owner>/<repository>/<path>`.

When current state is requested, the first CF-2 adapter checks only local Git evidence:

- configured root is exactly the Git top level;
- current HEAD equals the pinned revision;
- the worktree is clean, including untracked files.

An exact clean match produces `LIVE_VERIFICATION` evidence. A changed HEAD or dirty worktree
produces `DRIFT_DETECTED`. Missing/invalid evidence degrades a read to `PARTIAL_RECOVERY`; a future
material consumer must fail closed. Local Git freshness does not claim that VPS/provider state is
fresh; that requires the separately governed read-only Control Bridge capability.

## Security invariants

- no paid AI API or model call;
- no secret inside Registry, Capsule, Receipt, or configuration committed to Git;
- dedicated read token cannot authorize MCF runtime actions;
- capability listing is GET-only and cannot authorize a declared capability;
- repository roots and revisions are operator configuration, not request input;
- bounded YAML/JSON parsing, no aliases, tags, symlinks, traversal, or network schema loading;
- endpoint is not enabled in production by this change.
