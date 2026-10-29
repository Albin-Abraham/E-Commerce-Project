# Database Migrations & Rollback Runbook

## 1. Zero-Downtime Migration Policy (Expand & Contract)

To ensure applications can be rolled back safely at any time, all schema modifications in ZenOS must follow the **Expand and Contract (Parallel Run)** pattern across distinct releases.

```text
[Sprint N: Expand Phase]
- Add new columns / tables with NULL or default values.
- Application writes to both old and new schema.
- Previous code can still safely read old schema. (ROLLBACK SAFE)

[Sprint N+1: Data Backfill Phase]
- Asynchronous Celery task backfills historical rows.

[Sprint N+2: Contract Phase]
- Application reads exclusively from new schema.
- Old unused column or constraint dropped.
```

---

## 2. Breaking Schema Rules (Anti-Patterns)
The following will **fail code review and block merging**:
- ❌ Adding a `NOT NULL` column without a default value.
- ❌ Renaming an existing column directly in a single release (breaks running instances).
- ❌ Dropping a column that the currently running version still queries.
- ❌ Heavy table alterations (`ALTER TABLE`) without timeouts on tables with $> 100,000$ rows.

---

## 3. Safe Migration Rollback Procedure

When an unverified migration must be reverted on staging or production:

### Step 1: Identify Target Migration Node
```bash
# Check current migration status
python manage.py showmigrations <app_name>
```
Example Output:
```text
[X] 0014_previous_stable_migration
[X] 0015_problematic_schema_change
```

### Step 2: Target the Previous Stable Migration
Roll back the database state to the node directly prior to the problematic migration:
```bash
# Command: python manage.py migrate <app_name> <previous_migration_name>
python manage.py migrate <app_name> 0014_previous_stable_migration
```

### Step 3: Verify Integrity & Locks
```sql
-- Check for lingering table locks in PostgreSQL
SELECT pid, age(clock_timestamp(), query_start), usename, query, state
FROM pg_stat_activity
WHERE state != 'idle' AND query ILIKE '%alter table%'
ORDER BY query_start ASC;
```

---

## 4. Point-In-Time-Recovery (PITR) & Emergency Restores

If a migration executed irreversible destructive data modifications (`DROP TABLE`, unrecoverable `DELETE`):

1. **Halt Application Traffic:**
   ```bash
   # Temporarily route ingress to maintenance mode
   docker compose stop web celery_default celery_beat
   ```
2. **Restore PostgreSQL from WAL / Snapshot:**
   ```bash
   # Point-In-Time Recovery to timestamp before deployment (e.g. 2026-10-28 14:00:00 UTC)
   pg_restore -h localhost -p 5432 -U postgres -d backend_db \
     --clean --if-exists /var/backups/zenos_db_pre_deploy.dump
   ```
3. **Verify Restored Tenant Data:**
   ```sql
   SELECT count(*) FROM users_user;
   SELECT count(*) FROM company_company;
   ```
4. **Resume Services & Clear Metadata Cache:**
   ```bash
   redis-cli -u redis://localhost:6379/0 FLUSHDB
   docker compose start web celery_default celery_beat
   ```
