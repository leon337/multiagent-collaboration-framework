# CHECKLIST — MCF Harness V2.1 Hardening

Legend: `[x]` locally validated · `[~]` partial/CI pending · `[ ]` pending.

## Journal / Authority
- [x] A10 local cryptographic authority anchor with HMAC.
- [~] C08 external anchor publication — signer exists; external publication not automatic.
- [ ] C09 explicit schema migration framework.
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
- [~] H08 explicit secret-reference policy — provider lifecycle/rotation remains future work.
- [~] H09 threat model document + residual-risk classification.

## Evidence
- [x] 6 local technical test shards in parallel.
- [x] 6/6 shards PASS after load-timeout hardening.
- [x] two concurrent dispatchers: zero duplicate delivery.
- [x] five concurrent producers: exact backpressure bound.
- [x] two concurrent schedulers: exact max-active bound.
- [~] GitHub Harness CI.
- [~] GitHub Production Readiness.
- [ ] HUMAN_GATE for merge.
