# MCF UI Operating Manual — ChatGPT / Dual Browser Cockpit

**Mission:** MCF-UI-SEMANTIC-MANUAL-001  
**Issue:** #361  
**Contract:** `mcf-ui-semantic-contract/v1`  
**Status:** CURRENT_IMPLEMENTED for the documented operating model; runtime resolver automation remains a separate evolution.

## 1. Purpose

This manual is the persistent operating knowledge for MESTRE and MCF agents when interacting with ChatGPT inside the Dual Browser Cockpit.

A future session must **not rediscover basic controls from screenshots or screen coordinates**. It must start from the canonical semantic IDs and resolve them against the current DOM/WebContents state.

Core rule:

```text
semanticId is persistent
locator strategy is versioned
runtime locator is ephemeral
click is not success
post-action validation decides success
ambiguity means no action
```

## 2. Stable vs volatile layers

### Stable concept
Human meaning independent of UI implementation.

Examples:
- open a project
- start a new chat
- type in the composer
- send
- stop generation
- identify current conversation
- address the Cockpit chat/workspace panes

### Canonical semantic identity
Versioned machine-readable ID, for example:

- `chatgpt.project.emily`
- `chatgpt.project.sofia`
- `chatgpt.project.patricia`
- `chatgpt.project.rafael`
- `chatgpt.action.new-chat`
- `chatgpt.composer.primary`
- `chatgpt.composer.submit`
- `chatgpt.generation.stop`
- `chatgpt.conversation.current`
- `cockpit.pane.chat`
- `cockpit.pane.workspace`

### Versioned locator strategies
Ordered ways to resolve the semantic identity.

### Runtime observation
The concrete selector/DOM node observed in one execution. It is diagnostic evidence, **not persistent identity**.

### Visual evidence
Screenshot or screen observation. Secondary validation/fallback only; never the primary locator for critical actions.

## 3. Resolution policy

For critical elements:

```text
PRECONDITION
→ WAIT READY/STABLE
→ RESOLVE CANDIDATES
→ 0 matches: next documented fallback or NOT_FOUND
→ 1 match: validate invariants
→ >1 matches: AMBIGUOUS → NO ACTION
→ REVALIDATE target identity immediately before action
→ ACTION
→ POSTCONDITION
→ PASS or UNVERIFIED/FAIL
```

Never use `first match wins` for a critical action.

Do not downgrade silently to a weaker locator when a stronger locator has become ambiguous. Ambiguity itself is drift evidence.

## 4. Locator priority

Preferred order:

1. stable product-owned identifiers: `data-testid`, stable `id`, project/conversation ID;
2. role + accessible name inside a canonical scope;
3. stable semantic attributes/relations;
4. exact localized text inside a canonical scope;
5. documented CSS fallback;
6. runtime discovery for diagnosis only.

Not canonical:
- physical coordinates;
- pixel matching;
- screenshots;
- generated class chains;
- `:nth-of-type` / DOM indexes;
- “third button from the left”.

## 5. Canonical ChatGPT elements

### `chatgpt.project.<agent>`

Concept: open the canonical project for one agent.

Strong runtime signals currently observed:
- anchor/link;
- accessible label pattern `Abrir projeto <PROJECT NAME>`;
- project href ending in `/project`;
- local binding contains the certified project identifier/href.

Validation after opening:
- current URL/project identity matches the requested local binding;
- pane remains the expected pane;
- project context is the expected agent project.

Visible project text alone is not sufficient if duplicates exist.

### `chatgpt.action.new-chat`

Concept: create a clean conversation.

Observed semantic signal:
- accessible name `Novo chat` / documented locale equivalent.

Postcondition:
- previous conversation is no longer current;
- composer is available;
- old conversation turns are not treated as the new conversation.

### `chatgpt.composer.primary`

Preferred current locator: `#prompt-textarea`.

Observed invariants:
- role `textbox`;
- accessible name currently `Converse com o ChatGPT`;
- visible/editable in the expected pane.

