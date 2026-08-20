# MCF Architectural Checkpoint 004

Status: DRAFT_ARCHITECTURE
Canonical: false
Implementation authorized: false

## Purpose
Consolidate the MCF evolution architecture after ZRCL, Context Fabric, Truth Contracts, Artifact System and Capability Registry discussions.

## Core layers

- ZRCL: reduce recoverable cognitive load without reducing human authority.
- Context Fabric: project identity, context recovery, provenance and freshness.
- Capability Registry: model what the system can do, with verification and boundaries.
- Artifact System: standardize production of documents and artifacts.
- Validation Suite: verify behavior through scenarios, not only files.

## Context Fabric

Components:

- Project Registry
- Project Capsule
- Project Graph
- Knowledge Graph
- Capability Graph
- Freshness model
- Provenance model
- Context Recovery Receipt

## Truth Contracts

Every important claim should define:

- claim type
- owner
- source
- freshness
- provenance
- conflict handling

Claim types:

- IDENTITY
- NORMATIVE
- OPERATIONAL
- DERIVED

## Capability Registry

Capabilities are not booleans. They require:

- identity
- ownership
- implementation state
- connection state
- authorization scope
- runtime state
- verification state
- freshness
- provenance

## Validation goals

The MCF must validate:

- isolated chat context recovery
- semantic interpretation
- capability self-awareness
- documentation parity
- HUMAN_GATE preservation

## Open decisions

- final storage locations
- schemas
- lifecycle rules
- runtime integrations
- implementation sequence
