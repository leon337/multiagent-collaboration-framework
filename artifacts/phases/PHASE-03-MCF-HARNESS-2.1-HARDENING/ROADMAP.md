# ROADMAP — MCF Harness V2.1 Hardening

Mission: `MCF-HARNESS-2.1-HARDENING-001`  
Issue: #238  
Base: MCF Harness V2 `2.0.0`  
Authority: LEANDRO  
Coordinator: MESTRE  
Runtime: ChatGPT bubble local sandbox

## H1 — Mailbox hardening

- dedicated target dispatcher;
- process-safe per-target serialization;
- strict queue order;
- head-of-line failure stops later delivery;
- per-target backpressure;
- message-size limits;
- multiprocess duplicate-delivery test.

Status: **PASS_LOCAL / CI_PENDING**

## H2 — Scheduler hardening

- priority;
- bounded aging;
- lane fairness;
- global active-task backpressure on one host;
- dependency gate before lease;
- safe preemption recommendation only;
- multiprocess max-active test.

Status: **PASS_LOCAL / CI_PENDING**

## H3 — Security hardening

- tool-output secret redaction;
- prompt-injection/untrusted-output marking;
- output truncation;
- secret-reference allowlist;
- capability + execution + agent + task confused-deputy binding.

Status: **PASS_LOCAL / CI_PENDING**

## H4 — Journal / receipts

- dedicated `mcf_receipt/v1`;
- receipt integrity hash;
- PASS requires evidence;
- auditable journal snapshot;
- event-prefix rolling digest;
- non-destructive journal archive;
- HMAC authority anchor;
- no destructive compaction.

Status: **PASS_LOCAL / CI_PENDING**

## H5 — Threat model + release decision

- persist threat model;
- classify residual risks;
- run full unit/integration suite;
- run Production Readiness;
- keep PR draft until HUMAN_GATE.

Status: **IN_PROGRESS**

## Release rule

No merge to `main` without a new explicit HUMAN_GATE from LEANDRO.
