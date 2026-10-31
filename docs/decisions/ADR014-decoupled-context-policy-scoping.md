# **ADR-014: Decoupled Core Infrastructure (Context, Policy Engine, and Strategy Scoping)**

**Status:** Accepted
**Date:** 2026-10-31
**Decision Type:** Core Platform Infrastructure / Separation of Concerns

---

## 1. Context

In a complex multi-tenant omnichannel platform serving diverse personas (**Customer Shoppers**, **Marketplace Vendors/Suppliers**, and **Enterprise Staff**), combining authorization decisions, execution context, and database filtering into views or generic middleware creates severe coupling and security vulnerabilities:
1. **Shopper Friction**: If multi-tenancy is enforced uniformly, storefront shoppers are inappropriately required to provide B2B tenant headers (`X-Company-Id`), breaking standard e-commerce login and checkout.
2. **Authorization Leaks**: When domain models or views implement their own permission checks, policies become inconsistent across HTTP endpoints, Celery tasks, and background events.
3. **Circular Dependencies**: If `core` infrastructure directly imports domain applications to evaluate their policies, the clean layered architecture breaks down.

---

## 2. Decision

We codified the core design axiom:
> **"Context provides information. Policy makes decisions. Services execute operations. Repositories enforce data access boundaries."**

We established four decoupled platform layers:

1. **Dual Context Separation (`core.context`)**:
   * **`RequestContext`**: Immutable execution context (`user_id`, `persona`, `customer_id`, `company_id`, `supplier_id`, `branch_id`, `permissions`).
   * **`ObjectContext`**: Immutable target resource context extracted server-side from verified database models via `ObjectContextBuilder`. Never accepts client-provided ownership parameters.
2. **Policy Engine & Inversion-of-Control Registry (`core.authorization`)**:
   * Pure authorization decision engine (`PolicyEngine.authorize(action, request_context, object_context)`).
   * Domain applications (`apps.shop`, `apps.customers`) register their policies (`VendorProductPolicy`, `CustomerCartPolicy`) into `PolicyRegistry` during `AppConfig.ready()`. `core` never imports domain applications.
3. **Scoping Strategy Pattern (`core.tenancy.strategies` & `core.repositories`)**:
   * **`StrategyScopedRepository`** delegates query filtering to modular strategies based on persona:
     * `CustomerOwnershipStrategy`: Isolates by `user_id` / `customer_id`, bypassing B2B tenant requirements.
     * `VendorSupplierStrategy`: Restricts merchants to their verified `supplier_id` and `company_id`.
     * `StaffHierarchyStrategy`: Scopes enterprise staff across Company, BU, and Branch.
     * `PublicCatalogStrategy`: Permits public storefront catalog browsing of active products.
4. **Selective Generic Foreign Key (GFK) Usage**:
   * Explicit Foreign Keys are mandated for all core domain relationships (Customer $\leftrightarrow$ User, Supplier $\leftrightarrow$ Company, Vendor Member $\leftrightarrow$ Supplier).
   * Generic Foreign Keys are reserved exclusively for extensible cross-cutting primitives (Policy Assignments, Audit Subjects, Generic Entity Tags).

---

## 3. Rationale

- **Zero-Friction Storefront Experience**: E-commerce customers log in, browse catalogs, and manage carts with complete privacy and zero multi-tenant company selection barriers.
- **Strict Merchant Isolation**: Vendors cannot read or mutate another vendor's catalog or orders; the policy engine and repository strategies reject mismatched access attempts.
- **Architectural Scalability**: Adding a new persona or new domain resource requires only writing a policy and registering it in the domain app, with zero modification to `core`.

---

## 4. Consequences

### Positive
- Strict separation between caller identity (`RequestContext`) and target object identity (`ObjectContext`).
- Completely framework-agnostic policy evaluation.
- All 13 security and isolation tests pass deterministically in under 3 seconds.
- 100% compliance with the Layered Import DAG.

### Negative
- Domain operations must explicitly build `ObjectContext` and invoke `PolicyEngine` before mutating entities.
