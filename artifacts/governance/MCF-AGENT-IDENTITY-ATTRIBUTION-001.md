# MCF — Agent Identity Attribution Test 001

```yaml
artifact: MCF_AGENT_IDENTITY_ATTRIBUTION_001
status: ACCOUNT_ATTRIBUTION_TEST
human_authority: LEANDRO
orchestrator_identity: mcfmestreagent-svg
continuity_gate_identity: mcfleoagent-ops
repository: leon337/multiagent-collaboration-framework
scope: github_identity_and_credential_separation
main_merge_authorized: false
```

## Objective

Verify that MESTRE and LÉO can act through distinct GitHub identities, SSH keys, CLI sessions, Git commit identities and repository workspaces while LEANDRO remains the repository owner and final human authority.

## Evidence expected

- MESTRE authors this commit from the dedicated MESTRE workspace and SSH identity.
- MESTRE opens the pull request through the dedicated MESTRE GitHub CLI session.
- LÉO reviews the pull request through the dedicated LÉO GitHub CLI session.
- The default branch remains protected and no merge is performed by this test.

## Claim boundary

This test proves **GitHub account attribution and credential-path separation** only. It does not, by itself, prove independent LÉO runtime cognition, independent model execution, or autonomous multi-agent deliberation.

## Success condition

The test passes when GitHub shows distinct attributed actors for authoring and review, with no credential sharing and no direct write to `main`.
