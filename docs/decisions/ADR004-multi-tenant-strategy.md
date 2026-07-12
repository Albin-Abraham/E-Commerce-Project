# **ADR-004: Multi-Tenant Architecture Strategy**

**Status:** Proposed → Accepted
**Date:** 2025-11-11
**Decision Type:** Data Architecture / Tenant Isolation

---

## **1. Context**

The system may onboard multiple clients (organizations, hospitals, clinics).
We need a multi-tenant strategy. Options:

1. **Shared Database, Shared Schema**
2. **Shared Database, Separate Schema**
3. **Separate Database per Tenant**

---

## **2. Decision**

Use **Shared Database, Shared Schema with Tenant Foreign Keys**.
Every domain model references a `Tenant` (or `Company`) via FK.

Example:

```
class Bill(models.Model):
    tenant = models.ForeignKey("Tenant", on_delete=models.CASCADE)
```

---

## **3. Rationale**

* Easiest to implement
* Lowest operational cost
* Works well with Django ORM
* Performance is scalable using indexed FK filters
* Fits mid-size SaaS architecture

---

## **4. Consequences**

### Positive

* Simple migrations
* Easy to query across tenants (if needed)
* Low cost for hosting
* Easy DevOps pipeline

### Negative

* Strong need for strict permissions filtering
* All tenants share database capacity
* Harder to offer “export entire tenant DB” feature

---

## **5. Alternatives Considered**

### A. Separate schema per tenant

Rejected → Django ORM not built for schema switching.

### B. Separate database per tenant

Rejected → high operational complexity; requires custom router & migrations.

---

## **6. Implementation Plan**

* Create `Tenant`/`Company` model
* Add `tenant` FK to all tenant-bound models
* Add middleware to attach current tenant
* Add filters in QuerySets, services, DRF views
* Enforce tenant isolation at service and ORM level

---
