# CHECKLIST — MCF Harness V2.1 Hardening

Legend: `[x]` locally validated · `[~]` partial/CI pending · `[ ]` pending.

## Journal / Authority
- [x] A10 local cryptographic authority anchor with HMAC.
- [~] C08 external anchor publication — signer exists; external publication not automatic.
- [x] C09 explicit schema migration framework.
- [x] C10 auditable snapshot + non-destructive prefix archive.
- [x] J10 dedicated receipt schema.
- [~] J11 external attestation — local anchor ready, external provider not selected.

## Scheduler
- [x] D12 lane fairness + bounded aging.
- [x] D13 global one-host backpressure.
- [x] D14 safe preemption recommendation; no automatic destructive preemption.
- [x] dependency gate enforced before lease.
- [x] task scheduling metadata preserved in projection.

## Mailbox
- [x] E05 dedicated dispatcher.
- [x] E06 strict target ordering under concurrent dispatchers.
- [x] E07 per-target queue + message-size limits.
- [x] E08 multiprocess serialization / duplicate-delivery protection.

## Security
- [x] H06 tool-output sanitation.
- [x] H07 confused-deputy binding.
- [x] H08 explicit secret-reference policy + ephemeral provider lifecycle + TTL/revoke + execution-scoped capability binding.
- [x] H09 threat model document + residual-risk classification.

## Evidence
- [x] 6 local technical test shards in parallel.
- [x] 6/6 shards PASS after load-timeout hardening.
- [x] two concurrent dispatchers: zero duplicate delivery.
- [x] five concurrent producers: exact backpressure bound.
- [x] two concurrent schedulers: exact max-active bound.
- [x] GitHub Harness CI — run 35389797242 on head `145594c3…`.
- [x] GitHub Production Readiness — run 35389797116 on head `145594c3…`.
- [ ] HUMAN_GATE for merge.


## Schema migration evidence
- [x] explicit adjacent-only registry;
- [x] multi-hop planning requires every hop;
- [x] downgrade denied;
- [x] cross-family migration denied;
- [x] missing hop fails closed;
- [x] duplicate source migration rejected;
- [x] migration output must remain an object.


## Secret lifecycle evidence
- [x] explicit secret-name allowlist;
- [x] arbitrary environment lookup denied;
- [x] mapped secret missing → fail closed;
- [x] ephemeral bytearray lease;
- [x] zeroization on close;
- [x] TTL expiry;
- [x] revocation;
- [x] metadata-only audit record;
- [x] execution + agent + task + named capability binding;
- [x] secret value never included in audit metadata.


## Lifecycle / provisioning
- [x] F05 executor_ref durable in projection;
- [x] provisioning reconciliation after restart;
- [x] executor_ref mismatch fails closed;
- [x] contradictory settled observation fails closed;
- [x] missing observation remains provisioning/pending;
- [x] failed-agent name remains permanently reserved;
- [x] identical provision retry is idempotent;
- [x] reconciliation evidence_ref persisted.


## Final local parallel validation
- [x] 6 independent technical shards in ChatGPT bubble;
- [x] 93 tests total;
- [x] schema shard: 9 PASS;
- [x] security shard: 29 PASS;
- [x] anchor/history shard: 12 PASS;
- [x] coordination shard: 15 PASS;
- [x] executor shard: 10 PASS;
- [x] recovery/core shard: 18 PASS;
- [x] notebook_used=false;
- [x] Brainbase_used=false;
