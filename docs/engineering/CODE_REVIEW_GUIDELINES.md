# ZenOS Engineering: Code Review Guidelines

Guidelines for pull request authors and reviewers to maintain velocity and code excellence.

---

## 1. Author Responsibilities

- **Small Pull Requests**: Aim for less than 400 lines of change per PR. Split large epics into stacked, incremental PRs.
- **Pass All Local Gates**: Ensure `./tools/quality/orchestrator/check.sh fast` passes prior to opening a PR.
- **Complete the PR Template**: Fill out all checkboxes in `.github/PULL_REQUEST_TEMPLATE.md`.
- **Self-Review**: Review your own git diff on GitHub before requesting peer review.

---

## 2. Reviewer Responsibilities

- **Focus on Architecture & Business Logic**: Let the CI bots and linters handle formatting, linting, and imports. Focus on logic correctness, security, data integrity, and tenant isolation.
- **Constructive Feedback**: Offer specific alternatives and explanations when suggesting changes.
- **Timely Feedback**: Aim to review pending PRs within 24 hours of assignment.
