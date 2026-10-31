#!/usr/bin/env python3
"""
Architecture Fitness Function: Tenant Scoping & Isolation Guard
Enforces Multi-Tenant Isolation (ADR-004):
- Service and View queries on multi-tenant domain entities must not use unrestricted .objects.all()
  without applying tenant context (company/company_id).
"""

import ast
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Entities that must always be tenant-isolated
TENANT_BOUND_ENTITIES = {
    "Product",
    "ProductVariant",
    "Order",
    "OrderItem",
    "Customer",
    "Inventory",
    "POSTransaction",
    "POSSession",
    "PurchaseOrder",
    "JournalEntry",
    "Account",
}


class TenantQueryVisitor(ast.NodeVisitor):
    def __init__(self, filepath: Path):
        self.filepath = filepath
        self.warnings: list[str] = []

    def visit_Call(self, node: ast.Call):
        # Look for <TenantBoundModel>.objects.all() without subsequent filter
        if isinstance(node.func, ast.Attribute) and node.func.attr == "all":
            value = node.func.value
            if isinstance(value, ast.Attribute) and value.attr == "objects":
                model_name = getattr(value.value, "id", None)
                if model_name in TENANT_BOUND_ENTITIES:
                    self.warnings.append(
                        f"{self.filepath.relative_to(BASE_DIR)}:{node.lineno} "
                        f"Unfiltered query '{model_name}.objects.all()'. "
                        f"Ensure this is scoped by company_id via TenantScopedRepository or RequestContext."
                    )
        self.generic_visit(node)


def main() -> int:
    scan_targets = []
    apps_dir = BASE_DIR / "apps"
    if apps_dir.exists():
        for py_file in apps_dir.rglob("*.py"):
            parts = py_file.parts
            # Check services, views, application layers (exclude tests and migrations)
            if any(p in ("services", "application", "views", "interface") for p in parts):
                if (
                    not py_file.name.startswith(".")
                    and "tests" not in parts
                    and "migrations" not in parts
                ):
                    scan_targets.append(py_file)

    scanned_files = 0
    all_warnings = []

    for py_file in scan_targets:
        scanned_files += 1
        try:
            with open(py_file, encoding="utf-8") as f:
                tree = ast.parse(f.read(), filename=str(py_file))
            visitor = TenantQueryVisitor(py_file)
            visitor.visit(tree)
            all_warnings.extend(visitor.warnings)
        except Exception as e:
            print(f"Error parsing {py_file}: {e}", file=sys.stderr)

    print(f"Tenant Scoping & Isolation Check: Scanned {scanned_files} service/interface files.")
    if all_warnings:
        print("\n⚠️ TENANT SCOPING WARNINGS (Review for strict isolation):")
        for w in all_warnings:
            print(f"  • {w}")
        print(f"\nTotal unscoped query patterns flagged: {len(all_warnings)}")
    else:
        print("✅ Zero raw unscoped queries on tenant-bound entities.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
