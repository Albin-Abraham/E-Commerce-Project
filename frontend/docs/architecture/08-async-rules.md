# Runtime Consistency

> Status: Mandatory Engineering Contract
> Scope: Async Behavior and Data Fetching

## 1. Query Architecture Rules

TanStack Query is the canonical async state authority.
All route-level async data MUST be prewarmed through loaders.
All feature queries MUST support deep-link recovery, refresh resilience, and cache miss recovery.
Duplicate async ownership is prohibited (no mirrored async state, disconnected cache copies, competing fetch ownership, or duplicated request orchestration).

## 2. Async Safety Rules

All async systems MUST support cancellation.
Mandatory cleanup includes requests, subscriptions, sockets, observers, timers, and listeners.
Approved cleanup mechanisms: AbortController, query cancellation, lifecycle cleanup handlers.
Unsafe async execution is prohibited.

This governance layer ensures proper retries, cancellation, optimistic rollback, reconciliation, mutation ownership, and transactional consistency.
