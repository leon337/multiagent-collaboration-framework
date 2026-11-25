# MCF Agent Workspace v0.1 — Product Proposal

Mission: MCF-AGENT-WORKSPACE-001

## Problem

The Dual Browser started as a two-surface tool:

    ChatGPT | operational browser

As multi-agent usage grew, the product was replicated into multiple application instances to host more agents.

That proved the orchestration model, but introduced:
- multiple desktop windows;
- weak global visibility;
- fragmented agent/session awareness;
- duplicated Chromium rendering;
- difficult state scanning;
- friction when switching among specialists.

## Product direction

Create a single multi-agent operations workspace.

The first visual model is one main container with up to eight Agent Slots.

A slot represents an agent presence. It does not imply a fully rendered browser or a separate desktop window.

## Core concepts

### AgentIdentity

Who the agent is.

### AgentSession

The concrete conversation/runtime session currently associated with the agent.

### AgentSlot

The presentation location of the agent inside the Workspace.

### OperationalSurface

The focused surface used to operate the selected agent:
- ChatGPT;
- browser;
- terminal;
- files;
- Git/GitHub;
- evidence viewer;
- later MCF World entrypoints.

## Main modes

### Overview

Global scan of up to eight agents.

### Mission

Shows only agents participating in a non-terminal mission.

### Focus

One selected agent plus a large Operational Surface.

## Resource principle

Eight slots must not mean eight continuously rendered Chromium surfaces.

Non-focused sessions may be suspended or represented only by state.

## Migration strategy

1. Read existing Dual Browser instance state.
2. Make Agent Workspace the global overview.
3. Move selected session into one shared Operational Surface.
4. Move new agent operations into Workspace.
5. Prove parity with a real multi-agent mission.
6. Keep Dual Browser only as fallback.
7. Resume MCF World integration against Agent Workspace.

## Governance boundary

Agent Workspace is not:
- a new MCF runtime;
- a canonical mission state machine;
- an authorization engine;
- an evidence authority;
- a replacement for canonical providers.

It is an operational/presentation surface.

## Phase 1

Read-only compatibility layer over existing Dual Browser state.

No legacy state deletion.
No automatic cookie/profile migration.
No session mutation.
No production cutover.
