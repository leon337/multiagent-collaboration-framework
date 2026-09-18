# Decisions

1. GitHub live remains the source of truth for current repository state.
2. On `leo-N43SM`, `/home/leo/mcf-workspaces/leo/multiagent-collaboration-framework` is the canonical entry workspace.
3. Other local MCF copies remain isolated, legacy or recovery workspaces; they are not default entrypoints.
4. Bubble execution uses `CHATGPT_BUBBLE_LOCAL_SANDBOX`.
5. Brainbase is not executor for this mission; notebook is not runtime.
6. Local parallel workers must not be represented as independent cognitive LLM agents without a verified backend.
7. Project Registry v1 remains unchanged because it has no valid local-workspace-path field.
