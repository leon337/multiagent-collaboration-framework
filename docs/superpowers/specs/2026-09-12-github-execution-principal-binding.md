# GitHub Execution Principal Binding — Design Spec

## Goal
Preserve MCF logical agent ownership while making GitHub mutations attributable to a verified external principal.

## Problem
The runtime already authorizes `agentId` through the PermissionEngine, but GitHub write adapters consume one process-wide token. This means a receipt can name a logical agent while the provider-side action is performed by a different shared account.

Directly mapping `agentId -> GitHub account` would currently regress the runtime because GitHub write skills are owned by Gabriel, Bruno and Renato, while only MESTRE and LÉO have external GitHub identities today.

## Model
Keep two identities separate:
- `agentId`: logical MCF agent that owns/is authorized for the skill.
- `executionPrincipal`: external principal that materializes the provider action.

Current bootstrap bindings:
- principal `MESTRE` -> external login configured by `MCF_GITHUB_MESTRE_LOGIN`.
- principal `LEO` -> external login configured by `MCF_GITHUB_LEO_LOGIN`.
- human LEANDRO is never an automated execution principal.

Bootstrap delegation:
- direct binding is used when a logical agent has a matching configured principal.
- while `MCF_GITHUB_BOOTSTRAP_DELEGATION_ENABLED=true`, authorized GitHub write skills without a direct identity delegate provider execution to principal `MESTRE`.
- delegation never bypasses PermissionEngine; the logical agent must already be authorized for the skill.
- disabling bootstrap delegation makes unbound GitHub writes fail closed.

## Security
- tokens never enter `ExternalActionRequest`, receipts, ledger events, logs, or git.
- adapters obtain a token only from the identity registry after a non-secret principal descriptor is bound.
- the registry verifies the token against GitHub `GET /user` and rejects login mismatch.
- identity verification is cached only for the lifetime of the process.
- idempotency fingerprints include the non-secret execution principal so retries cannot silently switch actor.

## Evidence
GitHub write receipts add:
- `logicalAgentId`
- `executionPrincipalId`
- `externalActor`
- `attributionMode` (`DIRECT` or `BOOTSTRAP_DELEGATED`)
- `identityBindingVerified: true`

## Scope
Phase 1 covers provider principal binding and credential selection for existing GitHub write adapters. Read-only GitHub adapters remain unchanged. No merge to `main` is authorized by this work.
