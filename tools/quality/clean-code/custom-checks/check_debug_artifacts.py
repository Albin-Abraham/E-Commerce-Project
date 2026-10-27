#!/usr/bin/env python3
"""
ZenOS Clean Code Check: Debug Artifacts

Ensures that developers do not commit temporary debugging calls (e.g. breakpoint(), pdb).
"""

from __future__ import annotations

import ast
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]

DEBUG_CALLS = {"breakpoint"}
DEBUG_MODULES = {"pdb", "ipdb", "pudb", "rpdb"}

EXCLUDED_PARTS = {"venv", ".venv", "env", "node_modules", ".git", "migrations"}


def check_python_file(path: Path) -> list[str]:
    violations = []
    try:
        content = path.read_text(encoding="utf-8")
        tree = ast.parse(content, filename=str(path))
    except Exception:
        return []

    for node in ast.walk(tree):
        # Detect breakpoint()
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in DEBUG_CALLS:
                violations.append(f"  line {node.lineno}: Prohibited call to '{node.func.id}()'")
            elif isinstance(node.func, ast.Attribute):
                if node.func.attr == "set_trace":
                    if (
                        isinstance(node.func.value, ast.Name)
                        and node.func.value.id in DEBUG_MODULES
                    ):
                        violations.append(
                            f"  line {node.lineno}: Prohibited debug breakpoint '{node.func.value.id}.set_trace()'"
                        )

        # Detect import pdb / import ipdb
        elif isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name in DEBUG_MODULES:
                    violations.append(
                        f"  line {node.lineno}: Prohibited import of debug module '{alias.name}'"
                    )
        elif isinstance(node, ast.ImportFrom):
            if node.module in DEBUG_MODULES:
                violations.append(
                    f"  line {node.lineno}: Prohibited import from debug module '{node.module}'"
                )

    return violations


def main():
    total_violations = 0
    scanned = 0

    scan_targets = [REPO_ROOT / "core", REPO_ROOT / "apps", REPO_ROOT / "backend"]
    for target in scan_targets:
        if not target.is_dir():
            continue
        for py_file in target.rglob("*.py"):
            if any(part in py_file.parts for part in EXCLUDED_PARTS):
                continue
            scanned += 1
            errs = check_python_file(py_file)
            if errs:
                total_violations += len(errs)
                print(f"[CLEAN-CODE-DEBUG-ARTIFACT] {py_file.relative_to(REPO_ROOT)}:")
                for e in errs:
                    print(e)

    if total_violations > 0:
        print(
            f"\nFailed: {total_violations} debug artifact(s) found across {scanned} files.",
            file=sys.stderr,
        )
        sys.exit(1)
    else:
        print(f"Verified {scanned} files: No debug artifacts found.")
        sys.exit(0)


if __name__ == "__main__":
    main()