### `chatgpt.composer.submit`

This is a **stateful control**, not a fixed visual button.

The same runtime element may represent:
- send when idle and composer is actionable;
- stop when generation is active.

Do not identify it by screen position.

### `chatgpt.generation.stop`

Observed state in pt-BR includes `Parar de responder`.

Resolution must combine:
- generation-active precondition;
- strong test ID/state when available;
- role/accessibility aliases as fallback;
- expected pane/conversation.

Postcondition:
- generation becomes inactive.

This does **not** by itself prove a valid terminal assistant result; lifecycle validation remains specialized.

### `chatgpt.conversation.current`

Primary identity is derived from the current WebContents URL/conversation ID, not from sidebar title.

### Message turns

Preferred structural signals:
- `data-message-author-role=user`;
- `data-message-author-role=assistant`;
- message IDs / conversation-turn IDs when available.

## 6. Cockpit elements

Cockpit-owned UI has stronger contracts because MCF controls the implementation.

Primary identity for panes is the runtime pane binding:
- `cockpit.pane.chat` → pane `chat`;
- `cockpit.pane.workspace` → pane `workspace`.

Physical left/right position is presentation only.

Cockpit-owned IDs/`data-pane`/`data-action` can be treated as strong locators when explicitly maintained as stable.

## 7. Local bindings

Account-specific project IDs, project hrefs and names **must not be embedded in the generic public contract**.

On an authorized workstation, load the local semantic binding profile from the MCF/Dual Browser configuration. It maps:

```text
chatgpt.project.emily    → certified Emily project identity
chatgpt.project.sofia    → certified Sofia project identity
chatgpt.project.patricia → certified Patrícia project identity
chatgpt.project.rafael   → certified Rafael project identity
```

The binding is local evidence; the semantic ID remains portable.

## 8. Drift states

Canonical outcomes:
- `RESOLVED`
- `NOT_FOUND`
- `AMBIGUOUS`
- `STALE_TARGET`
- `NOT_ACTIONABLE`
- `CONTEXT_CHANGED`
- `VALIDATION_FAILED`
- `UI_SEMANTIC_DRIFT`

Critical rule: all ambiguous/stale/context-changed outcomes execute **zero action**.

## 9. Recovery

Safe automatic recovery is allowed only before an effect is known to have occurred:
- wait for loading/hydration;
- expand a collapsed sidebar through its own semantic control;
- bounded scroll of the correct semantic container;
- take a fresh DOM snapshot;
- re-resolve.

After a potentially effective action, check the postcondition before retrying.

## 10. Human manual and machine contract

This document and the machine-readable contract use the same canonical semantic IDs. They must not evolve independently.

A runtime observation may suggest a new locator, but promotion is deliberate:

```text
drift detected
→ capture DOM/accessibility/WebContents evidence
→ reproduce
→ validate candidate
→ update contract
→ increment contract version
→ smoke
→ independent audit
```

Runtime observation must never auto-edit the canonical manual.

## 11. Current verified observations (2026-09-24)

Across the four live agent panes, MESTRE observed:
- project anchors with accessible names `Abrir projeto ...` and project hrefs;
- `#prompt-textarea` as the primary composer;
- role `textbox` and accessible name `Converse com o ChatGPT`;
- `#composer-submit-button` as a stateful submit/stop control;
- `Parar de responder` during active generation;
- `Novo chat` as the new-conversation action;
- pane isolation through the Cockpit instance/pane runtime.

These observations are evidence for this version. They are not promises that ChatGPT's external DOM will never change.

## 12. Startup procedure for future MESTRE sessions

Before operating the UI:

1. read this manual;
2. read the machine-readable semantic contract;
3. load the authorized workstation's local bindings;
4. verify target instance and pane;
5. resolve by canonical semantic ID;
6. fail closed on ambiguity/drift;
7. validate every critical action by its postcondition.

