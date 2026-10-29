# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability or client-side authorization bypass in the ZenOS web application, **do not open a public GitHub issue.**

### Reporting Process
1. Email your report to **security@zenos.internal** (or contact the `@zenos-team/security` team).
2. Include:
   - Vulnerability details (XSS, token leak, prototype pollution, sensitive data in state).
   - Steps to reproduce or HTTP request/response traces.
   - Screen recordings or proof of concept if applicable.

### Response SLA
- **Acknowledgement:** Within 24 hours.
- **Triage & Remediation:** Within 48 hours for critical severity issues.

---

## Frontend Security Standards
- **Token Security:** Store JWT access tokens in memory or httpOnly cookies, never in localStorage/sessionStorage.
- **Content Security:** Sanitize dynamic HTML rendering (use DOMPurify or safe React rendering).
- **Dependency Auditing:** Run `pnpm deps:check` to audit supply chain vulnerabilities before releasing to production.
