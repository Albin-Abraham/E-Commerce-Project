# Definition of Ready (DoR)

## Purpose
The Definition of Ready (DoR) establishes the minimum criteria a user story, bug, or technical task must meet before it can be scheduled for a sprint. It prevents developers from starting work on ambiguously defined features that lead to mid-sprint stalls or rework.

---

## 1. User Story DoR Checklist

A story is **Ready** if and only if all of the following are satisfied:

- [ ] **Clear User Narrative**: Formatted as:
  > *As a [type of user], I want [an action/goal] so that [a specific business benefit is achieved].*
- [ ] **Business Value Documented**: The primary outcome and KPIs (efficiency gain, error reduction, regulatory compliance) are recorded.
- [ ] **Unambiguous Acceptance Criteria (AC)**:
  - Formatted using Given-When-Then or clear bulleted checklists.
  - Covers happy path, edge cases, and error/validation responses (e.g. 400 Bad Request, 403 Forbidden).
- [ ] **Design & Contract Parity**:
  - UI mockups, Figma links, or wireframes are attached (for frontend/fullstack items).
  - Backend API endpoint paths, HTTP verbs, and request/response payloads are defined.
- [ ] **Architecture & Data Dependencies Identified**:
  - Requires new database models or migrations? (Yes / No)
  - Requires changes to Layered DAG or multi-tenant rules? (Yes / No)
  - Third-party service dependencies (e.g., MinIO, Celery worker, Redis) verified.
- [ ] **Sized for Sprint Cadence**:
  - Estimated at $\le 5$ story points. Larger items are decomposed per the [Story Slicing Guide](STORY_SLICING_GUIDE.md).
- [ ] **Security & Authorization Constraints Stated**:
  - Roles, permissions, or tenant tenancy scopes necessary to access the feature are listed.

---

## 2. Technical Task DoR Checklist
For refactors, architectural enhancements, or CI/CD pipelines:
- [ ] Clear problem statement explaining the current technical debt or bottleneck.
- [ ] Target architectural state or design pattern documented.
- [ ] Measurable success metric (e.g., reduced build time, zero circular imports, memory usage bounded).
- [ ] Risk assessment: Does this touch existing database tables or core APIs?

---

## 3. Bug Report DoR Checklist
- [ ] Clear summary and severity classification (P1 blocker, P2 high, P3 normal, P4 low).
- [ ] Deterministic reproduction steps with sample payloads or URLs.
- [ ] Observed behavior vs expected behavior explicitly stated.
- [ ] Environment specified (Local, Staging, Production) with logs or stack trace attached.
