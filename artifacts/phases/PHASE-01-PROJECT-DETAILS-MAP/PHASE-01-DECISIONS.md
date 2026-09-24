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
