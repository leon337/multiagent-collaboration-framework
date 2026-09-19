# N4 Performance Budgets — Initial Hypotheses

These are targets to calibrate in G7, not current measured results.

## Video Lab

- prop edit should not require a full page reload;
- component switch should reuse the Lab shell;
- registry is static/local in MVP;
- no required external fetch during preview of MCF-native components.

## Render

- no runtime network dependency;
- deterministic frame output;
- assets pinned/local;
- no unbounded timers;
- no random values without deterministic seed.

## Dependency budget

- React + Remotion core first;
- avoid UI framework in cycle 1;
- external component must declare all new dependencies;
- wildcard and `latest` are not acceptable for APPROVED imports.
