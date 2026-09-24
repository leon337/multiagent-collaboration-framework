# PHASE-01 Decisions

1. Project Details is modeled as validated trigger + portalled overlay, not a DOM child relationship.
2. Radix IDs are runtime-only evidence and never canonical locators.
3. Runtime handles are discarded after every open/close/submenu transition.
4. Exactly one candidate is required for critical actions.
5. Project Settings opening is navigation/inspection; editing fields is a separate persistent mutation.
6. Pin uses desired-state operations; blind toggle is forbidden.
7. Emily lacks the Share menu item in the observed state; the difference remains explicit.
8. Current Bridge `/v1/interactive` does not expose menu/menuitem/dialog roles; AT-SPI supplied structural evidence for this mapping.
9. `/v1/find-click` is not authorized as a critical resolver because it selects the first compatible element.
10. Contract advanced to v1.1.0.
11. No persistent project setting was changed in this mission.

12. The Project Settings child overlays are independently portalled and require fresh resolution.
13. Icon/color is persistent only on selection; opening/dismissing its overlay is inspection.
14. Memory mode is read from the checked `radio menu item`, not from button text.
15. Dated local state: Emily=standard memory; Sofia/Patrícia/Rafael=project-only.
16. Fixed sleeps are not sufficient; critical overlay transitions use bounded state waits.
17. Contract remains generic: local project availability/state evidence belongs in PRF/local evidence, not the generic semantic identity.
18. Duplicate icon/color IDs were reconciled; `chatgpt.project.settings.icon-color` is canonical.

12. Emily R2 removed H1-H6 as blockers but found H7 (stale manual hash) and M1 (invalid Memory ARIA role).
13. M1 was corrected by using `menuitemradio`; contract patch version is 1.1.1.
14. H7 is remediated by regenerating canonical hashes after all semantic/doc changes.
15. R2 showed Share absent in all four projects, contradicting its earlier three-project appearance; therefore Share is runtime-optional and absence is not semantic drift.
16. Smoke R2 passed 4/4 with no persistent mutation.

17. The Vercel commit status failure is classified as EXTERNAL_NON_REQUIRED for this Class B documentation/mapping mission because its target reports a free-plan build-rate-limit, no Vercel deployment is in scope, and the repository's canonical PR gates for this phase are Documentation Validation and MCF Production Readiness.
18. The Vercel failure remains recorded; it is not rewritten as success and no production/deployment claim is made from it.
