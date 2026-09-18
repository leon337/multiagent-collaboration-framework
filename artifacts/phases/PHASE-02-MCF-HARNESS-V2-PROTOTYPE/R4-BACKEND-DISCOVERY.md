# R4 Backend Discovery — Bubble-Native Cognitive Executor

Mission: `MCF-HARNESS-REVERSE-ENGINEERING-DSH-AGENT-TEAMS-001`
Date: 2026-09-18
Status: `BLOCKED_G08`

## What is implemented

The Harness now has a durable executor boundary with:
- `CognitiveExecutor` interface;
- `LocalProcessExecutor` reference adapter;
- `doctor`, provision, start, interrupt, resume, collect, dispose;
- durable checkpoint per execution;
- per-execution append-only event log;
- SIGKILL crash recovery by a new executor instance;
- mission-state survival independent of executor process lifetime.

The reference adapter deliberately reports `cognitive=false`.

## Validation

Local bubble suite: **16/16 PASS**.

New integration coverage includes:
1. doctor truthfully reports non-cognitive execution;
2. provision/start/complete/collect;
3. SIGKILL then resume from another executor instance;
4. Mission Journal survives executor crash and final execution receipt is appended after recovery.

## Cognitive backend discovery

Observed inside the current ChatGPT bubble:
- no `dsh` binary;
- no `ollama`;
- no `llama-cli`;
- no verified generic native subagent-spawn tool;
- OpenAI Python package presence does not establish an API credential;
- connected tools such as Quickchat/Floot/OpenAI API setup route through external services and therefore do **not** satisfy the canonical local execution boundary;
- Brainbase remains explicitly excluded by LEANDRO.

## Decision

Do not fake cognition and do not silently substitute an external provider.

R4A = PASS.
R4B/G08 = BLOCKED until a genuinely bubble-native independent cognitive backend becomes available or LEANDRO changes the execution-boundary requirement.
