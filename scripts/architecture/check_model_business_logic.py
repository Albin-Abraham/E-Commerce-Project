#!/usr/bin/env python3
"""
Architecture Fitness Function: Dumb Model & Logic Separation Checker
Enforces ADR-011:
- Models are pure data containers.
- Domain calculations (e.g. reserving stock, computing prices, financial posting)
  must reside in domain aggregates, use cases, or services, NEVER inside model .save() or .clean().
"""

import ast
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Methods that should NOT contain business calculation logic in Dumb Models
RESTRICTED_MODEL_METHODS = {"clean"}

# Keywords indicating complex domain calculations that belong in services/aggregates
BUSINESS_CALCULATION_KEYWORDS = {
    "reserve",
    "calculate",
    "compute",
    "pricing",
    "journal_entry",
    "post_to_ledger",
    "balance_sheet",
    "tax_engine",
}


class ModelMethodVisitor(ast.NodeVisitor):
    def __init__(self, filepath: Path):
        self.filepath = filepath
        self.violations: list[str] = []
        self.current_class: str | None = None

    def visit_ClassDef(self, node: ast.ClassDef):
        # Look for model classes (inheriting from models.Model or BaseModel)
        base_names = [b.id for b in node.bases if isinstance(b, ast.Name)]
        base_attrs = [b.attr for b in node.bases if isinstance(b, ast.Attribute)]
        
        is_model = any(
            name in ("Model", "BaseModel", "AbstractBaseUser")
            for name in (base_names + base_attrs)
        )

        if is_model:
            old_class = self.current_class
            self.current_class = node.name
            for item in node.body:
                if isinstance(item, ast.FunctionDef) and item.name in ("save", "clean"):
                    self._check_method_body(item)
            self.current_class = old_class

        self.generic_visit(node)

    def _check_method_body(self, fn: ast.FunctionDef):
        # Scan body for forbidden domain calculations
        code_str = ast.unparse(fn).lower()
        for kw in BUSINESS_CALCULATION_KEYWORDS:
            if kw in code_str:
                self.violations.append(
                    f"{self.filepath.relative_to(BASE_DIR)}:{fn.lineno} "
                    f"Class '{self.current_class}.{fn.name}()' contains business logic keyword '{kw}'. "
                    f"Per ADR-011 (Dumb Models), business calculations must live in domain aggregates or services."
                )


def main() -> int:
    scan_targets = []
    apps_dir = BASE_DIR / "apps"
    if apps_dir.exists():
        for py_file in apps_dir.rglob("*.py"):
            if "models" in py_file.parts and not py_file.name.startswith("."):
                scan_targets.append(py_file)

    total_violations = []
    scanned_files = 0

    for py_file in scan_targets:
        scanned_files += 1
        try:
            with open(py_file, "r", encoding="utf-8") as f:
                tree = ast.parse(f.read(), filename=str(py_file))
            visitor = ModelMethodVisitor(py_file)
            visitor.visit(tree)
            total_violations.extend(visitor.violations)
        except Exception as e:
            print(f"Error parsing {py_file}: {e}", file=sys.stderr)

    print(f"Dumb Model & Logic Separation Check: Scanned {scanned_files} model files.")
    if total_violations:
        print("\n❌ DOMAIN LOGIC LEAK VIOLATIONS DETECTED:", file=sys.stderr)
        for v in total_violations:
            print(f"  • {v}", file=sys.stderr)
        print(f"\nTotal violations: {len(total_violations)}", file=sys.stderr)
        return 1

    print("✅ All domain models conform to ADR-011 Dumb Model standards (zero business logic in ORM models).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
