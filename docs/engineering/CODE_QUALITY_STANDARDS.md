# ZenOS Engineering: Code Quality Standards

This document establishes the overarching code quality governance framework for the ZenOS platform.

---

## 1. Principles of Quality Engineering

1. **Automated over Manual**: Quality standards must be deterministically verifiable by machines before being reviewed by humans.
2. **Shift Left**: Issues should be identified as early as possible—ideally in the editor, definitely at pre-commit, and before PR review.
3. **Decoupled Architecture**: Rules live in native tool configs or declarative YAML. The orchestrator coordinates execution without owning tool-specific definitions.
4. **Single Source of Truth**: Never duplicate rule definitions across linters, shell scripts, and markdown.

---

## 2. Quality Gates

| Gate | Execution Stage | Enforcement Tool | Failure Action |
|---|---|---|---|
| **Code Formatting** | Pre-commit & CI | Ruff Formatter | Reformat with `--fix` |
| **Linting & Idioms** | Pre-commit & CI | Ruff Linter | Fix syntax / patterns |
| **Clean Code** | Pre-commit & CI | Clean Code AST Checkers | Remove debug/blanket noqa |
| **Layered DAG** | Pre-commit & CI | Architecture DAG Checker | Restructure import flow |
| **Type Safety** | CI (Pull Request) | Pyright / TypeScript | Add/correct type signatures |
| **Security & Secrets** | CI & Pre-commit | Gitleaks / pip-audit | Immediate block |
| **Automated Tests** | CI | Pytest Suite | Merge blocked until passing |

---

## 3. Developer Workflow

Developers run the orchestrator locally before pushing:
```bash
# Fast check
./tools/quality/orchestrator/check.sh fast

# Automatically fix lint and format issues
./tools/quality/orchestrator/check.sh fast --fix
```
