# Checkpoint — PHASE-01 DSH Agent Teams Reverse Engineering

Mission: `MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001`  
Issue: #234  
Branch: `research/dsh-agent-teams-reverse-engineering-20260918`  
State: `INITIAL_REVERSE_ENGINEERING_COMPLETE_DESIGN_CANDIDATE_READY`

## Evidence completed

- official DSH repository and current Agent Teams contracts inspected;
- durable types/event forms inspected;
- journal/mailbox/projection/roster/task/lifecycle implementations inspected;
- profile conflict-removal policy inspected;
- Python SDK subprocess/JSON-RPC boundary inspected;
- MIT license verified;
- recent upstream compatibility/resource-accounting risks reviewed;
- current MCF memory harness and Bubble Executor compared.

## Primary conclusion

```text
durable journal -> strict projection -> executor side effect -> durable receipt
```

This is the principal architectural improvement to transplant.

## Next phase candidate

`PHASE-02-MCF-HARNESS-V2-PROTOTYPE`

Proposed scope: journal, projection, task CAS + DAG, mailbox, leases, executor adapter contract and tests.

Still out of scope: production rollout, Cognitive Ledger live mutation, automatic merge and distributed multi-node scheduler.