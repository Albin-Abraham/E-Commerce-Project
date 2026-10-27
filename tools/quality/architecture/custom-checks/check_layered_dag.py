#!/usr/bin/env python3
"""
ZenOS Architectural Layered DAG Checker

Verifies that Python imports respect the layered DAG declared in
tools/quality/architecture/rules/layers.yaml.
"""

from __future__ import annotations

import ast
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None

REPO_ROOT = Path(__file__).resolve().parents[4]
RULES_PATH = REPO_ROOT / "tools" / "quality" / "architecture" / "rules" / "layers.yaml"


def load_rules() -> tuple[list[tuple[str, int, str]], list[str], list[str]]:
    if RULES_PATH.is_file() and yaml is not None:
        with open(RULES_PATH, encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            layers = [
                (item["prefix"], item["layer"], item["description"])
                for item in data.get("layers", [])
            ]
            exemptions = data.get("exemptions", {}).get(
                "path_patterns", ["management/commands", "tests"]
            )
            suppression_tags = data.get("exemptions", {}).get(
                "suppression_tags", ["# DAG", "# noqa: DAG", "# noqa-dag"]
            )
            return layers, exemptions, suppression_tags

    # Fallback defaults if layers.yaml or pyyaml is missing
    fallback_layers = [
        ("core.registry", 0, "Registry"),
        ("core.configuration", 0, "Configuration"),
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
    return fallback_layers, ["management/commands", "tests"], ["# DAG", "# noqa: DAG", "# noqa-dag"]


LAYERS, EXEMPTIONS, SUPPRESSION_TAGS = load_rules()


def _layer_of(module_path: str) -> int | None:
    for prefix, layer, _ in LAYERS:
        if module_path == prefix.rstrip(".") or module_path.startswith(prefix):
            return layer
    return None


def _is_stdlib(target: str) -> bool:
    top = target.split(".")[0]
    return top in sys.stdlib_module_names if hasattr(sys, "stdlib_module_names") else False


def check_file(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source)
        lines = source.splitlines()
    except SyntaxError as e:
        return [f"  SyntaxError: {e}"]
    except UnicodeDecodeError:
        return []

    rel = path.relative_to(REPO_ROOT).as_posix()
    file_module = rel.replace("/", ".").replace(".py", "")

    # Check exemptions
    for ex in EXEMPTIONS:
        if ex in rel:
            return []

    file_layer = _layer_of(file_module)
    if file_layer is None:
        return []

    def _has_noqa(node: ast.AST) -> bool:
        lineno = getattr(node, "lineno", None)
        if lineno is None:
            return False
        for idx in (lineno - 1, lineno - 2):
            if 0 <= idx < len(lines):
                stripped = lines[idx].strip()
                if any(tag in stripped for tag in SUPPRESSION_TAGS):
                    return True
                noqa_codes = stripped.partition("# noqa:")[2]
                if any(code.strip() == "DAG" for code in noqa_codes.split(",")):
                    return True
        return False

    def _check_import_target(target: str, node: ast.AST) -> None:
        if _is_stdlib(target):
            return
        if target.startswith(("django", "rest_framework", "celery", "redis", "environ", "yaml")):
            return
        if target.startswith(("core.registry", "core.configuration")):
            return
        if target.startswith(("core.base_models", "core.base_serializers", "core.base_views")):
            return
        if target.startswith("core.admin") and file_module.startswith("core.admin"):
            return
        if target.startswith("apps.") and file_module.startswith("apps."):
            return

        tgt_layer = _layer_of(target)
        if tgt_layer is not None and tgt_layer > file_layer:
            if not _has_noqa(node):
                errors.append(
                    f"  line {node.lineno}: Layer {file_layer} ({file_module}) "
                    f"imports Layer {tgt_layer} ({target})"
                )

    for node in ast.iter_child_nodes(tree):
        if _has_noqa(node):
            continue
        if isinstance(node, ast.Import):
            for alias in node.names:
                _check_import_target(alias.name, node)
        elif isinstance(node, ast.ImportFrom):
            mod = node.module or ""
            if mod.startswith("."):
                continue
            _check_import_target(mod, node)

    return errors


def main():
    search_dirs = [REPO_ROOT / "core", REPO_ROOT / "apps"]
    total_violations = 0
    scanned_files = 0

    for sdir in search_dirs:
        if not sdir.is_dir():
            continue
        for py_file in sorted(sdir.rglob("*.py")):
            if "migrations" in py_file.parts:
                continue
            scanned_files += 1
            errs = check_file(py_file)
            if errs:
                total_violations += len(errs)
                print(f"[ARCH-DAG-VIOLATION] {py_file.relative_to(REPO_ROOT)}:")
                for e in errs:
                    print(e)

    if total_violations > 0:
        print(
            f"\nFailed: {total_violations} architectural DAG violation(s) found across {scanned_files} files.",
            file=sys.stderr,
        )
        sys.exit(1)
    else:
        print(f"Verified {scanned_files} files: No architectural DAG violations found.")
        sys.exit(0)


if __name__ == "__main__":
    main()
