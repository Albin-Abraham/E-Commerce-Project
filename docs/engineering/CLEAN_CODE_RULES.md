# ZenOS Engineering: Clean Code Rules

Maintainability rules codified to ensure sustainable evolution of the ZenOS codebase.

---

## 1. Complexity & Function Design

- **Cyclomatic Complexity**: Keep below **10** per function. Break down multi-branch conditionals into small, named strategy functions or dictionary lookups.
- **Function Length**: Functions should ideally be under **40 lines**. Functions exceeding 60 lines must be reviewed for multiple responsibilities.
- **Parameters**: Limit function parameters to **5 or fewer**. Use dataclasses, Pydantic schemas, or typed kwargs for complex option payloads.

---

## 2. Error Handling & Exceptions

- **No Swallowed Exceptions**: Never catch `Exception` or `BaseException` with an empty `pass`. Always log or re-raise with context (`raise CustomError(...) from err`).
- **Domain Exceptions**: Service layers should raise explicit domain exceptions (e.g. `TenantNotFoundError`, `InsufficientStockError`) rather than propagating raw ORM or database exceptions to controllers.

---

## 3. Suppression Discipline

- Blanket `# noqa` is prohibited. Every suppression comment must state the specific rule code being bypassed (e.g., `# noqa: F401`).
- Suppressions must be accompanied by an explanatory comment or issue ticket reference.
- Temporary debugging statements (`breakpoint()`, `import pdb`, `debugger`, `console.log`) are blocked at pre-commit and CI.
