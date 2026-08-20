# MCF-STABILIZATION-001 — Phase 01 Plan

## Mission
`MCF-STABILIZATION-001`

## Phase
`PHASE-01-TRUST-ROOT`

## State
`IN_PROGRESS — BLOCKED_ON_EXTERNAL_TRUST_ROOT`

## Risk class
`C`

## Objective
Establish a verifiable GitHub trust root for the MCF production control plane, then reconcile and requalify the Issue #140 / PR #143 remediation against the actual `main` branch before any merge or production action.

## Authorized scope
- verify current `main`, branch protection and relevant PR/Issue state;
- define the required trust-root policy;
- preserve production fail-closed semantics;
- reconcile PR #143 against current `main` after trust-root protection exists;
- re-run technical/security/governance qualification;
- reconcile canonical current-state documentation after the remediation is integrated.

## Prohibited in this phase until gates are satisfied
- direct production workflow dispatch;
- provider LIVE mutation;
- merging PR #143 while the trust root is unprotected;
- treating CI green, merge, branch update or workflow inputs as production authorization;
- implementing Context Fabric, Mission Control or Governance v2.

## Live evidence at phase start
- `main@439da7b6479718f6545144954937b8c4358d7c46`;
- GitHub branch API: `protected=false`, protection disabled;
- Issue #140: `OPEN`;
- PR #143: `OPEN`, `DRAFT`, `NOT_MERGED`;
- PR #143 head: `bcb41029c3f3494cc4951d060115a799f1ffc14e`;
- compare current-main...PR143-head: `DIVERGED`, `ahead_by=59`, `behind_by=9`, merge-base `5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`.

## Required trust-root policy
At minimum:
1. protect `main` with a GitHub branch protection/ruleset mechanism;
2. require pull-request based changes for `main`;
3. block force-push and branch deletion;
4. require the relevant qualification/status checks before merge;
5. restrict bypass to explicitly governed emergency use;
6. place production credentials behind a production environment/control boundary restricted to the authorized ref/path;
7. preserve exact-SHA authorization and fail-closed behavior in the production promotion workflow.

## Acceptance criteria
- GitHub live reports an effective protected trust root for `main`/production control plane;
- PR #143 is reconciled against the new `main` baseline without silently dropping either lineage;
- negative tests prove unauthorized `main` movement cannot promote production;
- positive tests prove authorized exact-SHA promotion can proceed only with canonical persisted authorization evidence;
- full CI/qualification is green on the exact reconciled SHA;
- independent governance/security review has no blocking finding;
- Issue #140 is closed only after integration and post-merge verification;
- canonical current-state docs distinguish live state from historical snapshots.

## Selected control roles
- MESTRE — orchestration and boundary enforcement;
- Sofia — architecture/integration review;
- Ricardo — security and trust-root review;
- Renato — validation and qualification evidence;
- Augusto — mission trace and failure/recovery observability;
- Miriam — current-state/provenance reconciliation;
- Carmem — PRF consistency;
- Emily — independent audit before phase gate;
- Gabriel — GitHub/PR/release traceability;
- LÉO — internal gate after evidence is complete;
- LEANDRO — final human authority for reserved boundaries.

## Current next action
Establish the external GitHub trust-root protection. The currently connected GitHub action surface does not expose branch-protection/ruleset/environment-policy mutation, so this specific control cannot be applied automatically from the active boundary.
