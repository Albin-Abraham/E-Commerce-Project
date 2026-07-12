# **ADR-010: Database-Backed Module & Feature Registry**

**Status:** Accepted
**Date:** 2026-03-21
**Decision Type:** Infrastructure & RBAC Integration

---

## 1. Context

Previously, the system managed its module and feature hierarchy (tripartite keys) via a static `modules.yaml` file parsed at runtime by a `ModuleNavigator`. While simple, this approach presented several challenges:
- **No Relational Integrity**: Feature dependencies were managed as strings in JSON/YAML, making it hard to enforce valid relationships.
- **Static Configuration**: Changes required a code deployment.
- **Limited Metadata**: Storing complex metadata (icons, colors, model mappings) in YAML made the file bulky and hard to manage.
- **SaaS Scoping Complexity**: Linking `DivisionCatalog` to feature strings lacked database-level ForeignKey security.

---

## 2. Decision

Establish a **Relational Module & Feature Registry** in the database:

1.  **System Models**: 
    - `SystemModule`: Top-level system container (e.g., HR, Finance).
    - `SystemFeature`: Granular feature unit with `code`, `model_name`, and `special_permissions`.
    - `FeatureDependency`: Explicit relational link between features.
2.  **Hybrid Source of Truth**:
    - Developers maintain the **`module_config.yaml`** for bulk edits and initial seating.
    - A **`ModuleSyncService`** synchronizes the YAML into the database, ensuring the DB is the final authority for the running system.
3.  **Persistence**: Move metadata enrichment from the `ModuleNavigator` (YAML lookup) to relational queries on `SystemFeature`.

---

## 3. Rationale

- **Data Integrity**: Using ForeignKeys for `FeatureDependency` prevents "Ghost Dependencies" and cyclic references.
- **Dynamic Updates**: Non-developers (Admins) can toggle features or update metadata via the Admin UI without deployment.
- **Clean Architecture**: Decouples the *definition* of features (Data) from the *logic* of the permission evaluator (Code).
- **SaaS Readiness**: `DivisionCatalog` can now use a ManyToMany relationship to `SystemFeature`, providing real-time subscription-based feature scoping.

---

## 4. Consequences

### Positive
- Strict enforcement of tripartite key logic.
- O(1) metadata lookups in the database.
- Easier UI generation for "Permission Management" dashboards.

### Negative
- Adds three new tables to the core database management.
- Requires a synchronization step (`python manage.py sync_modules`) after manual YAML changes.

---

## 5. Alternatives Considered

### Stick to YAML-only
Rejected → Lacked relational integrity and made Admin UI development difficult.

### Pure Database-only (no YAML)
Rejected → YAML is easier for developers to manage during rapid initial development and bulk refactoring.

---

## 6. Implementation Plan

1.  Create `SystemModule`, `SystemFeature`, and `FeatureDependency` in `core/base_models/system_models.py`.
2.  Implement `ModuleSyncService` for YAML-to-DB mapping.
3.  Provide `sync_modules` management command.
4.  Update RBAC manifest logic to leverage the database registry for metadata enrichment.

---

## 7. 2026-03-21 Amendment: Convergence on Developer-Defined Relational Models

### Context
Initial implementation of the "Sync Service" (YAML ➔ DB) revealed a gap between high-level configuration and developer-defined logic. To maximize **Relational Integrity** and **Audit Clarity**, a more direct linkage was required between business models and authorization units.

### Revised Decision
Consolidate the registry into a **Developer-Defined Relational Model**:
- **Unified Permission Entity**: Instead of a dynamic sync, a centralized `Permission` model (with `permission_type` choices) acts as the system-wide source of truth.
- **Relational Integrity**: Roles (`RolePermission`) and User assignments (`UserPermission`) now use **ManyToManyFields** to the `Permission` model, ensuring that unauthorized or "ghost" permissions cannot exist in the database.
- **Division-Specific Catalogs**: Extended the subscription logic to the division level via `DivisionCatalog`, allowing for granular, division-scoped feature enablement.

### Consequences
- **Positive**: Strict DB-level enforcement, zero "ghost" permissions, and a simplified developer workflow.
- **Negative**: Adds a direct dependency on Python-driven choices, requiring code deployments for structurally new permission types.
