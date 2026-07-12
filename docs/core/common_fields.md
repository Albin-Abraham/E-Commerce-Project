# 🛠️ Common Field System

The `core.base_models.fields` module provides a library of "Smart Fields" that automate validation and enforce project-wide defaults.

## 🧪 RulesFieldMixin

The magic behind our "Boilerplate-free" validation. Any field inheriting from this mixin gains the ability to:
1. **Accept `rules`**: Pass a list of `BaseRule` objects directly in the field definition.
2. **Auto-Register**: The field automatically registers its rules to the Model's `validation_rules` registry during system initialization.

---

## 🏗️ Core Fields

### `CustomCharField`
- **Default Max Length**: 255 (Project standard).
- **Default Constraints**: `null=False`, `blank=False` (Secure by Default).
- **Usage**:
  ```python
  name = CustomCharField(rules=[MinRule("name", 3)])
  ```

### `CustomEmailField`
- **Strict Validation**: Includes domain-specific validation and regex checks by default.
- **Max Length**: 150 (Optimized for indexes).

### `CustomJSONField`
- **Integrity**: Defaults to an empty dict `{}`.
- **Rules Support**: Can accept `JSONKeyRule` to enforce schema-like integrity at the application layer.

### `ShortUIField`
- **Purpose**: Optimized for UI identifiers and short codes.
- **Defaults**: Shorter `max_length` and enforced uppercase/slug patterns where applicable.

---

## 📏 Usage Best Practices

1. **Prefer Field Rules**: Define simple constraints (`MinRule`, `RegexRule`) directly on the field to keep the model definition clean.
2. **Nullable Logic**: Use the `nullable=True` argument instead of manually setting `null=True, blank=True`. Our custom fields handle the Django-specific nuances for you.
3. **Avoid Django Built-ins**: Always inherit from `core.base_models.fields` instead of `django.db.models` to ensure your fields are "Smart" and integrated with the validation engine.
