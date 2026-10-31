#!/usr/bin/env python3
"""
Architecture Fitness Function: Layer Boundary & Domain Purity Checker
Enforces Clean Architecture:
- domain/ layer MUST NOT import django, rest_framework, or infrastructure modules.
- shared_domain/ MUST NOT import django, rest_framework, or infrastructure modules.
"""

import ast
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

FORBIDDEN_IMPORTS = {
    "django",
    "rest_framework",
    "infrastructure",
}


class ImportVisitor(ast.NodeVisitor):
    def __init__(self, filepath: Path):
        self.filepath = filepath
        self.violations: list[str] = []

    def _check_import(self, module_name: str, lineno: int):
        root_module = module_name.split(".")[0]
        if root_module in FORBIDDEN_IMPORTS or "infrastructure" in module_name:
            self.violations.append(
                f"{self.filepath.relative_to(BASE_DIR)}:{lineno} "
                f"Domain Purity Violation: Forbidden import '{module_name}'. "
                f"Domain layer must remain framework and infrastructure agnostic."
            )

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            self._check_import(alias.name, node.lineno)
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module:
            self._check_import(node.module, node.lineno)
        self.generic_visit(node)


def main() -> int:
    scan_targets = []
    
    # 1. Scan shared_domain
    shared_domain = BASE_DIR / "shared_domain"
    if shared_domain.exists():
        scan_targets.extend(shared_domain.rglob("*.py"))

    # 2. Scan all apps/*/domain
    apps_dir = BASE_DIR / "apps"
    if apps_dir.exists():
        for app in apps_dir.iterdir():
            domain_dir = app / "domain"
            if domain_dir.exists() and domain_dir.is_dir():
                scan_targets.extend(domain_dir.rglob("*.py"))

    total_violations = []
    scanned_files = 0

    for py_file in scan_targets:
        if py_file.name.startswith("."):
            continue
        scanned_files += 1
        try:
            with open(py_file, "r", encoding="utf-8") as f:
                tree = ast.parse(f.read(), filename=str(py_file))
            visitor = ImportVisitor(py_file)
            visitor.visit(tree)
            total_violations.extend(visitor.violations)
        except Exception as e:
            print(f"Error parsing {py_file}: {e}", file=sys.stderr)

    print(f"Layer Boundary & Domain Purity Check: Scanned {scanned_files} domain files.")
    if total_violations:
        print("\n❌ ARCHITECTURE VIOLATIONS DETECTED:", file=sys.stderr)
        for v in total_violations:
            print(f"  • {v}", file=sys.stderr)
        print(f"\nTotal violations: {len(total_violations)}", file=sys.stderr)
        return 1

    print("✅ All domain layers strictly conform to Domain Purity standards.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
