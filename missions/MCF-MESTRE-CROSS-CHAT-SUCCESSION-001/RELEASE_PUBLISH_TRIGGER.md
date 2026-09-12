# RELEASE_PUBLISH_TRIGGER — MCF v1.2.0

Mission: `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`

- SUCCESSION_EQUIVALENCE: PASS
- successor: ACTIVE
- PR #175 exact merge: PASS
- qualified post-merge main SHA: `5c7f9832f037f374ec3fe2d4160342a5f2cf8a06`
- qualified tree: `262289cdf54ed4024aad24482ad18e8e1cdccf4e`
- post-merge MCF Production Readiness: PASS
- staging deploy: PASS
- target tag: `v1.2.0`
- publication authority: existing explicit LEANDRO authorization after validation

This marker triggers the branch-isolated one-shot publisher. The publisher must fail closed if live `main` is not the exact qualified SHA and must never retarget an existing tag.
