# 📖 Module Usage Examples

Practical examples of how the shared validation rules are applied across the ERP's various modules.

---

## 🏢 1. Core Admin: `Company` Model
The `Company` model uses a high density of rules to ensure tenant isolation and identity integrity.

```python
# core/admin/models/company.py
name = CustomCharField(
    rules=[RequiredRule("name"), MinRule("name", 3), UniqueRule("name")]
)
email = CustomEmailField(
    rules=[RequiredRule("email"), EmailRule("email"), UniqueRule("email")]
)
```
- **Audit**: Every failure here is caught by the `AuditMixin` (if configured) or returned as a structured 400 error to the API.

## 👤 2. Identity: `User` Model
The `User` model leverages shared fields to simplify identity management.

```python
# apps/users/models/users.py
email = CustomEmailField(unique=True) # Uses default EmailRule internally
username = CustomCharField(
    max_length=150,
    rules=[RequiredRule("username"), UniqueRule("username")]
)
```

## 🛠️ 3. Generic Resource Integration
When creating a new module (e.g., `apps/hrms`), follow this integration pattern:

1.  **Inherit** from `BaseModel`.
2.  **Use** `Custom*` fields from `core.base_models.fields`.
3.  **Define** `rules=[]` for any field requiring business logic.
4.  **Define** `permissions_policy` for Resource:Action security.

---

## 🚦 Integration Workflow Summary

| Task | Location | Shared Component |
| :--- | :--- | :--- |
| **Field Definition** | `models.py` | `CustomCharField`, `RulesForeignKey` |
| **Logic Registration** | `rules=[...]` | `RequiredRule`, `MinRule`, etc. |
| **Execution** | `full_clean()` | `ValidatorModelMixin` (automatic) |
| **API Response** | `serializers.py` | `SmartSerializerMixin` |

> [!TIP]
> **Check the Trace**: Use `instance.get_validation_trace()` during development to see exactly how these shared rules interact within your specific module.
