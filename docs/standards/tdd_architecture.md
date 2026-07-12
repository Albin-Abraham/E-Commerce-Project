# 🧪 Modular TDD Architecture (Mixin-First)

This standard defines the "Senior-Level" approach to testing in the project, moving away from "God Classes" to a composition-based model.

## 🏗️ The Mixin-First Pattern

Instead of inheriting from a large base class with hundreds of helper methods, tests should compose behavior using granular **Explicit Mixins**.

### 1. Reusable Capabilities
*   **`CreationMixin`**: Standardizes object creation via `factory_boy`.
*   **`ValidationMixin`**: Provides `assert_valid()` and `assert_invalid()` using Django's `full_clean()`.
*   **`AssertionMixin`**: Generic checks for fields, JSON fields, and relationships.
*   **`SeedingMixin`**: Handles management command execution and seed-data verification.

### 2. Implementation Rules
1.  **Zero-Behavior Base**: `BaseTest` should be a minimal class that does not perform hidden DB queries or setup.
2.  **Explicit Factories**: Use `factory_boy` for all test data. Never use `Model.objects.create()` directly in a test.
3.  **Infrastructure Independence**: Use the `test.py` settings (SQLite memory) to ensure tests run in <1s.

## ✅ Example:
```python
class TestCompanyModel(BaseTest, CreationMixin, ValidationMixin):
    def test_creation(self):
        company = self.create_instance(CompanyFactory)
        self.assert_valid(company)
```
