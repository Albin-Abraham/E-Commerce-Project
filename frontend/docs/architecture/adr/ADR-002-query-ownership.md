# ADR 002: Query Ownership and Prewarming

**Date:** 2026-05-24
**Status:** Accepted

## Context

Route transitions were experiencing layout shifts and waterfall requests because components fetched their own data upon mounting.

## Decision

All route-level async data must be prewarmed through React Router loaders and TanStack Query. Components must use `useQuery` exclusively to read prewarmed cache data, rather than initiating new network waterfalls.

## Consequences

- **Pros:** Eliminates waterfall rendering. Enables deep-link recovery.
- **Cons:** Loaders become heavier. Requires discipline in query key management.
