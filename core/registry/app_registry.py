from __future__ import annotations

import os
import importlib
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class AppRegistry:
    """Central registry for Django app discovery and lifecycle.

    Replaces the module-level ``auto_discovery_apps()`` function with a
    testable, inspectable class that can also serve as a single source of
    truth for app metadata (e.g. which YAML module a Django app belongs to).
    """

    _apps: dict[str, Any] = {}       # app_label → module path
    _modules: dict[str, str] = {}    # YAML module key → Django app label

    # ------------------------------------------------------------------
    # Discovery
    # ------------------------------------------------------------------

    @classmethod
    def discover(cls, exclude: list[str] | None = None) -> list[str]:
        """Scan *apps/* and *core/* directories for Django apps.

        Returns a list of dotted paths suitable for ``INSTALLED_APPS``.
        """
        if exclude is None:
            exclude = [
                "__pycache__", "venv", "env", "static", "templates",
                "media", "tests", "common", "config", "migrations",
                "backend", "apps",
            ]

        apps: list[str] = []
        project_root = BASE_DIR

        for base_folder in ("apps", "core"):
            scan_dir = project_root / base_folder
            if not scan_dir.exists():
                continue
            for entry in sorted(scan_dir.iterdir()):
                if not entry.is_dir() or entry.name.startswith(".") or entry.name == "__pycache__":
                    continue
                if (entry / ".disable").exists():
                    continue

                dotted = f"{base_folder}.{entry.name}"
                if (entry / "__init__.py").exists() and (entry / "apps.py").exists():
                    try:
                        importlib.import_module(f"{dotted}.apps")
                        apps.append(dotted)
                        cls._apps[entry.name] = dotted
                    except ImportError:
                        pass
        return apps

    # ------------------------------------------------------------------
    # Module ↔ App mapping (for YAML-based module definitions)
    # ------------------------------------------------------------------

    @classmethod
    def register_module(cls, module_key: str, app_label: str) -> None:
        """Associate a YAML module key (e.g. ``hrms:employee``) with a Django app."""
        cls._modules[module_key] = app_label

    @classmethod
    def app_for_module(cls, module_key: str) -> str | None:
        """Return the Django app label registered for *module_key*, if any."""
        return cls._modules.get(module_key)

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    @classmethod
    def all_apps(cls) -> dict[str, str]:
        """Return ``{app_label: dotted_path}`` for all discovered apps."""
        return dict(cls._apps)

    @classmethod
    def get_path(cls, label: str) -> str | None:
        """Return dotted path for an app *label* (e.g. ``users`` → ``apps.users``)."""
        return cls._apps.get(label)


__all__ = [
    "AppRegistry",
]
