# ZenOS Linters Module

Detects code anomalies, unsafe patterns, unused symbols, and coding convention violations.

---

## 1. Tooling & Responsibilities

| Language | Linter | Configuration Source |
|---|---|---|
| Python | Ruff Linter | `pyproject.toml` (`[tool.ruff.lint]`) |
| TypeScript / JavaScript | ESLint | `frontend/eslint.config.js` |
| YAML | yamllint / Pre-commit | `.pre-commit-config.yaml` |

---

## 2. Active Python Rule Sets (Ruff)

- `E`, `W`: Pycodestyle errors and warnings.
- `F`: Pyflakes (unused imports, undefined names).
- `I`: Isort import sorting.
- `UP`: Pyupgrade (modern Python 3.11+ idioms).
- `N`: PEP 8 naming conventions.

---

## 3. Usage

Run linter checks:
```bash
./tools/quality/orchestrator/check.sh linters.ruff
```

Automatically apply safe fixes:
```bash
./tools/quality/orchestrator/check.sh linters.ruff --fix
```
