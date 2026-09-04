from enum import StrEnum
from typing import Any
import logging

from shared_domain.base.valuesets import ValueSet, ValueSetItem, ValueSetRegistry

logger = logging.getLogger(__name__)


class DomainVariableRegistry:
    """
    App-Scoped Variable Registry preventing key collision across distinct domain modules.
    Each app (accounting, procurement_pos, shop, etc.) registers its own namespaced enum.
    """
    _app_registries: dict[str, type[StrEnum]] = {}

    @classmethod
    def register_app_variables(cls, domain: str, enum_cls: type[StrEnum]) -> ValueSet:
        """
        Registers an app's VariableKey enum under its specific domain namespace.
        """
        cls._app_registries[domain] = enum_cls

        items = []
        for member in enum_cls:
            code_val = str(member.value)
            human_label = member.name.replace("_", " ").title()
            items.append(ValueSetItem(code=code_val, label=human_label))

        valueset = ValueSet(
            name=f"{domain}_variable_registry",
            domain=domain,
            items=items,
        )
        ValueSetRegistry.register(valueset)
        logger.debug(f"[DomainVariableRegistry] Registered domain '{domain}' with {len(items)} variables.")
        return valueset

    @classmethod
    def get_app_variables(cls, domain: str) -> list[dict[str, str]]:
        """
        Returns all registered variables for a given app domain.
        """
        vs = ValueSetRegistry.get(f"{domain}_variable_registry")
        if not vs:
            return []
        return [{"code": item.code, "label": str(item.label)} for item in vs.items]

    @classmethod
    def is_valid_key(cls, domain: str, key: str) -> bool:
        """
        Validates if a key is registered within a specific app domain.
        """
        vs = ValueSetRegistry.get(f"{domain}_variable_registry")
        if not vs:
            return False
        return any(item.code == key for item in vs.items)

    @classmethod
    def get_label(cls, domain: str, key: str) -> str:
        """
        Resolves human-readable display label for a key in a given domain namespace.
        """
        vs = ValueSetRegistry.get(f"{domain}_variable_registry")
        if vs:
            for item in vs.items:
                if item.code == key:
                    return str(item.label)
        return key
