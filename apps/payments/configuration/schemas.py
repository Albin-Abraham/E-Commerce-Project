# apps/payments/configuration/schemas.py
"""
Data schemas and immutable profiles for resolved payment gateway configurations.
"""

from dataclasses import dataclass, field
from typing import Any

from apps.payments.configuration.exceptions import GatewayConfigurationError
from core.configuration.security.redaction import mask_secret


@dataclass(frozen=True)
class ResolvedPaymentGatewayConfig:
    """
    Immutable resolved configuration profile for a payment gateway.
    Passed directly to adapters to avoid ad-hoc database lookups.
    """

    gateway_type: str
    is_active: bool
    is_sandbox: bool
    merchant_id: str | None
    api_key: str
    api_secret: str
    supported_currencies: tuple[str, ...] = field(default_factory=tuple)
    source: str = "DOMAIN_DB"  # DOMAIN_DB, SYSTEM_DB, SETTINGS_ENV, DEFAULT
    extra: dict[str, Any] = field(default_factory=dict)

    def is_currency_supported(self, currency: str) -> bool:
        if not self.supported_currencies:
            return True
        return currency.upper() in [c.upper() for c in self.supported_currencies]

    def __repr__(self) -> str:
        masked_key = mask_secret(self.api_key)
        masked_secret = mask_secret(self.api_secret)
        return (
            f"ResolvedPaymentGatewayConfig(gateway_type='{self.gateway_type}', "
            f"is_active={self.is_active}, is_sandbox={self.is_sandbox}, "
            f"merchant_id='{self.merchant_id}', api_key='{masked_key}', "
            f"api_secret='{masked_secret}', source='{self.source}', "
            f"currencies={list(self.supported_currencies)})"
        )

    def __str__(self) -> str:
        return self.__repr__()


class RazorpayConfigSchema:
    """Validates and extracts Razorpay credentials."""

    @classmethod
    def validate_and_extract(
        cls,
        extra_config: dict[str, Any],
        merchant_id: str | None = None,
    ) -> tuple[str, str]:
        extra = extra_config or {}
        key_id = extra.get("key_id") or merchant_id
        key_secret = extra.get("key_secret")

        if not key_id or not str(key_id).strip():
            raise GatewayConfigurationError(
                "Razorpay configuration is invalid: 'key_id' (or merchant_id) is missing."
            )
        if not key_secret or not str(key_secret).strip():
            raise GatewayConfigurationError(
                "Razorpay configuration is invalid: 'key_secret' is missing in extra_config."
            )

        return str(key_id).strip(), str(key_secret).strip()


class PayPalConfigSchema:
    """Validates and extracts PayPal credentials and mode."""

    @classmethod
    def validate_and_extract(
        cls,
        extra_config: dict[str, Any],
        merchant_id: str | None = None,
        is_sandbox_default: bool = True,
    ) -> tuple[str, str, bool]:
        extra = extra_config or {}
        client_id = extra.get("client_id") or merchant_id
        client_secret = extra.get("client_secret")

        mode = extra.get("mode")
        if mode:
            is_sandbox = str(mode).strip().lower() == "sandbox"
        else:
            is_sandbox = is_sandbox_default

        if not client_id or not str(client_id).strip():
            raise GatewayConfigurationError(
                "PayPal configuration is invalid: 'client_id' (or merchant_id) is missing."
            )
        if not client_secret or not str(client_secret).strip():
            raise GatewayConfigurationError(
                "PayPal configuration is invalid: 'client_secret' is missing in extra_config."
            )

        return str(client_id).strip(), str(client_secret).strip(), is_sandbox
