# RFC — MCF-LEARNING-001: Human Feedback, Offline Preference Evaluation and Governed ML

> **Status:** PROPOSED / EXPERIMENTAL, **not an approved ADR**, not runtime-enabled.  
> **Authoring:** MESTRE (governance synthesis of Firecrawl research), pending SOFIA architecture decision, RAFAEL implementation, RENATO QA, EMILY independent audit, and LÉO gate.  
> **Source mission:** [#487](https://github.com/leon337/multiagent-collaboration-framework/issues/487). **Risk:** C.

## Product invariant

Human feedback is evidence for evaluation, *not* permission to change an agent policy. No model may learn from, replay, or transmit patient records, secrets, access tokens, unredacted prompts, or content from Vital Família. STOP, PAUSE, HUMAN_GATE, origin validation, immutable mission and PR SHA checks remain authoritative. All experimental features default **OFF**.

## Proposed contract: agent_feedback.v1 (not implemented)

| Field | Type | Meaning |
| --- | --- | --- |
| `event_id` | UUID | Idempotency key; duplicate rejected without mutable overwrite |
| `trace_id`, `mission_id`, `agent_id` | constrained IDs | Link to existing trace; no invented session |
| `policy_digest`, `candidate_digest` | SHA-256 hex | Immutable version references; not plain prompt text |
| `evaluator_principal`, `authority_scope` | verified IDs | Evaluator authorization must be checked by server, never from self-declared client values |
| `decision` | `a\|b\|tie\|neither\|skip` | Human annotation, not reward function output |
| `reason_code` | enum allowlist | e.g. correct, unsafe, incomplete, unverified, consent_withdrawn |
| `recorded_at`, `schema_version`, `retention_class` | immutable metadata | Time, version and deletion / retention policy |
| `sanitization_proof`, `consent_scope_digest` | digests / receipts | Checked before deriving a training dataset |

**Prohibited:** embedded prompts, measurements, photo bytes, cookies, tokens, direct patient IDs, raw email or addresses. Validate JSON schema strictly, reject unknown fields and noncanonical digests. Event store is append-only by design, but corrections and deletion/retention are governed and must not be blocked by an append-only claim.

## Proposed experimental pipeline

1. Capture **synthetic** interaction identifiers with existing MCF trace and HDF permissions.
2. Collect explicit pairwise judgments or rejection, bound to evaluator/mission/trace/version with proof of redaction.
3. Freeze dataset manifest hash; group split by mission and trace to avoid leakage, keep locked test group.
4. Run **offline** comparison against deterministic baseline; measure agreement, incident/false-green rate, inter-annotator agreement, cost, latency, refusals.
5. If evidence supports it, consider *optional* offline DPO (TRL) with reviewed, permitted data. This is not required for MVP and no autonomous fine-tuning or preference optimization is authorized by this RFC.
6. Shadow-only candidate, never active policy; independent review and LÉO decision for every SHA/model/dataset release.
7. Restore immutable last-approved policy/model alias on failure, with ledger receipt and tests; authorization to run != authorization to promote.

## CI acceptance matrix (all synthetic)

- [ ] Missing/forged actor scope, unknown fields, duplicate event, malformed digest, PII marker or revoked consent => denied with no side effects.
- [ ] STOP / PAUSE / HUMAN_GATE / PR HEAD mismatch => experiment cannot promote or trigger actions.
- [ ] Split leakage across same trace/mission => CI fails; test set immutable.
- [ ] No personal or health data in traces, datasets, logs, uploads or reporting.
- [ ] No active policy/model changes with feature flag OFF.
- [ ] Model/dataset/eval manifest digest, reviewer identity and rollback proof included.
- [ ] RENATO tests same exact HEAD EMILY reviews; independent audit and LÉO gates, no false green.

## Delegation and boundaries

SOFIA → signed ADR / threat model; RAFAEL → branch code proposal; RENATO → CI evidence; EMILY → independent SHA review; LÉO → gate decision; MESTRE → orchestration/checkpoints only. No merge or production by this proposal.

Related [Vital Família ML issue #24](https://github.com/leon337/vital-familia-pwa/issues/24) is a separate scoped experiment; project #477 stays NO-GO for real clinical data.

Research anchors: [NIST AI RMF](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence), [TRL DPO](https://github.com/huggingface/trl/blob/main/docs/source/dpo_trainer.md), [MLflow](https://mlflow.org/docs/latest/ml/model-registry/).