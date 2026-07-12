# 🏗️ Model Validation Architecture Integration

This document explains how the Model Validation Rule Engine is integrated and consumed across the entire Backend-RestFul application.

## 층 0: Independent Serializer & API Validation

Not all validation depends on the Model. Seasoned developers use the **Serializer/API Tier** for logic that is "Model-Agnostic" or "Context-Specific".

- **Technical Transformation**: Validating fields that don't exist in the database (e.g., `confirm_password`).
- **Domain Orchestration**: Running business rules (Unique, Required) via the **`ValidationMediator`** before the DB transaction starts.
- **Cross-Resource Logic**: Business rules that span multiple models (e.g., checking active subscription plans).

> [!TIP]
> **Dumb Model Architecture**: By centralizing all domain logic in the **ValidationMediator**, we achieve absolute decoupling between business rules and database persistence, solving row-locking issues and infrastructure leakage.

---

## 층 1: Rule Definitions (`core/base_models/validators/rules.py`)
The foundation of the system. This contains the **GoF Strategy** implementations:
- `RequiredRule`: Enforces non-null/non-empty values.
- `MinRule`: Enforces minimum length or value.
- `UniqueRule`: Enforces database-level uniqueness via domain logic.
- `PermissionPolicyRule`: Enforces authorization at the data layer.

---

## ⚡ How to Bypass (The Backdoors)

Sometimes you *need* to bypass validation (e.g., data migrations, high-speed batch imports). Here is how it's done—and why you should be careful.

### 1. The Standard "Direct Save"
Django's `save()` method **does not** call `full_clean()` by default.
- **How**: Simply call `instance.save()` without calling `instance.full_clean()`.
- **Risk**: You can save data that violates every domain rule we've defined.

### 2. Bulk ORM Operations
QuerySet methods bypass the model instance entirely.
- **How**: `MyModel.objects.bulk_create()`, `bulk_update()`, or `.update()`.
- **Reason**: These perform a single SQL query for performance, bypassing all Python-level hooks.

### 3. Raw SQL
The ultimate bypass.
- **How**: `cursor.execute("UPDATE ...")`.
- **Result**: Zero validation, zero audit trail (unless using DB triggers).

### 4. Selective Bypass (The "Safe" Way)
If you want to bypass *specific* rules but keep others, use the `context`:
- **How**: `instance.full_clean(context={'skip_rules': ['UniqueRule']})`.
- **Implementation**: This requires the Rule's `check()` function to inspect the context before running.

---

## ⚖️ Architectural Trade-offs & Risks (How this could "Break" things)

No architecture is perfect. While our layered system provides security and DX, it introduces specific structural risks that must be managed:

### 1. The "Leaky Infrastructure" Risk
Because `core/base_models` provides the `ValidatorModelMixin`, our infrastructure layer has a "Dependency Inversion" problem: it dictates how domain apps must behave.
- **The Break**: If a breaking change occurs in `core/base_models/validators/rules.py`, it can instantly cause "Cascade Failures" across perfectly healthy domain apps.

### 2. The "Validation Duality" Conflict
Encouraging validation at both the Serializer (API Truth) and Model (Domain Truth) level can lead to **Logic Drift**.
- **The Break**: A developer updates a business rule in the `UserSerializer` but forgets the `UserModel`. Now, the API accepts data that the Django Admin rejects, leading to "State Corruption" and confusing bugs.

### 3. The "Explicit Validation" Requirement
Because models are now **"Dumb"**, they do NOT call rules automatically on `save()` or `full_clean()`.
- **The Break**: If a developer uses `objects.create()` or `objects.update()` directly in a management script and expects business rules to run automatically, they will be disappointed.
- **The Mitigation**: The **`ValidationMediator`** must be explicitly invoked in non-API contexts (e.g., management commands) to enforce domain truth.

### 4. Semantic Coupling & Context Leakage
Passing `_api_context` into the model (Tier 4) couples the Domain Model to the API request.
- **The Break**: If the model starts making decisions based on `request.user.role`, it's no longer a "Pure Domain Model"—it's an API utility. This makes testing without a request object significantly harder.

---

## 🛡️ Mitigations & Safeguards

To prevent these architectural breaks:
1.  **Atomic Rules**: Keep core rules primitive (`MinRule`, `MaxRule`). Complexity should live in the Domain or Service layer.
2.  **TDD Enforcement**: Every Model rule must have a corresponding Unit Test that runs via the shell, ensuring bypassing is documented.
3.  **Signals/Triggers**: For mission-critical invariants, use **Database Constraints** or `pre_save` signals as the absolute final catch, rather than just relying on the Rule Engine.

---

## 층 2: Field Integration (`core/base_models/fields.py`)
To make validation "Boilerplate-free", we use **Smart Fields**.
- **`RulesFieldMixin`**: Injected into core fields (`CustomCharField`, `CustomEmailField`).
- **Mechanism**: When a model is initialized, the `RulesFieldMixin` automatically registers its rules to the model's `validation_rules` registry.

## 층 3: Model Layer (`core/base_models/validator_model.py`)
Any model that needs validation defines its rules here, but does NOT execute them.
- **`ValidatorModelMixin`**: A **Metadata Holder**. It provides the `_rules` registry that the `ValidationMediator` consumes.
- **`PermissionPolicyMixin`**: Integrates the Policy Engine for Resource:Action security (Enforced at the View level).

## 층 4: Cross-Module Consumption
Modules across the application (`apps/users`, `apps/hrms`, `core/admin`) import these shared components to maintain consistency:

```python
# apps/users/models/users.py
from core.base_models.fields import CustomCharField, CustomEmailField
from core.base_models.validators.rules import RequiredRule, UniqueRule

class UserModel(AbstractBaseUser, PermissionsMixin):
    username = CustomCharField(
        rules=[RequiredRule("username"), UniqueRule("username")]
    )
```

> [!NOTE]
> **Shared Application Pattern**: By centralizing the Rule Engine in `core/`, we ensure that a `UniqueRule` behaves identically across the `Admin` panel, `REST API`, and `Management Commands`.
