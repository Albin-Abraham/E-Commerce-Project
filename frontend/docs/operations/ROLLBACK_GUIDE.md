# ZenOS Production & Staging Rollback Runbook

## 1. Overview & Rollback Philosophy
When a release introduces critical bugs, regressions, or operational instability, the primary directive is **Mean Time to Recovery (MTTR)**. 

### The Golden Rule: Promote by Digest, Never Rebuild on Failure
- Rollbacks must deploy an **already verified, immutable build artifact** (container digest or previously tagged image).
- **Never attempt hotfix code edits under an active incident** when a known good previous artifact is available.

---

## 2. Rollback Decision Matrix

| Severity | Symptoms | Action | Target MTTR |
| :--- | :--- | :--- | :--- |
| **Sev-1 (Critical)** | Core outage, database lock, authentication failure, tenant isolation breach | **Immediate Rollback** (no hotfix delay) | $\le 10$ minutes |
| **Sev-2 (Major)** | Core workflow broken (e.g. attendance submit failing, 5xx rate > 2%) | Evaluate: Rollback if no 15-min fix is verified | $\le 30$ minutes |
| **Sev-3 (Minor)** | Cosmetic UI flaw, localized non-critical edge case | **Forward-Fix** in next sprint/patch release | Next release cycle |

---

## 3. Step-by-Step Rollback Procedures

### Procedure A: Frontend Container Rollback
The frontend uses promotion-by-digest in `.github/workflows/deploy.yml`.

1. **Identify Previous Stable Release / Digest:**
   ```bash
   # View recent deployment tags
   git tag -l "release/*" --sort=-creatordate | head -n 5
   ```
2. **Trigger Rollback via GitHub Actions:**
   - Navigate to **Actions** $\rightarrow$ **Production Deployment** (`deploy.yml`).
   - Click **Run workflow**.
   - Select target environment: `production` (or `staging`).
   - Specify the previous known-good release tag or digest.
3. **Verify Rollback:**
   ```bash
   curl -I https://app.zenos.internal/
   # Confirm HTTP 200 and expected bundle hash
   ```

---

### Procedure B: Backend Stack Rollback (Docker Compose / K8s)

1. **Revert Image Version:**
   ```bash
   # Switch to the previous stable release tag
   export RELEASE_TAG=v1.0.4  # previous known good version
   docker compose --env-file .env.prod pull web celery_default celery_beat
   docker compose --env-file .env.prod up -d --no-deps web celery_default celery_beat
   ```
2. **Verify Health Probes:**
   ```bash
   curl -f http://localhost:8070/health/live/
   curl -f http://localhost:8070/health/ready/
   ```
3. **Inspect Logs for Startup Exceptions:**
   ```bash
   docker compose logs --tail=100 -f web celery_default
   ```

---

### Procedure C: Database Rollback Integration
> [!CAUTION]
> **Check Database Migration Dependencies First!**
> If the failed deployment applied a database migration, check [DATABASE_MIGRATIONS.md](DATABASE_MIGRATIONS.md) before rolling back application containers:
> - If migration followed the **Expand-and-Contract** pattern, the previous application code is backward-compatible and can run immediately.
> - If a migration is destructive, consult the database rollback procedure before rolling back containers.
