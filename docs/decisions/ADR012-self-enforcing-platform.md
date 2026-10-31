# **ADR-012: The Self-Enforcing Engineering Platform & Multi-Tenant Fortress**

**Status:** Accepted
**Date:** 2026-10-31
**Decision Type:** Architectural Governance / Reliability & Security Invariants

---

## 1. Context

As ZenOS Unified Commerce expands across omnichannel storefronts, POS terminals, procurement lifecycles, and financial subledgers, relying exclusively on developer memory or code review guidelines for architectural compliance proved insufficient. Key enterprise risks included:
1. **Architectural Erosion**: Accidental circular imports or business calculations leaking into Django ORM models (`.save()` or `.clean()`).
2. **Multi-Tenant Data Breaches**: Relying solely on HTTP middleware for tenant scoping leaves background workers, management commands, and repository queries vulnerable to accidental cross-tenant data leaks.
3. **Event Loss & Dual-Write Inconsistencies**: Direct event publishing during database transactions risks data corruption if DB commits succeed while network dispatch fails.

---

## 2. Decision

We evolved ZenOS into a **Self-Enforcing Engineering Platform** organized around five foundational disciplines:

1. **Automated Architecture Fitness Functions**:
   * CI-enforced AST scanners (`check_layer_boundaries.py`, `check_model_business_logic.py`, `check_tenant_scoping.py`, and `check_import_dag.py`) automatically reject pull requests violating layer isolation or domain purity.
2. **Four-Layer Multi-Tenant Isolation**:
   * **Layer 1 (Middleware)**: Ingests and validates tenant context into thread-safe `contextvars`.
   * **Layer 2 (Application/ACL)**: Verifies caller permissions and object ownership.
   * **Layer 3 (Repository)**: `TenantScopedRepository` guarantees every database query and mutation is strictly filtered by `company_id`. Cross-tenant ID tampering raises `TenantAccessViolationError`.
   * **Layer 4 (Database Constraints)**: Compound database unique constraints (`code` + `company_id`).
3. **Dedicated Security Regression Suite**:
   * Automated verification in `tests/security/test_tenant_isolation.py` ensuring zero cross-tenant leakage.
4. **Transactional Outbox Strategy (P1 Blueprint)**:
   * Event recording bundled atomically inside `transaction.atomic()`, followed by reliable asynchronous Celery relay via `transaction.on_commit()`.

---

## 3. Rationale

- **Zero-Tolerance Multi-Tenant Security**: Multi-tenant isolation is enforced at the repository level; even if an engineer writes an un-scoped query, the repository rejects the operation unless an explicit tenant context is established.
- **Fail-Fast Architectural Defense**: Violations of Clean Architecture or the "Dumb Model" pivot fail in CI within milliseconds rather than escaping to production.
- **Auditability**: Security access violations (e.g. attempting to fetch another company's record by guessing IDs) raise explicit security alert exceptions rather than masking as harmless 404s.

---

## 4. Consequences

### Positive
- Strict, mathematically verifiable boundaries across all 11 domain modules.
- Complete tenant data safety across HTTP endpoints, Celery workers, and CLI management commands.
- High test execution speed: 6 security tests run in 0.50 seconds without mocking.

### Negative
- Domain repositories must be instantiated via `TenantScopedRepository(Model)` or explicit scoping; direct `Model.objects.all()` is restricted on tenant-bound entities.

---

## 5. Alternatives Considered

### Relying solely on RequestContextMiddleware
Rejected → Celery background tasks, management scripts, and asynchronous event consumers operate outside the HTTP request lifecycle, leaving them vulnerable to missing tenant context.

### Database Row-Level Security (PostgreSQL RLS) only
Deferred → While PostgreSQL RLS is powerful, it adds operational complexity to local SQLite testing environments and migrations. Layer 3 repository scoping provides cross-platform protection across both SQLite (testing) and PostgreSQL (production).
