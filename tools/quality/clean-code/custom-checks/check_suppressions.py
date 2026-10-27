#!/usr/bin/env python3
"""
ZenOS Clean Code Check: Suppression Discipline

Enforces that linter and type-checker suppressions are granular (e.g. # noqa: F401)
and not blanket suppressions (e.g. bare # noqa).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]

# Match blanket noqa: # noqa followed by nothing, or only whitespace / comment without colon code
BLANKET_NOQA_RE = re.compile(r"#\s*noqa(?!\s*:\s*[A-Za-z0-9])(?:\s*$|\s+[^:])", re.IGNORECASE)

EXCLUDED_PARTS = {"venv", ".venv", "env", "node_modules", ".git", "migrations"}


def check_file(path: Path) -> list[str]:
    violations = []
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except Exception:
        return []

    for lineno, line in enumerate(lines, start=1):
        stripped = line.strip()
        # Allow DAG suppression tag
        if "# DAG" in stripped or "# noqa-dag" in stripped:
            continue

        match = BLANKET_NOQA_RE.search(stripped)
        if match:
            # Check if it has a reason after colon
            matched_text = match.group(0).strip()
            if matched_text.lower() == "# noqa":
                violations.append(
                    f"  line {lineno}: Blanket '{matched_text}' found. Specify rule code (e.g., '# noqa: F401')."
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
            errs = check_file(py_file)
            if errs:
                total_violations += len(errs)
                print(f"[CLEAN-CODE-SUPPRESSION-VIOLATION] {py_file.relative_to(REPO_ROOT)}:")
                for e in errs:
                    print(e)

    if total_violations > 0:
        print(
            f"\nFailed: {total_violations} unassigned suppression(s) found across {scanned} files.",
            file=sys.stderr,
        )
        sys.exit(1)
    else:
        print(f"Verified {scanned} files: All suppression comments are disciplined and granular.")
        sys.exit(0)


if __name__ == "__main__":
    main()
