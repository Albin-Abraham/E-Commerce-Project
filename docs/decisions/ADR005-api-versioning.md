# **ADR-005: API Versioning Strategy**

**Status:** Proposed → Accepted
**Date:** 2025-11-11
**Decision Type:** API Design / Compatibility

---

## 1. Context

The system exposes programmatic APIs consumed by internal frontends, partner integrations, and third-party clients. API changes will inevitably be required (new fields, behavior changes, deprecations). We must choose a versioning strategy that balances backward compatibility, discoverability, and operational simplicity.

Options considered:

* **URI versioning** (`/api/v1/...`)
* **Header versioning** (`Accept: application/vnd.myapp.v1+json` or custom `X-API-Version`)
* **No explicit versioning + semantic changes**
* **Media-type negotiation**

---

## 2. Decision

Adopt **URI versioning** (`/api/v1/`, `/api/v2/`), combined with **deprecation policy** and **semantic stability guarantees** within each major version. Use minor/patch-level changes without changing the major version. Document versions in API docs and publish deprecation timelines.

---

## 3. Rationale

* **Simplicity & discoverability:** URIs are easy to test, cache, and route; developers easily see the version.
* **Caching & proxies:** Works cleanly with HTTP caching and CDNs.
* **Tooling compatibility:** Most client libraries, API gateways, and docs generators work well with URI versions.
* **Clear contract boundaries:** Major versions indicate breaking change windows.
* **Operational clarity:** Easier monitoring, routing, and gradual migration of clients.

---

## 4. Consequences

### Positive

* Clear and explicit versioning in endpoints.
* Easier migration path for clients.
* Simpler routing rules and API gateway configuration.

### Negative

* Potential duplicate code/handlers across major versions if endpoint logic diverges.
* Slightly longer URLs.

---

## 5. Alternatives Considered

### Header-based versioning

Rejected → opaque for many clients, harder for caching and quick testing (curl/browser).

### No explicit versioning

Rejected → risky for backward compatibility.

---

## 6. Implementation Plan

1. Create routing prefix in Django (`path('api/v1/', include('api.v1.urls'))`).
2. Versioned packages/modules (e.g., `api/v1/`, `api/v2/`) with shared utilities in `core/api/`.
3. Maintain compatibility tests for each major version.
4. Add deprecation header (`Sunset` / custom `X-Deprecation-Info`) and documentation with an explicit migration timeline (e.g., 90–180 days).
5. Use API gateway or reverse proxy rules to route traffic and optionally shadow new versions for testing.

---