For a request such as “open a new chat inside Emily's project”, MESTRE should not map the screen from scratch. It should execute the documented semantic workflow:

```text
resolve chatgpt.project.emily
→ open and validate Emily project context
→ resolve chatgpt.action.new-chat
→ activate
→ validate fresh conversation
```

## 13. Audit requirements

An implementation claiming compliance must prove:
- no critical first-match behavior;
- no primary coordinate/screenshot locator;
- uniqueness/cardinality checks;
- immediate stale-target revalidation;
- postcondition for send/new-chat/stop/project navigation;
- pane isolation;
- adversarial ambiguity test with zero clicks;
- real smoke in Emily, Sofia, Patrícia and Rafael projects;
- no Critical/High residual finding from independent audit.


## 14. Project details and settings surface

Mission: `MCF-PROJECT-DETAILS-MAP-001`  
Issue: #363  
Contract extension: `mcf-ui-semantic-contract/v1` version `1.1.0`.

### 14.1 Canonical trigger

Semantic ID:

```text
chatgpt.project.details-menu
```

Observed trigger in all four certified project pages:

```text
role/button
accessible name = "Exibir detalhes do projeto"
```

The runtime CSS IDs observed in the four panes were different `#radix-*` values. They are runtime-only and must never be persisted as canonical identity.

Resolution rules:

```text
validate instance/pane/project
→ resolve exactly one project-details trigger
→ revalidate current project
→ activate
→ resolve the active portalled menu
→ validate menu belongs to the same project invocation
```

A click on the trigger is not success by itself.

### 14.2 Portal model

The project menu is rendered as a portal-capable overlay. Do **not** require the menu to be a DOM descendant of the trigger.

The semantic relation is:

```text
validated project
  → validated details trigger
    → active correlated menu overlay
      → menu items
```

Generated Radix IDs, `aria-controls` values and concrete DOM nodes may be used only as ephemeral runtime evidence.

After every open/close/submenu transition, discard old runtime handles and resolve again.

### 14.3 Current 4/4 inventory

On 2026-09-24, the accessibility tree exposed the active overlay as:

```text
menu "Exibir detalhes do projeto"
```

Observed menu items:

| Project | Share | Project settings | Pin |
| --- | --- | --- | --- |
| Emily / EMILLY | absent | present | present |
| Sofia / SOPHIA | present | present | present |
| Patrícia / PATRICIA - MCF | present | present | present |
| Rafael / RAFAEL - MCF | present | present | present |

The absence of Share in Emily is a real capability difference in the observed state and must not be normalized by choosing a similar control.

Canonical semantic IDs:

```text
chatgpt.project.share
chatgpt.project.settings
chatgpt.project.pin
```

### 14.4 Project settings

Opening `chatgpt.project.settings` is an inspection/navigation action in this mission. It must resolve exactly one menu item named `Configurações do projeto` inside the correlated details menu.

Postcondition:

```text
exactly one dialog "Configurações do projeto"
AND current project unchanged
AND no persistent project field changed
```

Observed 4/4 settings surface:

```text
dialog "Configurações do projeto"
├── button "Fechar"
├── button "Abrir menu de ícone e cor do projeto. ..."
├── entry "Nome do projeto"
├── entry "Instruções"
├── button "Memória"
└── button "Excluir projeto?"
```

Canonical semantic IDs:

```text
chatgpt.project.settings.dialog
chatgpt.project.settings.close
chatgpt.project.settings.icon-color
chatgpt.project.settings.name
chatgpt.project.settings.instructions
chatgpt.project.settings.memory
chatgpt.project.settings.delete
```

Effect classification:

