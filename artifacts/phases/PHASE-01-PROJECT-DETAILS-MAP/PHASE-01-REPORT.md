# PHASE-01 Report — Project Details Map

## Team results
- Sofia: COMPLETED — `72a024906d427bb2954b8f8a5642acfb868757ff2415907ea5e5c87bc00ee159`
- Emily initial audit: COMPLETED/BLOCKED pending evidence — `f69c7997cc96387a332b95e221a17f514c5980f44f207371e2da4540aa00e663`
- Patrícia: COMPLETED — `2fe596ad135b388ce4e9fd6480ac9f8e588a2741778f0e02f92c500750535ffa`
- Rafael: COMPLETED — `6157a8484d9238c968e677fbb40879f9a161bd883a443cf556b08049b8a1c6c2`

## Live findings
All four project roots expose exactly one `button` with accessible name `Exibir detalhes do projeto`.

Observed runtime CSS IDs differ per pane and are treated as ephemeral Radix IDs.

The current Bridge `/v1/interactive` selector does not include `role=menu`, `role=menuitem` or `role=dialog`. The portal/menu/dialog structure was therefore independently verified through the desktop accessibility tree while project identity remained anchored to the Bridge WebContents URL/local binding.

## 4/4 menu inventory
- Emily: Project settings; Pin project.
- Sofia: Share; Project settings; Pin project.
- Patrícia: Share; Project settings; Pin project.
- Rafael: Share; Project settings; Pin project.

The missing Share capability on Emily is preserved as an observed difference.

## 4/4 settings dialog inventory
All four expose:
- dialog `Configurações do projeto`
- Close
- icon/color control
- Project name
- Instructions
- Memory
- Delete project

## Canonical decisions
- contract version advanced from 1.0.1 to 1.1.0;
- `chatgpt.project.details-menu` is portal-aware and stateful;
- `chatgpt.project.settings` remains semantically independent from the menu surface;
- pin is desired-state based; blind toggle is forbidden;
- icon/color, name, instructions, memory and pin are persistent-mutation controls;
- delete is destructive;
- unknown or ambiguous controls execute zero action;
- `/v1/find-click` is not approved for critical project-details actions because it is first-match behavior.

## Boundary
No title, instructions, memory, icon/color, pin state, share configuration or deletion state was changed.
