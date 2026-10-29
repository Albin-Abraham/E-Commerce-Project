# Technical Task Guidelines

## Purpose
Engineering excellence requires ongoing maintenance, refactoring, dependency updates, and architectural evolution. This guide clarifies how technical debt, infrastructure work, and non-functional requirements are tracked and executed alongside product stories.

---

## 1. Classification of Technical Work

| Type | Examples | Sizing / Tracking |
| :--- | :--- | :--- |
| **Architectural Refactor** | Decoupling circular imports, splitting large modules | Planned in sprint, tagged `refactor` |
| **Infrastructure / DevOps** | GitHub Actions CI improvements, Docker optimization | Planned in sprint, tagged `infrastructure` |
| **Performance Optimization**| Query N+1 elimination, Redis caching layers | Benchmark required before & after |
| **Security & Compliance** | Package updates, secret rotation, CVE remediation | High priority, scheduled in next sprint |
| **Quality & Test Coverage** | Missing integration suites, test factory cleanup | Included with related feature work |

---

## 2. Rules for Technical Tasks
1. **Clear Business Rationale:** Even purely technical tasks must state the business justification (e.g., "Reduces CI run time from 12m to 4m, saving developer cycle time" or "Eliminates database deadlock during batch payroll").
2. **Measurable Verification:** Every technical task must define how success is verified (e.g. `check_import_dag.py` returns 0 violations, or query count drops from 45 to 2).
3. **Capacity Allocation:** Engineering teams dedicate approximately 15–20% of each sprint's velocity to technical debt and infrastructure maintenance.
4. **No "Ghost Work":** Major refactors or infrastructure changes must not be snuck into unrelated feature PRs. They must have dedicated tracking tickets and focused pull requests.
