# ZenOS Clean Code Enforcement Module

This module enforces team-level maintainability policies, coding hygiene, and clean code principles.

---

## 1. What This Module Governs

- **Debug Artifacts**: Blocks unintentional commits of `breakpoint()`, `import pdb`, `debugger`, or `console.log`.
- **Suppression Discipline**: Rejects blanket `# noqa` or `@ts-ignore`. Requires specific error codes (e.g. `# noqa: F401`).
- **Complexity & Size Guardrails**: Monitored via `config/engineering/quality/thresholds.yaml`.

---

## 2. Custom Checks

- `custom-checks/check_debug_artifacts.py`: Scans AST for active debug break statements.
- `custom-checks/check_suppressions.py`: Ensures every suppression statement is scoped and justified.

---

## 3. Usage

```bash
# Check debug artifacts
python tools/quality/clean-code/custom-checks/check_debug_artifacts.py

# Check suppression comments
python tools/quality/clean-code/custom-checks/check_suppressions.py
```
