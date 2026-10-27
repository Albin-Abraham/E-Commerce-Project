# ZenOS Security Governance Module

Guards against credential leakage, vulnerable dependencies, and static security vulnerabilities.

---

## 1. Security Gates

1. **Secret Leak Detection**:
   - Tool: **Gitleaks**
   - Runs in pre-commit and CI on all pull requests.
   - Detects API keys, tokens, passwords, private keys, and environment file commits.

2. **Dependency CVE Auditing**:
   - Tool: **pip-audit** / **npm audit**
   - Scans lockfiles and active requirements against the PyPA Advisory Database and National Vulnerability Database.

3. **Static Application Security Testing (SAST)**:
   - Tool: **CodeQL** (in GitHub Actions)
   - Evaluates SQL injection risks, insecure deserialization, and authorization bypasses.

---

## 2. Remediation Policy

- Critical and High vulnerabilities block PR merging immediately.
- Medium vulnerabilities must be remediated or scheduled as debt tickets within one sprint.
