# MCF v1.1 — I1 Technical Gate 001

**Mission:** `MCF-V1.1-CODEX-IMPLEMENTATION-001`  
**Window:** `I1`  
**Gate:** `RETORNAR_PARA_CORRECAO`  
**Orchestrator:** `MESTRE`  
**Human authority:** `LEANDRO`  
**Implementation candidate reviewed:** `89035db6bfc1022abcc622b1238c86033409180d`

## 1. GitHub state verified

```yaml
implementation_branch: feat/mcf-v1.1-project-intake-continuity
candidate_head: 89035db6bfc1022abcc622b1238c86033409180d
implementation_base: 5dc055cb7d402e5774b40b82723a8f008cd00e80
compare_status: ahead
ahead_by: 3
behind_by: 0
changed_paths: 19
```

The remote HEAD matches the Codex receipt. The diff is limited to the declared contract/schema/test boundary and introduces no database migration or parallel runtime subsystem.

## 2. Positive findings

- v1.1 Mission Contract metadata is additive/optional;
- legacy Mission Contract shape remains representable;
- PIP, PRR, Alignment Receipt, entry/resume routes, Standing Authorization and checkpoint extension are present;
- CAF checkpoint remains backward-compatible by accepting the legacy shape;
- Standing Authorization schema rejects wildcard action/environment scope and requires non-empty action/environment lists;
- PRR `FACT` requires at least one evidence reference;
- human decision provenance requires at least one human-origin provenance item;
- no new DB state was introduced;
- no parallel Mission Runtime contract universe was created.

## 3. Blocking I1 finding — provenance enforcement incomplete

The approved preimplementation conformance requires material PIP/PRR assertions to preserve provenance/evidence classification.

At candidate HEAD `89035db6...`:

1. `project-intent-package-v1.schema.json` requires the `provenance` property for each intent dimension, but the array has no `minItems`; therefore `provenance: []` is valid.
2. The repository's own `project-intent-package.valid.json` fixture uses `provenance: []` on multiple `CLEAR` and `BLOCKING` dimensions, proving that the current schema accepts material intent claims with no provenance.
3. `technicalDelegations[].provenance` and `assumptions[].provenance` also have no non-empty constraint.
4. `project-reality-report-v1.schema.json` requires observation `provenance` as a property but also allows an empty array. A PRR observation is a material reality assertion and must carry provenance classification even when evidence requirements differ by assertion kind.

This is incompatible with the approved rule that material claims preserve provenance and with the preimplementation evidence/audit condition that every PIP/PRR material assertion has provenance/evidence classification.

## 4. Required correction

Codex must remain in I1 and produce a successor candidate that:

- enforces non-empty provenance for PIP intent dimension records;
- enforces non-empty provenance for PIP technical delegations;
- enforces non-empty provenance for PIP assumptions;
- enforces non-empty provenance for PRR observations;
- updates the PIP valid fixture so every populated/material dimension has real classified provenance;
- adds negative tests proving empty provenance is rejected in the above material-assertion locations;
- preserves existing human-decision provenance constraints and PRR FACT evidence constraints;
- reruns focused contract/schema tests and the relevant regression required by I1;
- commits and pushes the correction on the same implementation branch;
- returns a new exact HEAD receipt to MESTRE.

If Codex finds a legitimate semantic reason that any of these material assertion categories must permit empty provenance, it must stop and return a contract/conformance finding instead of weakening the approved rule silently.

## 5. Gate verdict

```yaml
I1_candidate_89035db6: NOT_ACCEPTED_FOR_I2_YET
blocking_findings: 1
correction_scope: I1_ONLY
new_human_gate_required: false
I2_authorized: false
next_action: CODEX_I1_CORRECTION_AND_NEW_RECEIPT
```

The local test results reported by Codex remain useful evidence, but they do not override a contract-level defect discovered by review. I2 stays blocked until a corrected exact HEAD passes this gate.
