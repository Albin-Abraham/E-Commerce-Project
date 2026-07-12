# 🧩 Core Foundational Behaviors

This document deep-dives into the architectural pillars of the Backend-RestFul project. These behaviors ensure strict separation of concerns, framework decoupling, and robust data integrity.

## 1. The "Dumb Model" Strategy

In this architecture, Models are primarily **Data Containers**. They define the structure and metadata of the domain but do not contain heavy business logic or execute their own validation.

### Key Principles:
- **No Automatic Validation**: Rules are not executed in `save()` or `full_clean()` automatically.
- **Framework Decoupling**: Business invariants are moved out of the Model class to prevent tight coupling with the Django ORM.
- **Mediator-Led**: The `ValidationMediator` is the sole orchestrator of domain truth.

### Why "Dumb" Models?
1. **Performance**: Prevents database row-locks during complex validation cycles.
2. **Predictability**: Validation only happens when explicitly requested (usually at the API or Service layer).
3. **Clean Architecture**: Fulfills the requirement that the Domain Layer should not depend on frameworks.

---

## 2. ValidationMediator & Rule Engine

The **Rule Engine** implements the **GoF Strategy Pattern**. Each rule is a standalone object that encapsulates a single business invariant.

### The Lifecycle:
1. **Definition**: Rules are registered in the Model's `validation_rules` property (often via `Smart Fields`).
2. **Orchestration**: The `ValidationMediator` collects these rules and the current `context`.
3. **Execution**: Rules are checked **before** any database transaction begins.

### Base Rules:
- `RequiredRule`: Ensures presence and non-emptiness.
- `UniqueRule`: Handles database-level uniqueness with optional scoping (e.g., unique within an Org).
- `PermissionPolicyRule`: Checks authorization at the object level during validation.

---

## 3. Audit & Time Integrity

Every model inheriting from `BaseModel` benefits from automated auditing and consistent time management.

- **`AuditMixin`**: Automatically creates `AuditLog` entries for `create` and `update` operations.
- **`TimeRegistry`**: Ensures that all timestamps across the distributed system (Web, Celery, DB) use a single, reliable local time source, preventing offset issues.
- **Optimistic Locking**: Every `BaseModel` includes a `version` field. Concurrent updates are detected and rejected to prevent "Lost Update" scenarios.

---

## 4. Permission Policy Integration

Authorization is not just a View-level concern. The **`PermissionPolicyMixin`** allows models to define their own security profile.

```python
class Division(BaseModel):
    permissions_policy = {
        "resource": "division",
        "action_perms": ["division:audit"]
    }
```
This metadata is consumed by the global `evaluate_policy` engine to ensure that data remains secure even when accessed outside of standard REST endpoints.
