# Deployment Health & Automated Smoke Testing Runbook

## 1. Health Probe Architecture

ZenOS exposes distinct two-tiered health probes to support Kubernetes liveness/readiness and load-balancer ingress:

### Liveness Probe (`/health/live/`)
- **Purpose:** Verifies that the ASGI / Gunicorn server process is alive, unblocked, and accepting HTTP connections.
- **HTTP Status:** `200 OK`
- **Failure Condition:** Process deadlock, event loop freeze, memory crash.

### Readiness Probe (`/health/ready/`)
- **Purpose:** Verifies that all downstream infrastructure dependencies are healthy before routing live user traffic:
  1. **Primary PostgreSQL Database:** Can execute `SELECT 1`.
  2. **Redis Broker & Cache:** Can issue `PING` $\rightarrow$ `PONG`.
  3. **Celery Worker Pool:** Can communicate with queue broker.
- **HTTP Status:** `200 OK` (Traffic routed) or `503 Service Unavailable` (Traffic stopped).

---

## 2. Automated Smoke Test Script

Run immediately post-deployment (Staging or Production) before declaring release success:

```bash
#!/bin/bash
set -e

BASE_URL="${1:-http://localhost:8070}"
echo "Running Smoke Tests against: $BASE_URL"

# 1. Liveness Check
echo "[1/4] Checking Liveness..."
curl -s -f "$BASE_URL/health/live/" > /dev/null
echo "  ✓ Liveness probe OK"

# 2. Readiness Check (DB + Cache)
echo "[2/4] Checking Readiness..."
curl -s -f "$BASE_URL/health/ready/" > /dev/null
echo "  ✓ Readiness probe OK"

# 3. OpenAPI Schema Endpoint Check
echo "[3/4] Checking API Schema..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/schema/")
if [ "$HTTP_CODE" -eq 200 ]; then
  echo "  ✓ Schema generated (HTTP 200)"
else
  echo "  ❌ Schema generation failed (HTTP $HTTP_CODE)"
  exit 1
fi

# 4. Auth Endpoint Connectivity
echo "[4/4] Checking Auth Endpoint..."
HTTP_AUTH=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth/token/" \
  -H "Content-Type: application/json" -d '{}')
if [ "$HTTP_AUTH" -eq 400 ]; then
  echo "  ✓ Auth endpoint responsive (validation rejection HTTP 400 as expected for empty payload)"
else
  echo "  ❌ Unexpected auth response (HTTP $HTTP_AUTH)"
  exit 1
fi

echo "=== All Smoke Tests Passed Successfully ==="
```

---

## 3. Automated Rollback Triggers

If any of the following occur within **15 minutes** post-deployment, an automated or manual rollback must be triggered:
- [ ] `/health/ready/` fails 3 consecutive checks (10-second intervals).
- [ ] Global 5xx error rate exceeds **1.0%** of total traffic.
- [ ] API p95 response latency exceeds **2,000ms** (indicates unindexed database query or migration lock).
- [ ] Celery task queue backlog grows continuously without worker consumption.
