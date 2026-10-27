# ZenOS Static Analysis Module

Provides deep semantic analysis and type safety verification beyond basic linting.

---

## 1. Tooling & Responsibilities

| Language | Static Analyzer | Configuration Source |
|---|---|---|
| Python | Pyright | `pyproject.toml` (`[tool.pyright]`) |
| TypeScript | `tsc` (TypeScript Compiler) | `frontend/tsconfig.json` |

---

## 2. Policy

- All new domain models, service methods, and API helpers must have type annotations.
- Untyped or permissive types (e.g. `Any` in Python, `any` in TypeScript) are restricted to third-party adapter boundaries.
- No unchecked dictionary unpacking or unhandled promises in critical paths.
