# **ADR-008: Caching Strategy**

**Status:** Proposed → Accepted
**Date:** 2025-11-11
**Decision Type:** Performance / Ops

---

## 1. Context

To meet performance and scalability targets, we need a caching strategy across multiple layers: HTTP responses, computed data, DB query results, and external integrations (e.g., remote APIs). We must choose caching backends, TTL patterns, invalidation strategies, and where to apply caching (client, CDN, server-side).

Options:

* No caching (baseline)
* In-memory caching (local process)
* Central cache (Redis / Memcached) + CDN for static & API responses
* Aggressive long-lived caches with complex invalidation

---

## 2. Decision

Adopt a **multi-layered caching strategy**:

* **Primary cache backend:** **Redis** (centralized, TTLs, pub/sub for invalidation).
* **CDN layer:** Use CDN (e.g., Cloudflare, Fastly) for public static assets and cacheable API GET endpoints where appropriate.
* **Server-side caching tiers:**

  * **Per-view / HTTP response caching** for idempotent, public endpoints via cache headers and Django cache middleware or DRF `@cache_response`.
  * **Low-level caching (function / data cache):** Use `django.core.cache` with Redis for expensive computed results and denormalized aggregates.
  * **Template fragment caching** for admin or heavy templates when needed.
* **Cache invalidation:** Use event-driven invalidation (Redis pub/sub or Django signals) and explicit cache key patterns. Prefer **write-through** or **explicit eviction** on model changes.
* **Short TTLs for tenant-specific data:** Avoid long global TTLs for tenant-scoped data; use tenant-aware keys.
* **Monitoring & metrics:** Track cache hit/miss rates and latency.

---

## 3. Rationale

* **Redis** provides persistence, eviction policies, pub/sub, and is well-supported.
* Multi-layered approach leverages CDN for edge caching, Redis for fast server-side caching, and per-view cache for simple rules.
* Explicit invalidation reduces stale data risk vs. blind long TTLs.
* Tenant-aware keys prevent cross-tenant contamination.

---

## 4. Consequences

### Positive

* Improved latency and reduced DB load.
* Flexible cache control for different API surfaces.
* Operational observability (metrics on hits/misses).

### Negative

* Complexity in invalidation logic and cache key management.
* Potential stale data windows if invalidation is misconfigured.

---

## 5. Alternatives Considered

### Memcached instead of Redis

Rejected → lacks pub/sub and richer data structures; Redis preferred.

### Heavy long-lived caching with eventual consistency

Rejected → unacceptable data-staleness risk for core transactional views.

---

## 6. Implementation Plan

1. Deploy Redis as the canonical cache backend (clustered for production).
2. Configure Django `CACHES` to use Redis and set up cache key versioning.
3. Add CDN in front of public APIs and static assets; set `Cache-Control` headers appropriately.
4. Implement tenant-aware cache keys (`tenant:{id}:...`) and model signal-based invalidation utilities in `core/cache.py`.
5. Use `django-redis` or similar library for integration and set up metrics (Prometheus) to monitor hit/miss rates.
6. Document caching patterns and create helper decorators for function-level caching and safe invalidation.

---
