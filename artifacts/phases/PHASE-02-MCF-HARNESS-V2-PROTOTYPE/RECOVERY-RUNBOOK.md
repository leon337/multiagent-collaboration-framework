# Recovery Runbook — MCF Harness V2

1. Retrieve roadmap, checklist, mission state, checkpoint, recovery capsule and event export.
2. Validate capsule SHA-256 entries.
3. Validate every exported event payload digest and replay event sequence.
4. Import only into an empty Mission Store.
5. Compare the recovered journal export SHA-256 with the source metadata.
6. Build a `resume_plan`.
7. Reassign recoverable tasks only after dependencies are complete.
8. Resume interrupted sessions from durable checkpoint references.
9. Verify mailbox delivery state is unchanged.
10. Append a new recovery receipt; never rewrite prior history.

The local bubble proof additionally validates the stronger event hash-chain and clean-workspace reconstruction.

A truly separate ChatGPT conversation remains a human/product acceptance test because this conversation cannot create another independent ChatGPT conversation itself.