| Semantic ID | Effect class | Allowed in mapping/smoke |
| --- | --- | --- |
| `chatgpt.project.details-menu` | transient UI state | inspect/open/dismiss |
| `chatgpt.project.settings` | navigation | inspect/open |
| `chatgpt.project.settings.close` | read-only | activate |
| `chatgpt.project.share` | navigation/capability | inspect only in this mission |
| `chatgpt.project.pin` | persistent mutation | inspect only |
| `chatgpt.project.settings.icon-color` | persistent mutation | inspect only |
| `chatgpt.project.settings.name` | persistent mutation | inspect only |
| `chatgpt.project.settings.instructions` | persistent mutation | inspect only |
| `chatgpt.project.settings.memory` | persistent mutation | inspect only |
| `chatgpt.project.settings.delete` | destructive | inspect only |

Unknown controls default to `UNKNOWN → NO ACTION`.

### 14.5 Pin state

Do not expose a blind `togglePin()` operation.

Use desired state:

```text
setPinned(true)
setPinned(false)
```

Observed action labels classify the current state:

```text
"Fixar projeto"    → current state unpinned → effect pinned
"Desafixar projeto" → current state pinned   → effect unpinned
```

If the state cannot be proven, return `VALIDATION_FAILED` and perform no action.

### 14.6 Current Bridge limitation

The current `/v1/interactive` snapshot filters interactive nodes to anchors, buttons, inputs, textarea/select, role=button/link and contenteditable nodes. It does not currently expose `role=menu`, `role=menuitem` or `role=dialog`.

Therefore, for this mapping mission, portal/menu/dialog structure was verified through the desktop accessibility tree (AT-SPI) while the WebContents URL and project binding remained the primary project-context evidence.

This is acceptable as evidence, but a future critical-action implementation should add a dedicated portal-aware semantic resolver instead of using `/v1/find-click` or first-match behavior.

### 14.7 Fail-closed behavior

For all project-details controls:

```text
0 candidates → documented fallback or NOT_FOUND
1 candidate  → validate invariants and current project
>1 candidates → AMBIGUOUS → ZERO ACTION
stale node → STALE_TARGET → ZERO ACTION
project/pane changed → CONTEXT_CHANGED → ZERO ACTION
unknown effect → UNKNOWN → ZERO ACTION
```

After any action with possible persistent effect, do not retry until the postcondition proves whether the effect occurred.



### 14.8 Child settings overlays

The settings dialog exposes additional portalled surfaces. They are separate semantic surfaces and must be resolved again after opening.

#### Icon/color

Canonical control:

`chatgpt.project.settings.icon-color`

Observed on 2026-09-24:

```text
button "Abrir menu de ícone e cor do projeto. ..."
  → menu with the same accessible context
    → button "Cor personalizada"
    → menu item "Fechar menu"
```

Selecting an icon/color is a persistent mutation and is **not** allowed by a mapping-only mission. Opening/dismissing the overlay is inspection.

#### Memory

Canonical control:

`chatgpt.project.settings.memory`

Observed memory values:

```text
radio menu item "Memória padrão ..."
radio menu item "Memória somente no projeto ..."
```

Semantic states:

- `standard`: project may access external chat memory and vice-versa;
- `project-only`: project can access only its own memory; its memory is hidden from external chats.

The checked radio item is the state source. The visible button text `Memória` alone does not prove the selected state.

Current workstation observation on 2026-09-24:

| Project | Observed memory state |
| --- | --- |
| Emily / EMILLY | `standard` |
| Sofia / SOPHIA | `project-only` |
| Patrícia / PATRICIA - MCF | `project-only` |
| Rafael / RAFAEL - MCF | `project-only` |

This table is dated evidence, not a permanent contract invariant. Always resolve the live checked radio state before relying on isolation assumptions.

### 14.9 Scope discipline for future mutations

Opening/dismissing project menus, settings dialogs and child overlays is transient inspection.

The following require an explicit mutation mission and human authority:

- pin/unpin;
- change project name;
- change instructions;
- choose icon/color;
- change memory mode;
- destructive project deletion;
- any share action that changes access or membership.

For these controls, do not use `/v1/find-click` as an authority because its current behavior is first matching element. A critical action must count candidates, revalidate the project/pane immediately before activation and prove the postcondition afterward.
