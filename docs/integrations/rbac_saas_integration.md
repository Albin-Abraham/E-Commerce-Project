# 🚀 SaaS RBAC & Module Integration Guide

This guide explains the integration between the **Dynamic Module Configuration**, **Division Catalogs**, and the **O(1) Permission Manifest**.

## 🏗️ Architecture Overview

The system uses a tripartite hierarchy to manage feature access across different SaaS subscription tiers.

### 1. The Source of Truth: Developer-Defined Constants
Permissions are defined in Python constants (`MODELS`, `CRUD_ACTIONS`, `SPECIAL_PERMISSIONS`) that populate the `Permission` model.

### 2. The Persistence Layer: `Permission` Model
Following [ADR-010](file:///home/albin-abraham-george/Project/Backend-RestFul/docs/ADR010-database-backed-module-registry.md), all authorization units are stored in the relational `Permission` model, ensuring strict data integrity and FK security.

### 3. The Blueprint: `DivisionCatalog`
A per-division whitelist that defines which `Permission` objects are valid for assignment within a specific division.

---

## 🛠️ The Authorization Lifecycle

### Step 1: Role Assignment
Users are assigned roles (e.g., `RolePermission`). These roles contain a `ManyToManyField` to the `Permission` model.

### Step 2: Branch-Level Validation (Assignment Time)
When a permission is assigned for a specific branch:
1.  **Strict Filtering**: The system triggers an `m2m_changed` signal.
2.  **Intersection Logic**: It checks if the permission exists in the `DivisionCatalog` for that division.
3.  **Sanitization**: Invalid permissions are automatically discarded from the assignment, and a notification is sent to the developer/admin.

### Step 3: Redis Caching
The final, validated manifest is cached in Redis with zero-latency O(1) lookup.
- **Key**: `user_manifest:{user_id}:{division_id}`
- **Format**: `frozenset` for instant `has_perm` checks.

---

## 🔄 Invalidation & Consistency

The system ensures the cache remains consistent with the database using **Django Signals**:
- **Triggers**: Any change to `UserPermission`, `RolePermission`, or `DivisionCatalog`.
- **Action**: Signals trigger a **Celery Background Task** (`rebuild_manifest_task`) which rebuilds and re-caches the manifest for all affected users.

---

## 💻 Usage Example

### Checking a Permission
```python
from core.admin.utils.auth_utils import evaluate_policy

# Check if user has access to salary processing in their current division
if evaluate_policy(user, "hrms:payroll:salary_processing"):
    # Access Granted
    ...
```

### Fetching Metadata for UI
```python
# The manifest property on the User model contains the enriched metadata
metadata = user.permission_manifest.metadata.get("hrms:payroll:salary_processing")
print(f"Module: {metadata['module_name']}") # Output: "Payroll & Compensation"
```
