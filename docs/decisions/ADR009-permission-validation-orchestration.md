# **ADR-009: Permission & Validation Orchestration**

**Status:** Accepted
**Date:** 2026-03-21
**Decision Type:** Security & Domain Logic Integration

---

## 1. Context

The project requires a robust, scalable permission and validation system that ensures data integrity and security across multiple layers (API, Serializer, Model). We evaluated:

* **Hardcoded Django Permissions**: Simple but lacks Resource:Action granularity.
* **Service-Only Validation**: Flexible but leaves the Model (domain) "Dumb" and vulnerable to corruption from other entry points.
* **Our Solution**: A unified **Orchestration** system using a recursive Policy Engine and a Strategy-based Rule Engine.

---

## 2. Decision

Adopt a **Unified Orchestration Framework**:

* **Permissions**: Use **Resource:Action** strings (e.g., `company:view`) and a recursive evaluator supporting complex logic (`all`, `any`, `at_least`). Enforce at the View level via `CustomPermissionClass`.
* **Validation**: Use a **Mediator-Led Strategy**:
    * **Serializers (Smart)**: Handle technical request validation and orchestrate domain logic via the `ValidationMediator`.
    * **Models (Dumb)**: Act as pure data containers. Domain invariants are enforced selectively during the API/Serializer lifecycle to avoid database locking and framework coupling.
* **Traceability**: Pass `context` to the `ValidationMediator` to allow context-aware rules (e.g., skipping rules for drafts) without contaminating the Model layer.

---

## 3. Rationale

* **Secure by Default**: The Model always protects its own data, preventing corruption from any source.
* **Developer Flexibility**: Seasoned developers can implement sophisticated logic at the Serializer level without losing domain protection.
- **Granularity**: Resource:Action mapping provides much better control than standard Django `has_perm` calls.
* **Auditability**: The single registry and YAML manifest provide a clear audit trail for both backend and frontend.

---

## 4. Consequences

### Positive

* Comprehensive security coverage with minimal code repetition.
* Clear separation between "API Truth" and "Domain Truth".
* Unified registry for frontend/backend alignment.

### Negative

* Slight learning curve for the recursive policy syntax.
* Requires discipline to ensure `full_clean()` is always called before saving.

---

## 5. Alternatives Considered

### Service-Layer only validation

Rejected → leads to domain leakage and inconsistent data integrity.

### Explicit Model-only permissions

Rejected → too rigid for complex API workflows and lacks "Seasoned Developer" flexibility.

---

## 6. Implementation Plan

1. Implement `PermissionPolicyMixin` and `ValidatorModelMixin` in `BaseModel`.
2. Implement `CustomPermissionClass` for DRF.
3. Establish `registry.py` and `distribution.yaml` as the global sources of truth.
4. Document the layered flow in `permissions.md` and `validation_rules.md`.

---

## 7. 2026-03-21 Amendment: Dumb Model Pivot

### Context
Post-implementation analysis revealed that "Smart Models" (as Domain Guardians) created tight coupling to the Django framework/ORM and introduced risks of "Database Locking" during complex validation cycles.

### Revised Decision
We have pivoted to a **"Dumb Model"** architecture for business validation:
- **Rule Execution**: Moved from `ValidatorModelMixin.clean_with_context` to `ValidationMediator.validate`.
- **Timing**: Validation now occurs **before** the database transaction begins, significantly reducing row-contention and lock times.
- **Decoupling**: Models no longer depend on many framework-specific validation rules, fulfilling the "No framework imports in Domain Layer" clean architecture principle.

### Consequences
- **Negative**: Direct model saves (e.g., in management scripts) bypass business rules unless the `ValidationMediator` is explicitly invoked.

---

## 8. 2026-03-21 Amendment: SaaS-Level Dynamic RBAC

### Context
Enterprise SaaS requirements necessitated a more scalable, hierarchical approach to permissions that could support feature scoping based on subscription tiers (Catalogs) and high-performance cross-component authorization.

### Revised Decision
Adopted a **System ➔ Module ➔ Feature** hierarchy:
- **Source of Truth**: All available platform features are defined in [modules.yaml](file:///home/albin-abraham-george/Project/Backend-RestFul/core/base_models/configs/modules.yaml).
- **Tripartite Keys**: Permissions moved from `resource:action` to `system:module:feature` (e.g., `hrms:payroll:salary_processing`).
- **SaaS Scoping**: Introduced `DivisionCatalog` to intersect user roles with subscription-allowed features.
- **Performance**: Permission manifests are compiled into `frozensets` and cached in Redis. Celery background tasks handle cache invalidation via Django signals.

### Consequences
- **Positive**: O(1) authorization checks, zero-latency feature scoping, and human-readable metadata enrichment for UI components.
- **Negative**: Adds dependency on Redis and Celery for the authorization lifecycle.

---

## 9. 2026-03-21 Amendment: Developer-Defined Relational Models

### Context
Post-implementation feedback highlighted the need for stronger **Relational Integrity** and **Developer Certainty** over automated YAML-to-DB synchronization. Storing permission manifest rules in JSON/JSONField lacked the strict database-level enforcement required for enterprise-grade auditing.

### Revised Decision
Pivot to a **Developer-Defined Relational Model** for permissions:
- **Relational Integrity**: Permissions are stored in a dedicated `Permission` model. Roles and User assignments use `ManyToManyField` for strict DB-level validation.
- **Developer-Led Definitions**: Permission types are explicitly defined in Python constants (`MODELS`, `CRUD_ACTIONS`), providing strong typing and compile-time safety.
- **Division-Level Scoping**: Introduced `DivisionCatalog` to provide granular, division-specific whitelisting of available permissions.
- **Assignment-Time Validation**: Validation is shifted from "Runtime Intersection" to "Assignment-Time Enforcement" via `m2m_changed` signals, ensuring that invalid assignments are never persisted to the database.

### Consequences
- **Positive**: Guaranteed data integrity, easier auditing, and superior developer experience via IDE autocompletion.
- **Negative**: Adding new permission types or models requires a code deployment (though metadata updates remain dynamic).
