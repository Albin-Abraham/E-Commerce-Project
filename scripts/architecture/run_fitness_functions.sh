#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🛡️  Running ZenOS Architecture Fitness Functions Gate"
echo "=========================================================="

echo -e "\n[1/4] Checking Strict Layered Import DAG..."
python3 scripts/check_import_dag.py

echo -e "\n[2/4] Checking Clean Architecture Layer Boundaries & Domain Purity..."
python3 scripts/architecture/check_layer_boundaries.py

echo -e "\n[3/4] Checking ADR-011 Dumb Model Logic Separation..."
python3 scripts/architecture/check_model_business_logic.py

echo -e "\n[4/4] Checking Multi-Tenant Query Scoping..."
python3 scripts/architecture/check_tenant_scoping.py

echo -e "\n=========================================================="
echo "✅ ALL ARCHITECTURE FITNESS FUNCTIONS PASSED (Self-Enforcing)"
echo "=========================================================="
