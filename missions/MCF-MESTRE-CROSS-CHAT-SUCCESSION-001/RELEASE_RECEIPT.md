# RELEASE_RECEIPT — MCF v1.2.0

Mission: `MCF-MESTRE-CROSS-CHAT-SUCCESSION-001`  
Date: 2026-08-27  
Authority: LEANDRO  
Coordinator: MESTRE successor

```text
RELEASE_RECEIPT = PASS
```

## Qualified payload

- Release PR: `#175`
- Qualified PR HEAD: `43b0cccab4b29a2ed4c77abd824b652521c2b8c1`
- Qualified tree: `262289cdf54ed4024aad24482ad18e8e1cdccf4e`
- Focused tests before merge: `34/34 PASS`
- Canonical candidate CI before merge: `5/5 SUCCESS`
- Critical/high blockers: `NONE`

## Protected merge

Immediately before merge:

- `main`: `2b8ce24b71c9f9095c801dafdd762a2cef202fa9`
- PR #175 HEAD: `43b0cccab4b29a2ed4c77abd824b652521c2b8c1`
- PR state: open, non-draft, mergeable, clean

Merge was executed with exact-head protection against the qualified PR HEAD.

Result:

- merged `main` SHA: `5c7f9832f037f374ec3fe2d4160342a5f2cf8a06`
- merged `main` tree: `262289cdf54ed4024aad24482ad18e8e1cdccf4e`
- `tested_tree == merged_main_tree`: `PASS`

## Post-merge qualification

- MCF Production Readiness run: `33059120574` — `SUCCESS`
- Staging Deploy run: `33059120543` — `SUCCESS`
- checkout / lockfile / vulnerability / format / lint / typecheck / migrations / tests / build / backup-restore / contract tests: `SUCCESS`

## Publication

Direct tag/release mutation was not exposed by the connected GitHub write surface. Publication therefore used the repository's established GitHub Actions pattern (`permissions: contents: write`, immutable tag checks, `gh release create`) through an isolated one-shot workflow on the succession audit branch.

One-shot publication run:

- run: `33059572578`
- workflow: `MCF v1.2.0 One-Shot Publication`
- result: `SUCCESS`
- exact checkout boundary: `PASS`
- live-main drift guard: `PASS`
- exact tree guard: `PASS`
- immutable tag create/verify: `PASS`
- stable release create/verify: `PASS`

## Independent live verification

GitHub live state after publication:

- ref: `refs/tags/v1.2.0`
- tag object type: `commit`
- tag SHA: `5c7f9832f037f374ec3fe2d4160342a5f2cf8a06`
- GitHub Release ID: `377709546`
- release tag: `v1.2.0`
- release title: `MCF v1.2.0 — Human Control + Visible Copresence`
- draft: `false`
- prerelease: `false`
- published: `2026-08-27T09:39:53Z`
- latest release: `v1.2.0`

Therefore:

```text
QUALIFIED_PR_TREE
  == MERGED_MAIN_TREE
  == TAGGED_COMMIT_TREE

TAG_v1.2.0 -> 5c7f9832f037f374ec3fe2d4160342a5f2cf8a06
RELEASE_v1.2.0 -> TAG_v1.2.0
TAG_TO_SHA_TO_RELEASE = PASS
```

## Declared limitation preserved

This release does not claim a universal persistent `MissionRuntime` pause/resume API for every in-flight process. `HUMANO NO CONTROLE` is officialized at the governance/orchestration boundary without inventing universal runtime enforcement.

## Final release decision

```text
S11_EXACT_MERGE = PASS
S12_POST_MERGE_QUALIFICATION = PASS
S13_TAG_V1_2_0 = PASS
S14_GITHUB_RELEASE_V1_2_0 = PASS
S15_RELEASE_RECEIPT = PASS
MCF_V1_2_0_PUBLICATION = PASS
```
