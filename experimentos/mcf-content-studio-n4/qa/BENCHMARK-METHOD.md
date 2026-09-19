# N4 benchmark method

Benchmarking is evidence, not a universal performance promise.

Cycle 1 records:
- typecheck/test/build result;
- pilot still wall time;
- portrait component still wall time;
- runner environment and Node version.

Rules:
- compare on the same CI runner class where possible;
- store raw JSON as an artifact;
- do not compare a still and a full MP4 as equivalent workloads;
- regression thresholds are defined only after at least two stable baselines.
