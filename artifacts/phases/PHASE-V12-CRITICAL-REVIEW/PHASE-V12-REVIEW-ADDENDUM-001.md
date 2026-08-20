# PHASE V1.2 — Review Addendum 001

## F-11 — `main` branch protection is disabled

Severity: `CRITICAL`

Live GitHub evidence for `main@439da7b6479718f6545144954937b8c4358d7c46` reports:

- `protected: false`;
- protection `enabled: false`;
- required status check enforcement `off`;
- no required status check contexts.

## Impact

Documented HUMAN_GATE, review and qualification rules are not technically enforced at the branch boundary. A future v1.2 process can therefore be bypassed by a direct branch mutation if repository permissions permit it.

## Required correction before v1.2 release

- define branch protection/ruleset for `main`;
- require the v1.2 qualification checks chosen by the project;
- prevent ordinary direct pushes to the stable integration boundary;
- preserve an explicit controlled emergency path rather than relying on unrestricted branch writes;
- validate the branch rule itself as part of release qualification.

Verdict: `MUST_FIX_BEFORE_V1.2_RELEASE`.
