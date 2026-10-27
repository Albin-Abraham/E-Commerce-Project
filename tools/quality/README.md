# ZenOS Quality Engineering Architecture

Welcome to the **ZenOS Quality Tooling System**. This repository uses a decoupled, modular architecture to govern formatting, linting, architecture rules, clean-code standards, and test enforcement.

---

## 1. Directory Structure

```text
tools/quality/
├── orchestrator/          # Central execution engine (check.sh, check.py)
├── architecture/          # Layered DAG and module boundary rules
│   ├── rules/             # Declarative boundary definitions (layers.yaml)
│   └── custom-checks/     # AST analyzers (check_layered_dag.py)
├── clean-code/            # Organizational maintainability checks
│   ├── rules/             # Rules for suppressions and complexity
│   └── custom-checks/     # AST checks (check_debug_artifacts.py, check_suppressions.py)
├── formatters/            # Code formatting specifications & tools
├── linters/               # Linter conventions and exceptions
├── static-analysis/       # Deep type checking & safety
├── security/              # Secret detection & dependency CVE auditing
├── dependencies/          # Lockfile health and updates
└── reporting/             # Console, markdown, and GitHub summary reporters
```

---

## 2. Orchestrator Usage

Run quality checks locally using the orchestrator shell wrapper:

```bash
# Fast developer check (pre-save / staging)
./tools/quality/orchestrator/check.sh fast

# Git pre-commit profile
./tools/quality/orchestrator/check.sh pre_commit

# Comprehensive local quality verification
./tools/quality/orchestrator/check.sh full

# Automatic fix where supported (Ruff format & lint fix)
./tools/quality/orchestrator/check.sh fast --fix

# Output as Markdown (used in CI summaries)
./tools/quality/orchestrator/check.sh fast --markdown
```

---

## 3. Configuration Ownership

To prevent duplication and multiple sources of truth:
- **Python Formatting & Linting**: `pyproject.toml` (Ruff).
- **Quality Gates & Profiles**: `config/engineering/quality/quality.yaml`.
- **Architectural Layers**: `tools/quality/architecture/rules/layers.yaml`.
- **Engineering Principles**: `docs/engineering/`.
