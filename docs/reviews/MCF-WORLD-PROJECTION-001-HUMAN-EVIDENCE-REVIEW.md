# MCF-WORLD-PROJECTION-001 — Human Evidence Review

Date: 2026-09-26
Mission: MCF-WORLD-PROJECTION-001
Evidence gate: CONDITIONAL / EARLY_POSITIVE_SIGNAL
Product GO: not authorized
3D: not authorized

## Human evidence

Verified:

- B(Y) structured: 5 / 8 correct
- B(Y) total task time: 296717 ms
- B(Y) errors: current state, UNKNOWN, STALE

Participant-reported:

- A(X) linear: 3 / 8 correct
- A(Z) linear: 3 / 8 correct
- linear presentation required substantially higher cognitive effort
- participant could not finish reading the full mission/context before answering
- structured presentation was experienced as easier than linear

A(X) timing is excluded because the recalled value/unit is ambiguous.

## Laura — UX

Laura interpreted the pilot as evidence favorable to structured context recovery, while explicitly rejecting a causal or generalized superiority claim.

Primary UX finding:

- linear presentation requires the user to reconstruct the operational model mentally from sequential text;
- structured presentation reduces some of that reconstruction burden;
- current state, UNKNOWN and STALE remain weak and need dedicated visual semantics.

Decision proposed by UX:

- continue with Cockpit + Timeline + focused relations;
- do not advance to 3D;
- redesign state and freshness comprehension first.

## Leonardo — Product

Leonardo classified the problem evidence as:

- context recovery cost in pure linear flow: SUPPORTED for this exploratory participant;
- full-history reading as default recovery strategy: not viable in this observed use;
- explicit structure improving recovery: EARLY_POSITIVE_SIGNAL.

Not validated:

- World superiority;
- 3D value;
- reliable time advantage;
- generalization to other users;
- causal effect of the structured interface.

## Emily — Independent Audit

Gate: CONDITIONAL / EARLY_POSITIVE_SIGNAL.

Emily confirmed that the bounded interpretation is acceptable:

- participant-reported cognitive overload in the linear condition is valid qualitative evidence;
- verified B(Y) still failed 3 of 8 tasks, including core protocol semantics;
- participant-reported A scores are corroborative but weaker than verified B evidence;
- no Product GO or general superiority claim is justified.

Emily recommends refining the structured 2D UX before any 3D experiment.

## Canonical conclusion

Supported:

> For LEANDRO in this exploratory pilot, pure linear context recovery produced materially higher perceived cognitive load, while explicit 2D structure showed an early positive signal for context recovery.

Also supported:

> The current structured design is still insufficient for reliable comprehension of current state, UNKNOWN and STALE.

Not supported:

- structured interface is generally superior;
- World is proven;
- Graph is independently valuable;
- 3D is valuable;
- Product GO.

## Next decision

Proceed with a focused 2D UX iteration only.

The next prototype should make these three concepts unmistakable:

1. current state;
2. UNKNOWN;
3. STALE.

Then run a new human comprehension test that preserves results immediately and focuses specifically on those semantics before any 3D or mutation work.
