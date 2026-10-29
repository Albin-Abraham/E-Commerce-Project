# ADR 003: Feature Communication

**Date:** 2026-05-24
**Status:** Accepted

## Context

Features previously communicated via global Redux stores, leading to monolithic state coupling.

## Decision

Features must communicate exclusively through explicit props, domain events, shared runtime services, or public contracts. Global state is strictly reserved for platform-level concerns.

## Consequences

- **Pros:** High feature autonomy and testability.
- **Cons:** Event choreography can become complex if not strictly typed.
