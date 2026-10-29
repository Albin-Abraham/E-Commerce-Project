# Incident Response & Blameless Post-Mortem Runbook

## 1. Incident Severity Definitions

| Severity | Impact | Response Time | Communications Cadence |
| :--- | :--- | :--- | :--- |
| **Sev-1** | Production down, data breach, core business halted | **< 15 minutes** | Updates every 30 minutes |
| **Sev-2** | Significant degradation (e.g., reports failing, bulk operations stuck) | **< 1 hour** | Updates every 2 hours |
| **Sev-3** | Minor defect, workaround available | **< 4 hours** | Next business day |

---

## 2. Incident Command Roles (ICS)

During a Sev-1 or Sev-2 incident, three explicit roles are assigned:

1. **Incident Commander (IC):**
   - Owns the incident response, assigns workstreams, and makes tactical decisions (e.g. approving a rollback).
   - Does *not* write code or fix bugs directly during the incident; maintains top-level coordination.
2. **Operations / SRE Lead:**
   - Diagnoses root causes, checks logs, runs database queries, executes rollback or recovery commands.
3. **Communications Lead:**
   - Updates internal stakeholders (Customer Support, Leadership) and posts public status notices.

---

## 3. Incident Lifecycle Workflow

```text
1. DETECTION
   - Alert triggered (Grafana / Sentry / 5xx error spike / /health/live/ probe)
       │
       ▼
2. TRIAGE & ASSIGNMENT
   - Incident Commander declares severity (Sev-1 / Sev-2).
   - Dedicated incident bridge / Slack channel opened: #incident-<date>-<issue>.
       │
       ▼
3. MITIGATION (Priority: Stop the Bleeding)
   - Follow ROLLBACK_GUIDE.md if recent deployment.
   - Do not spend hours diagnosing root cause if rolling back restores service.
       │
       ▼
4. VERIFICATION
   - Confirm /health/live/ and /health/ready/ return 200.
   - Run synthetic smoke tests.
       │
       ▼
5. RESOLUTION & POST-MORTEM
   - Declare incident resolved.
   - Schedule blameless post-mortem within 48 hours.
```

---

## 4. Blameless Post-Mortem Template

Every Sev-1 and Sev-2 incident requires a completed post-mortem within 48 hours:

```markdown
# Incident Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Duration:** [Start Time UTC] to [Resolved Time UTC] (Total: X minutes)
**Severity:** Sev-1 / Sev-2
**Incident Commander:** @name
**Operations Lead:** @name

## Executive Summary
Brief non-technical description of what occurred, user impact, and resolution.

## Impact Metrics
- **Users Affected:** [Number / % of requests]
- **Data Loss:** None / [Description]
- **Downtime:** X minutes

## Timeline (All times in UTC)
- **14:02** - Deployment v1.0.5 completed.
- **14:05** - 500 error rate spikes to 12%.
- **14:08** - Incident declared; IC assumes command.
- **14:12** - Rollback initiated to v1.0.4.
- **14:15** - Rollback complete; error rate drops to 0.01%.
- **14:20** - Incident declared resolved.

## Root Cause Analysis (The 5 Whys)
1. Why did the API return 500? A missing database column was queried.
2. Why was the column missing? Migration 0015 was still running when new web containers booted.
3. Why did web boot before migration finished? Entrypoint health check did not wait for migration lock.
4. Why did entrypoint not wait? Compose file lacked `condition: service_completed_successfully` on migrate.
5. Why was this not caught in staging? Staging had low row count, so migration finished instantly.

## Action Items (Preventing Recurrence)
- [ ] Update Docker Compose migration dependency chain (@devops - Sprint 25)
- [ ] Add pre-deployment migration dry-run check in CI (@backend-lead - Sprint 25)
- [ ] Add synthetic health alert in Grafana for migration lock duration (@sre - Sprint 25)
```
