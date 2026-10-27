# ZenOS Dependencies Governance Module

Governs package health, lockfile integrity, and automated dependency updates.

---

## 1. Automation with Dependabot

Automated weekly dependency scans and pull requests are managed through `.github/dependabot.yml`.

- **Python**: Scans `requirements.txt` and `requirements-dev.txt` weekly.
- **GitHub Actions**: Updates workflow action SHAs weekly.

---

## 2. Policy

- No untracked dependencies: every package must be declared with minimum or pinned versions in `requirements.txt`.
- Pull requests updating dependencies automatically trigger the CI test suite.
