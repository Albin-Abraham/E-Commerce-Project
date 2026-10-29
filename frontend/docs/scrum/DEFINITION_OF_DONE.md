# Definition of Done (DoD)

## Purpose
The Definition of Done (DoD) is the formal agreement between product and engineering outlining the criteria required for any work item to be considered completed, verified, and shippable.

---

## 1. Universal DoD Criteria

Every pull request must meet the following before merge:

### Code Quality & Standards
- [ ] Code strictly follows ZenOS standards (`.editorconfig`, Ruff for Python, ESLint/Prettier for TypeScript).
- [ ] Layered DAG import rules verified (`python scripts/check_import_dag.py` returns 0 violations).
- [ ] No hardcoded secrets, API keys, or personal test URLs committed.
- [ ] No debug statements (`print()`, `console.log()`, `pdb`, `breakpoint()`) left in production code paths.

### Testing & Verification
- [ ] Unit tests written for business logic and validation edge cases.
- [ ] Integration tests verify API contracts and database persistence.
- [ ] Multi-tenant isolation verified (tenant ID filters and context middleware enforced).
- [ ] All automated tests pass in the CI pipeline without flaky failures.

### Database & Migrations (When Applicable)
- [ ] Migrations run cleanly forward (`python manage.py migrate`).
- [ ] Backward rollback is verified or an explicit forward-only migration plan is documented.
- [ ] No long table locks or blocking schema changes on large tables.

### Security & Compliance
- [ ] Authorization checks (`has_permission`, role-based access) enforced on all new/updated endpoints.
- [ ] Request parameters properly sanitized and validated against schemas.
- [ ] Sensitive fields (passwords, tokens, PHI/PII) omitted from serializations and application logs.

### Documentation & Schemas
- [ ] OpenAPI schema updated (`make export-schema`) and frontend types synchronized (`pnpm run api:sync`).
- [ ] Relevant markdown documentation updated in `docs/` if architecture or workflow changed.
- [ ] Pull request description filled out completely with linked story/task.

### Review & Integration
- [ ] PR approved by designated `@zenos-team` code owners.
- [ ] Branch is rebased or up-to-date with target branch (`develop` / `main`).
- [ ] CI pipeline status is green.
