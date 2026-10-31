#!/usr/bin/env bash
#
# ZenOS Quality Orchestrator Wrapper
# Container-aware: seamlessly runs directly inside Docker or delegates from host
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# 1. If running inside Docker container, execute directly
if [ -f /.dockerenv ] || { [ -f /app/manage.py ] && [ "${PWD}" = "/app" ]; }; then
    PYTHON_BIN="$(which python3 || which python || echo "/usr/local/bin/python")"
    exec "${PYTHON_BIN}" "${SCRIPT_DIR}/check.py" "$@"
fi

# 2. If running on host with an active virtualenv, execute directly
if [ -n "${VIRTUAL_ENV:-}" ] && [ -x "${VIRTUAL_ENV}/bin/python" ]; then
    PYTHON_BIN="${VIRTUAL_ENV}/bin/python"
    export PATH="${VIRTUAL_ENV}/bin:${PATH}"
    exec "${PYTHON_BIN}" "${SCRIPT_DIR}/check.py" "$@"
elif [ -x "${REPO_ROOT}/env/bin/python" ]; then
    PYTHON_BIN="${REPO_ROOT}/env/bin/python"
    export PATH="${REPO_ROOT}/env/bin:${PATH}"
    exec "${PYTHON_BIN}" "${SCRIPT_DIR}/check.py" "$@"
elif [ -x "${REPO_ROOT}/venv/bin/python" ]; then
    PYTHON_BIN="${REPO_ROOT}/venv/bin/python"
    export PATH="${REPO_ROOT}/venv/bin:${PATH}"
    exec "${PYTHON_BIN}" "${SCRIPT_DIR}/check.py" "$@"
fi

# 3. Host without virtualenv: Delegate to Docker django-web container
if command -v docker >/dev/null 2>&1; then
    # Check if django-web service container is running
    if docker compose ps --services --filter "status=running" 2>/dev/null | grep -q "^django-web$"; then
        exec docker compose exec -T django-web ./tools/quality/orchestrator/check.sh "$@"
    else
        exec docker compose run --rm django-web ./tools/quality/orchestrator/check.sh "$@"
    fi
fi

# 4. Fallback to system python3 if Docker is unavailable
exec python3 "${SCRIPT_DIR}/check.py" "$@"
