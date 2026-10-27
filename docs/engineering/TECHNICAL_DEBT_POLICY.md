# ZenOS Engineering: Technical Debt Policy

Framework for identifying, recording, prioritizing, and retiring technical debt.

---

## 1. Classification of Technical Debt

| Category | Examples | Remediation Window |
|---|---|---|
| **Security Debt** | Outdated libraries with CVEs, permissive CORS | Immediate / Next patch release |
| **Architectural Debt** | DAG layer suppression tags (`# noqa: DAG`), coupling | 1–2 sprints |
| **Test Debt** | Missing coverage on new domain features | Same sprint before merge |
| **Linter Debt** | Overuse of `# noqa` or type casts | 2 sprints |

---

## 2. Tracking Debt

- Every suppression comment bypassing an architectural rule must link to a tracked Jira / GitHub issue:
  ```python
  from apps.shop.models import Product  # noqa: DAG - Ref: ISSUE-412 (Decouple product lookup)
  ```
- Bi-annual debt review: Conduct dedicated clean-up weeks to eliminate legacy suppressions and upgrade framework dependencies.
