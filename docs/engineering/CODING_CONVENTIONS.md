# ZenOS Engineering: Coding Conventions

Standardized naming, file organization, and idiomatic guidelines for Python and TypeScript codebases.

---

## 1. Python Conventions (PEP 8 & Modern 3.11+)

- **Naming**:
  - Modules & Packages: `snake_case` (e.g., `company_service.py`).
  - Classes: `PascalCase` (e.g., `ProductCatalogSerializer`).
  - Functions & Variables: `snake_case` (e.g., `get_active_tenant()`).
  - Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_ATTEMPTS = 3`).
- **Typing**:
  - Prefer modern union types (`int | None` instead of `Optional[int]`).
  - Use `from __future__ import annotations` in all new modules.
  - Type-annotate public service interfaces and model helpers.
- **Imports**:
  - Formatted strictly by `isort` via Ruff (`I`).
  - Absolute imports preferred over deep relative traversals (`from core.base_models import ...`).

---

## 2. File Organization

```text
app/
├── models/         # Database models partitioned by domain
├── serializers/    # Input/output contracts
├── services/       # Domain business logic & transaction handling
├── views/          # HTTP request handlers & viewsets
├── urls.py         # Route registrations
└── tests/          # App-specific unit & integration tests
```
