# core/authorization/registries.py
from typing import ClassVar

from core.authorization.base import BasePolicy


class PolicyRegistry:
    """
    Inversion-of-Control Policy Registry.
    Enables domain applications to register their resource-specific policies during Django ready().
    Ensures core never needs to import domain modules directly.
    """

    _registry: ClassVar[dict[tuple[str, str], type[BasePolicy]]] = {}
    _fallback_registry: ClassVar[dict[str, type[BasePolicy]]] = {}

    @classmethod
    def register(
        cls,
        resource_type: str,
        persona: str | None,
        policy_class: type[BasePolicy],
    ) -> None:
        """Registers a policy class for a resource_type and optional persona."""
        res_key = resource_type.strip().lower()
        if persona:
            cls._registry[(res_key, persona.strip().upper())] = policy_class
        else:
            cls._fallback_registry[res_key] = policy_class

    @classmethod
    def resolve(cls, resource_type: str, persona: str) -> BasePolicy | None:
        """Resolves the best matching policy instance for the resource and caller persona."""
        res_key = resource_type.strip().lower()
        persona_key = persona.strip().upper()

        policy_cls = cls._registry.get((res_key, persona_key))
        if not policy_cls:
            policy_cls = cls._fallback_registry.get(res_key)

        return policy_cls() if policy_cls else None

    @classmethod
    def clear(cls) -> None:
        """Clears the registry (useful for test isolation)."""
        cls._registry.clear()
        cls._fallback_registry.clear()
