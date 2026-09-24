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
