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
