# Zero-cost execution recovery — PHASE-02-MEMORY-ARCHITECTURE

Mission: `MCF-MEMORY-LIVE-NEXT-STABLE-001`
Owner: Mestre
State: `ZERO_COST_PATH_PREPARED / AGENT_RUN_PENDING_PR_CI`

## Correction of the previous executor path

Brainbase was explored only to solve the anti-simulation requirement with distinguishable agent identities. That route is no longer operational for this mission because its task runs are billable and LEANDRO clarified that the mission must use zero-new-cost tooling.

PR #169 was closed without merge. No Brainbase task run executed. No real Cognitive Ledger memory content, raw private source text, provider token, Supabase `service_role`, production credential or paid embedding call was sent or used.

The managed identities created during that exploration are external/inert and receive no MCF participation credit.

## Canonical zero-cost invariant

For this mission:

- no paid API is required or authorized;
- no billable external agent execution is allowed;
- no paid embedding provider is enabled;
- no paid runner/larger GitHub runner is allowed;
- no private-memory payload may be sent to a public CI agent harness;
- standard GitHub-hosted runners are only eligible while the MCF repository remains public and GitHub documents them as free for public repositories;
- any future cost-bearing boundary must fail closed rather than silently consume paid quota.

## Recovered reusable local-agent pattern

A separate repository owned by the same ecosystem, `leon337/predixai-platform`, contains an already implemented supervised local agent pattern:

- `scripts/predixai_agent_runner.py` invokes OpenClaw in local mode;
- its default model is `ollama/qwen2.5:1.5b`;
- the code explicitly states that it does not require a paid API;
- the PredixAI provider policy prefers a free layer for tests and lists Ollama/local AI as provider options.

This is evidence that the ecosystem already has a zero-cost local-inference design precedent. The MCF mission does not assume access to LEANDRO's workstation and does not ask him to run that tooling manually.

## Mission harness prepared in this branch

The clean recovery branch adds a mission-only harness:

- `.github/workflows/mcf-zero-cost-agent-harness.yml`;
- `ops/mission-agent-harness/zero_cost_phase2_agents.py`.

The harness uses a standard GitHub-hosted runner in the public MCF repository, installs a pinned Ollama release, pulls `qwen2.5:1.5b`, and executes each selected MCF specialist as a fresh, role-bound local model subprocess.

The harness does not mutate provider state, does not use secrets, does not call paid APIs and does not persist personal memory. It emits per-execution identifiers, timestamps, model name, SHA-256 of the generated artifact and explicit handoff markers to the workflow log.

## Selected Phase 2 execution chain

Only agents with concrete Phase 2 delivery are executed:

`Miriam -> Sofia -> Manoel -> Daniela -> Ricardo -> Júlia -> Tiago -> Rafael -> Eduardo -> Bruno -> Renato -> Beatriz -> Augusto -> Emily -> Léo`

Mestre remains the coordinator and owns the harness/orchestration artifacts. Other official agents remain in the available MCF pool and are not run decoratively.

## Anti-simulation boundary

A generated artifact only counts when:

1. the workflow actually ran;
2. a local model subprocess was invoked for the named role;
3. the execution has a distinct run UUID;
4. output is non-empty and matches the required ESEV headings;
5. the log records start/end markers and SHA-256;
6. the coordinator copies/links the exact output into the PRF with the originating workflow/job/run reference;
7. later validation/audit accepts the provenance.

Prompt text, a planned role name, or a coordinator-authored summary does not count as agent execution.

## Current limitations

- the harness is mission tooling, not the production MCF cognitive-agent runtime;
- all prompts use only public/technical mission context;
- a small local model may produce weak or incorrect analysis; downstream agents, validation and audit must identify that rather than treating model output as authority;
- no architecture gate is passed merely because the harness runs;
- the product implementation remains blocked until the real architecture package is assembled, audited and approved under the active MCF governance.

## Next evidence

The next expected evidence is the pull-request workflow run for the clean zero-cost branch. If the workflow fails, CAF applies: capture the failure, classify it, correct the harness without changing the zero-cost/privacy invariants, rerun through the PR and preserve the failure history.
