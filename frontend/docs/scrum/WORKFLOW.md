# ZenOS Scrum Engineering Workflow

## 1. Overview
This document defines how engineering work moves from initial ideation through to release in the ZenOS platform. Every code change must tie back to a tracked backlog item and progress through explicit quality gates.

---

## 2. The 7-Stage Delivery Pipeline

```text
[Backlog Refinement]
       │
       ▼
[Definition of Ready (DoR) Gate]
       │
       ▼
[Sprint Planning & Task Slicing]
       │
       ▼
[Local Development & Pre-commit Hooks]
       │
       ▼
[Pull Request & Automated CI Checks]
       │
       ▼
[Peer Review & Definition of Done (DoD) Gate]
       │
       ▼
[Merge -> Staging / Release Automation]
```

---

## 3. Stages in Detail

### Stage 1: Product Backlog Refinement
- **Frequency:** Weekly or mid-sprint.
- **Participants:** Product Owner, Tech Leads, Engineering Team.
- **Activity:** Review epics and candidate stories for the upcoming sprint. Define business goals, user personas, and rough Acceptance Criteria.

### Stage 2: Definition of Ready (DoR) Validation
- Before any work item is pulled into a sprint backlog, it must fulfill the [Definition of Ready](DEFINITION_OF_READY.md).
- Stories without testable acceptance criteria, unclarified API contracts, or missing design assets are rejected back to refinement.

### Stage 3: Sprint Planning & Task Slicing
- Sizing using story points (Fibonacci).
- Stories exceeding 5 points must be sliced according to the [Story Slicing Guide](STORY_SLICING_GUIDE.md).
- Technical and architectural tasks follow the [Technical Task Guidelines](TECHNICAL_TASK_GUIDELINES.md).

### Stage 4: Local Development & Pre-commit
- Developers branch off `develop` using `feature/<issue-id>-<short-description>`.
- Client-side pre-commit hooks verify code hygiene (`.editorconfig`, Ruff, Prettier, ESLint, Layered DAG compliance).
- Fast feedback loop: pre-commit hooks should finish in under 3 seconds.

### Stage 5: Pull Request & CI Automation
- PR opened targeting `develop` using `.github/PULL_REQUEST_TEMPLATE.md`.
- Automated CI pipeline runs:
  - Code formatting & static linting
  - Layered architecture DAG check (`check_import_dag.py`)
  - Type checking (`tsc` / Pyright)
  - Full automated test suite (`pytest` / `vitest`)
  - Schema export & type parity verification

### Stage 6: Peer Review & Definition of Done (DoD)
- Minimum 1 to 2 approvals required by designated `@zenos-team` code owners (`.github/CODEOWNERS`).
- The PR author and reviewer verify all items in the [Definition of Done](DEFINITION_OF_DONE.md).

### Stage 7: Merge & Release Verification
- PR is merged using Squash & Merge (or Rebase) to maintain a clean Git history.
- Merge to `develop` triggers deployment to the Staging environment.
- Merge to `main` prepares the verified artifact for production release.
