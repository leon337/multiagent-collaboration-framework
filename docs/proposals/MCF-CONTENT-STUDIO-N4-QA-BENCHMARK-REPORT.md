# MCF Content Studio N4 — QA & Benchmark Report

**Mission:** `MCF-CONTENT-STUDIO-N4-001`  
**Evidence run:** Content Studio N4 Validation #22  
**Head inspected:** `6d032d8b52cd0f2a9efb32c26be52b6c6b41f12a`

## Visual stress inspection

Manual inspection of CI-rendered PNG evidence:

| Fixture | Result | Evidence |
|---|---|---|
| LongFocusConceptQa | PASS | long title/body remain inside safe area; no clipping |
| LongTimelineQa | PASS | seven events remain legible; no overflow |
| LongDiagramQa | PASS | four nodes remain inside portrait frame; semantic line breaks preserved |

These PASS results apply to the inspected frames and fixtures only. They are not a claim that arbitrary content can never overflow.

## Reproducible benchmark

CI artifact `benchmark.json`:

- Node: `v24.20.0`
- pilot still: `2390 ms`
- portrait still: `2512 ms`

These measurements are environment-specific.

## Relation to VIDEO-BENCHMARK-001 (#251)

Issue #251 records:

- full 1280×720 master: 57.733 s;
- audio AAC;
- master + QA: 5m18s;
- sandbox-first pipeline.

The N4 measurements above are **not directly comparable** because they measure individual still renders, not a complete video production pipeline.

The correct use of #251 here is qualitative/process benchmarking:
- preserve parallelizable work;
- keep composition as a measured cost center;
- run technical + visual QA;
- do not infer quality from successful rendering alone.

## Current QA conclusion

- schemas/typecheck/tests/build: PASS in mission CI;
- smoke render: PASS;
- stress stills: PASS for inspected fixtures;
- audio mux + HTML review: PASS;
- Review Lab V2: implementation in progress;
- master publication: NOT AUTHORIZED.

`PREVIEW_PASS != MASTER_PASS`
