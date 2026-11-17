# Mission plan — MCF-PET-TOOLS-READONLY-001

Authority: LEANDRO. Orchestration: MESTRE.
Repository: leon337/multiagent-collaboration-framework.
Official controls: AGENTS.md, MCF-DEC-052, MCF-DEC-055.
Host: leo-N43SM; MESTRE Agent 8878; MCF Service Hub 8898.

Goal: instrument the existing Pet with verified READ_ONLY status queries
during Gemini Live voice, without granting operational execution.

Deliverables: five fixed tools, opt-in by session, HMAC scope-bound tickets,
bounded Gemini function call/response, UI receipts, private audit records,
speech after tool calling, regression tests and local rollback.

Explicit non-goals: shell, browser automation, write calls, MissionRuntime
mutation, external communications, passwords, HUMAN_GATE, financial or
irreversible actions, central production deployment and new network ports.

Gates: unit tests, Gemini tool call and audio, privacy disclosure, no-tools
regression, browser desktop/mobile, file integrity and CI/PR review.
