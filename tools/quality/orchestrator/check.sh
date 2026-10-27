#!/usr/bin/env bash
#
# ZenOS Quality Orchestrator Wrapper
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# Discover virtualenv Python or fallback to system python3
if [ -n "${VIRTUAL_ENV:-}" ] && [ -x "${VIRTUAL_ENV}/bin/python" ]; then
    PYTHON_BIN="${VIRTUAL_ENV}/bin/python"
    export PATH="${VIRTUAL_ENV}/bin:${PATH}"
elif [ -x "${REPO_ROOT}/env/bin/python" ]; then
    PYTHON_BIN="${REPO_ROOT}/env/bin/python"
    export PATH="${REPO_ROOT}/env/bin:${PATH}"
elif [ -x "${REPO_ROOT}/venv/bin/python" ]; then
    PYTHON_BIN="${REPO_ROOT}/venv/bin/python"
    export PATH="${REPO_ROOT}/venv/bin:${PATH}"
else
    PYTHON_BIN="python3"
fi

exec "${PYTHON_BIN}" "${SCRIPT_DIR}/check.py" "$@"
