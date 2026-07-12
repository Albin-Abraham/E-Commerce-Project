# **ADR-002: Domain App Structure (Functional / Vertical Slice Architecture)**

**Status:** Accepted
**Date:** 2025-11-11
**Decision Type:** Architectural Structure (Domain Layer Company)

---

## **1. Context**

The application includes modules such as Users, Billing, Inventory, App Pages, Roles, Permissions, etc.
A decision is needed on the directory structure for **domain-level Django apps**:

Options:

1. **Functional (Vertical Slice)** — each app contains all logic for that domain
2. **Layered (Models app, Views app, Services app, etc.)**
3. **Hybrid (shared models + domain apps)**

---

## **2. Decision**

Use **Functional / Vertical Slice Architecture**:
Each domain has its own complete Django app containing:

* models
* serializers / schemas
* views & controllers
* admin
* services
* tasks
* tests
* permissions / policies

Example:

```
billing/
    models.py
    services/
    views.py
    admin.py
    tests/
users/
    models.py
    services/
    permissions.py
    admin.py
```

---

## **3. Rationale**

* Clear separation of business logic
* Easy to navigate (everything related to billing → billing app)
* Reduces coupling
* Scales with team size
* Works naturally with Django’s app philosophy

---

## **4. Consequences**

### Positive

* Feature-driven development becomes easier
* Domain boundaries become explicit
* Testing becomes localized

### Negative

* Duplicate patterns may appear across domain apps
* Requires discipline in cross-domain service boundaries

---

## **5. Alternatives Considered**

### A. Layered Architecture (apps by type: models, views, services)

Rejected → makes cross-feature development difficult and increases coupling.

### B. Hybrid

Rejected → adds unnecessary complexity without clear benefit.

---

## **6. Implementation Plan**

* Create domain apps per module
* Use consistent subfolder patterns
* Move cross-domain utilities to `core/`
* Document inter-app communication rules

---
