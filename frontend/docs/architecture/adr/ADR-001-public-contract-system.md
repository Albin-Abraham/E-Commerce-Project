# ADR 001: Public Contract System

**Date:** 2026-05-24
**Status:** Accepted

## Context

Features in ZenOS were previously coupled via internal imports, causing brittle boundaries and cross-feature regressions.

## Decision

We will establish a strict `public/` and `internal/` directory separation for all features. The `public/` directory will serve as the sole contract boundary for external consumers.

## Consequences

- **Pros:** Guarantees boundary isolation. Safely allows internal refactors.
- **Cons:** Increases boilerplate for exposing explicit contracts.
