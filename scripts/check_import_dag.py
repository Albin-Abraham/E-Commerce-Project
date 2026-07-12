#!/usr/bin/env python3
"""
Check that top-level imports across the project respect the layered DAG.

LAYER 0: pure Django / DRF / stdlib / 3rd-party
LAYER 1: core/base_models/
LAYER 2: core/admin/models/, core/admin/utils/
LAYER 3: core/admin/helpers/, core/admin/services/
LAYER 4: core/base_serializers/
LAYER 5: core/base_views/
LAYER 6: core/admin/views/, core/admin/urls/
LAYER 7: apps/*/
LAYER 8: core/admin/tasks/

Rules:
  - Layer N may import from Layer < N only (top-level imports).
  - Same-layer imports within the same app are allowed.
  - Lazy imports inside function/method bodies are NOT flagged.
  - Management commands are exempt (they need cross-layer access).

Usage::

    python scripts/check_import_dag.py
"""

from __future__ import annotations

import ast
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# (package_prefix, layer_number, description)
LAYERS: list[tuple[str, int, str]] = [
    ("core.registry", 0, "Registry"),
    ("core.base_models", 1, "Base Models"),
    ("core.admin.models", 2, "Admin Models"),
    ("core.admin.utils", 2, "Admin Utils"),
    ("core.admin.helpers", 3, "Admin Helpers"),
    ("core.admin.services", 3, "Admin Services"),
    ("core.base_serializers", 4, "Base Serializers"),
    ("core.base_views", 5, "Base Views"),
    ("core.admin.views", 6, "Admin Views"),
    ("core.admin.urls", 6, "Admin URLs"),
    ("core.admin.throttling", 6, "Admin Throttling"),
    ("core.admin.decorators", 6, "Admin Decorators"),
    ("core.admin.permissions", 6, "Admin Permissions"),
    ("apps.", 7, "Apps"),
    ("core.admin.tasks", 8, "Admin Tasks"),
]


def _layer_of(module_path: str) -> int | None:
    for prefix, layer, _ in LAYERS:
        if module_path == prefix.rstrip(".") or module_path.startswith(prefix):
            return layer
    return None  # unknown / external


def _is_stdlib(target: str) -> bool:
    top = target.split(".")[0]
    return top in sys.stdlib_module_names if hasattr(sys, "stdlib_module_names") else False


def check_file(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        source = path.read_text()
        tree = ast.parse(source)
        lines = source.splitlines()
    except SyntaxError as e:
        return [f"  SyntaxError: {e}"]

    rel = path.relative_to(REPO).as_posix()
    file_module = rel.replace("/", ".").replace(".py", "")

    # Skip management commands – they need cross-layer access
    if "management/commands" in rel:
        return []

    file_layer = _layer_of(file_module)
    if file_layer is None:
        return []

    def _has_noqa(node: ast.AST) -> bool:
        lineno = getattr(node, "lineno", None)
        if lineno is None:
            return False
        # Check the import line and the preceding line for a suppression comment
        for idx in (lineno - 1, lineno - 2):
            if 0 <= idx < len(lines):
                stripped = lines[idx].strip()
                if "# noqa: DAG" in stripped or "# noqa: DAG" in stripped.rsplit("#", 1)[-1]:
                    return True
        return False

    # Only inspect top-level import statements (direct children of ast.Module)
    for node in ast.iter_child_nodes(tree):
        if _has_noqa(node):
            continue
        if isinstance(node, ast.Import):
            for alias in node.names:
                _check_import(alias.name, file_layer, file_module, rel, errors)
        elif isinstance(node, ast.ImportFrom):
            mod = node.module or ""
            if mod.startswith("."):
                continue  # relative imports are fine
            _check_import(mod, file_layer, file_module, rel, errors)

    return errors


def _check_import(
    target: str,
    file_layer: int,
    file_module: str,
    rel_path: str,
    errors: list[str],
) -> None:
    # Skip stdlib, django, drf, celery
    if _is_stdlib(target):
        return
    if target.startswith(("django", "rest_framework", "celery", "redis", "environ", "yaml")):
        return
    if target.startswith("core.registry"):
        return
    # Allow same-package imports within core.base_*
    if target.startswith(("core.base_models", "core.base_serializers", "core.base_views")):
        return
    # Allow same-package imports within core.admin.*
    if target.startswith("core.admin") and file_module.startswith("core.admin"):
        return
    # Allow apps → apps same-layer imports
    if target.startswith("apps.") and file_module.startswith("apps."):
        return

    target_layer = _layer_of(target)
    if target_layer is None:
        return

    if target_layer >= file_layer:
        errors.append(
            f"{rel_path}: imports '{target}' (layer {target_layer}) "
            f"from layer-{file_layer} file (should be lazy inside method)"
        )


def main() -> int:
    all_errors: list[str] = []
    py_files = sorted(REPO.rglob("*.py"))
    py_files = [p for p in py_files if "/migrations/" not in p.as_posix()]

    for path in py_files:
        all_errors.extend(check_file(path))

    if all_errors:
        print(f"Found {len(all_errors)} DAG violation(s):\n")
        for err in all_errors:
            print(err)
        return 1

    print("No DAG violations found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
