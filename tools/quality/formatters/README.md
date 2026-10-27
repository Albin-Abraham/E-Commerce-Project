# ZenOS Formatters Module

Enforces deterministic, automated formatting across all file types in the ZenOS repository.

---

## 1. Tooling & Responsibilities

| Language / Format | Tool | Configuration Source |
|---|---|---|
| Python (`.py`) | Ruff Formatter | `pyproject.toml` (`[tool.ruff]`) |
| Editor Conventions | EditorConfig | `.editorconfig` |
| Line Endings & Attributes | Git Attributes | `.gitattributes` |
| JavaScript / TypeScript | Prettier | `frontend/.prettierrc` |

---

## 2. Usage

Check formatting without writing:
```bash
./tools/quality/orchestrator/check.sh formatters.ruff
```

Automatically apply formatting fixes:
```bash
./tools/quality/orchestrator/check.sh formatters.ruff --fix
```
