# core/registry/provider_registry.py
"""
ProviderRegistry — Pluggable Interface Registry.
Allows application modules (accounting, users, access_control) to register
service providers into the core kernel at startup, eliminating inverted/circular imports.
"""

from typing import Any, Protocol


class ICurrencyProvider(Protocol):
    """Protocol for resolving tenant base currencies and currency records."""

    def get_base_currency(self, company_id: Any) -> Any | None: ...
    def get_currency_by_code(self, code: str) -> Any | None: ...


class IAuthenticationProvider(Protocol):
    """Protocol for core views needing authentication services."""

    def authenticate_user(self, request: Any, **kwargs) -> Any | None: ...


class IAccessControlProvider(Protocol):
    """Protocol for checking entity access control scopes."""

    def has_entity_access(self, user: Any, content_type_or_model: Any, object_id: str) -> bool: ...
    def get_allowed_object_ids(self, user: Any, model: Any) -> list[str]: ...


class ProviderRegistry:
    """
    Central registry for decoupling core from specific application modules.
    """

    _currency_provider: ICurrencyProvider | None = None
    _auth_provider: IAuthenticationProvider | None = None
    _acl_provider: IAccessControlProvider | None = None

    @classmethod
    def register_currency_provider(cls, provider: ICurrencyProvider) -> None:
        cls._currency_provider = provider

    @classmethod
    def get_currency_provider(cls) -> ICurrencyProvider | None:
        return cls._currency_provider

    @classmethod
    def register_auth_provider(cls, provider: IAuthenticationProvider) -> None:
        cls._auth_provider = provider

    @classmethod
    def get_auth_provider(cls) -> IAuthenticationProvider | None:
        return cls._auth_provider

    @classmethod
    def register_acl_provider(cls, provider: IAccessControlProvider) -> None:
        cls._acl_provider = provider

    @classmethod
    def get_acl_provider(cls) -> IAccessControlProvider | None:
        return cls._acl_provider
