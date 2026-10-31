from __future__ import annotations

import os
from typing import Any

import yaml
from django.conf import settings
from django.db import transaction

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext, SeedStats
from core.base_models.seed_data.engine.resolver import DependencyResolver


class DomainRunner:
    """
    Coordinator and Transaction Engine for executing a domain seed suite.
    """

    domain_code: str = ""
    domain_name: str = ""

    def __init__(self, config_root: str | None = None):
        self.config_root = config_root or os.path.join(
            settings.BASE_DIR, "core", "base_models", "configs", "domains", self.domain_code
        )
        self.modules: list[BaseSeedModule] = []
        self.module_file_map: dict[str, str] = {}
        self.domain_config: dict[str, Any] = {}
        self.load_domain_config()

    def load_domain_config(self) -> None:
        domain_file = os.path.join(self.config_root, "domain.yaml")
        if os.path.exists(domain_file):
            with open(domain_file, encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
                self.domain_config = data.get("domain", {})
                self.domain_name = self.domain_config.get("name", self.domain_code)

    def register_module(self, module: BaseSeedModule, config_file: str | None = None) -> None:
        self.modules.append(module)
        if config_file:
            self.module_file_map[module.name] = config_file

    def load_module_data(self, module: BaseSeedModule) -> Any:
        config_file = self.module_file_map.get(module.name)
        if not config_file:
            return {}

        file_path = (
            config_file
            if os.path.isabs(config_file)
            else os.path.join(self.config_root, config_file)
        )
        if not os.path.exists(file_path):
            return {}

        with open(file_path, encoding="utf-8") as f:
            return yaml.safe_load(f) or {}

    def run(
        self,
        context: SeedContext,
        target_sections: list[str] | None = None,
        target_modules: list[str] | None = None,
    ) -> SeedStats:
        """
        Execute domain modules according to the resolved dependency DAG.
        Manages BYPASS_VALIDATION_GUARD, transactions, and dry-run rollbacks.
        """
        original_guard = getattr(settings, "BYPASS_VALIDATION_GUARD", False)
        setattr(settings, "BYPASS_VALIDATION_GUARD", True)

        try:
            # 1. Resolve DAG ordering
            ordered_modules = DependencyResolver.resolve(
                available_modules=self.modules,
                target_names=target_modules,
                target_sections=target_sections,
            )

            if not ordered_modules:
                context.write(f"No active modules found for domain '{self.domain_code}'.")
                return context.stats

            context.write(
                f"[{self.domain_name.upper()} SEED ENGINE] Scope: {context.scope.upper()} | "
                f"Planned modules ({len(ordered_modules)}): "
                f"{', '.join(m.name for m in ordered_modules)}"
            )

            # 2. If Validate-only, run schema & reference checks
            if context.validate_only:
                context.write("--- Running Configuration & Dependency Validation ---")
                total_errors = 0
                for module in ordered_modules:
                    raw_data = self.load_module_data(module)
                    errors = module.validate(context, raw_data)
                    if errors:
                        for err in errors:
                            context.write_error(f"[{module.name}] Validation Error: {err}")
                            total_errors += 1
                    else:
                        context.write(f"[{module.name}] OK (valid)")

                if total_errors == 0:
                    context.write("All module configurations are valid.")
                else:
                    context.write(f"Validation completed with {total_errors} error(s).")
                return context.stats

            # 3. Execution (Atomic Transaction)
            execution_mode = self.domain_config.get("execution", {}).get(
                "transaction_mode", "domain_atomic"
            )

            if context.dry_run or execution_mode == "domain_atomic":
                with transaction.atomic():
                    for module in ordered_modules:
                        raw_data = self.load_module_data(module)
                        context.write(f"Executing seed module: {module.name} ({module.section})...")
                        module.execute(context, raw_data)

                    if context.dry_run:
                        transaction.set_rollback(True)
                        context.write(
                            f"\n[DRY-RUN SIMULATION COMPLETE - ALL CHANGES ROLLED BACK]\n"
                            f"Would Create: {context.stats.created} | "
                            f"Would Update: {context.stats.updated} | "
                            f"Skipped: {context.stats.skipped} | "
                            f"Errors: {len(context.stats.errors)}"
                        )
                    else:
                        context.write(
                            f"\n[DOMAIN SEED COMPLETE]\n"
                            f"Created: {context.stats.created} | "
                            f"Updated: {context.stats.updated} | "
                            f"Skipped: {context.stats.skipped} | "
                            f"Errors: {len(context.stats.errors)}"
                        )
            else:
                for module in ordered_modules:
                    raw_data = self.load_module_data(module)
                    with transaction.atomic():
                        context.write(f"Executing seed module: {module.name} ({module.section})...")
                        module.execute(context, raw_data)

            return context.stats

        finally:
            setattr(settings, "BYPASS_VALIDATION_GUARD", original_guard)
