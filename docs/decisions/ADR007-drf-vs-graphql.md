# **ADR-007: DRF vs GraphQL**

**Status:** Proposed → Accepted (Hybrid approach)
**Date:** 2025-11-11
**Decision Type:** API Paradigm

---

## 1. Context

APIs will be consumed by internal web apps, admin consoles, and potentially third-party integrators. We must decide whether to standardize on Django REST Framework (DRF), GraphQL, or both.

Options:

* **DRF (REST)** only
* **GraphQL** only
* **Hybrid: DRF for core REST APIs + GraphQL as an opt-in, aggregated layer**

---

## 2. Decision

Adopt a **hybrid approach**:

* **Primary surface:** **DRF** for first-class, versioned, stable APIs used by external integrators and for clear contract-driven endpoints (`/api/v1/...`). Use DRF for write-heavy and transactional endpoints, predictable semantics, and simple object resources.
* **Optional layer:** **GraphQL** for internal web clients and admin UIs that benefit from flexible fetching and aggregated queries. GraphQL will be an **internal/opt-in** endpoint with a single schema that composes domain app types. Apply strict query complexity and depth limits and enforce authentication + permission checks.

---

## 3. Rationale

* **DRF strengths:** Explicit versioning, caching behavior, mature tooling for pagination, browsable API, and easier to document and maintain for external clients.
* **GraphQL strengths:** Flexible queries, reduces round-trips for complex UIs, and is helpful for internal dashboards where frontends need aggregated data.
* **Hybrid benefits:** Enables stable, versioned contracts for partners while offering a flexible query surface for internal UX iteration. Limits exposure of GraphQL to internal or authenticated clients to reduce misuse risk.

---

## 4. Consequences

### Positive

* Best-of-both-worlds: stable external contracts + flexible internal querying.
* Incremental adoption: GraphQL can be introduced where it provides clear benefits.
* Clear expectations for external integrators via DRF versioning.

### Negative

* Increased maintenance surface (two API paradigms).
* GraphQL complexity requires defensive measures (caching, rate limits, complexity analysis).
* Need to keep permission logic consistent between DRF and GraphQL resolvers.

---

## 5. Alternatives Considered

### DRF-only

Rejected → may cause more endpoints or round-trip inefficiencies for complex UIs.

### GraphQL-only

Rejected → poor fit for predictable, versioned external contracts and caching semantics.

---

## 6. Implementation Plan

1. Use **DRF** as the primary API in `api/v1/` modules. Leverage serializers, viewsets, pagination, throughput, and schema generation (e.g., OpenAPI).
2. Add **GraphQL** endpoint (e.g., using `ariadne` or `graphene-django`) under a guarded path (e.g., `/graphql/`) intended for internal use.
3. Share business logic/services between DRF serializers and GraphQL resolvers (no duplicate logic).
4. Enforce consistent permission checks via shared permission utilities in `core/permissions`.
5. Add GraphQL protections: query cost/complexity, depth limits, rate-limiting, and query whitelisting for sensitive operations.

---
