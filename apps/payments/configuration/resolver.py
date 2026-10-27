# apps/payments/configuration/resolver.py
"""
Authoritative payment gateway configuration resolver.
Implements the 4-state lifecycle machine:
- DISABLED: Domain record exists with is_active=False -> Raises GatewayDisabledError (Never falls back)
- ACTIVE: Domain record exists with is_active=True -> Validates schema; raises GatewayConfigurationError if incomplete (Never falls back)
- NOT_CONFIGURED: No domain record exists -> Fallback to SystemConfig and Django settings / os.environ
- INVALID: Schema or formatting error -> Raises GatewayConfigurationError
"""

import logging

from apps.payments.configuration.exceptions import (
    GatewayDisabledError,
    GatewayNotConfiguredError,
)
from apps.payments.configuration.schemas import (
    PayPalConfigSchema,
    RazorpayConfigSchema,
    ResolvedPaymentGatewayConfig,
)
from core.configuration.resolver import CoreConfigurationResolver

logger = logging.getLogger(__name__)


class PaymentGatewayConfigResolver:
    """
    Resolves payment gateway configuration according to authoritative precedence rules.
    """

    @classmethod
    def resolve_gateway(
        cls,
        gateway_type: str,
        tenant_id: str | None = None,
    ) -> ResolvedPaymentGatewayConfig:
        """
        Resolves gateway configuration for the given gateway_type and optional tenant_id.
        """
        gateway_clean = gateway_type.strip().upper()

        # Step 1: Check Domain DB (PaymentGatewayConfig)
        domain_config = cls._find_domain_config(gateway_clean, tenant_id=tenant_id)

        if domain_config is not None:
            # 1. State DISABLED: MUST NEVER FALL BACK
            if not domain_config.is_active:
                logger.warning(
                    f"Payment gateway '{gateway_clean}' is explicitly disabled in PaymentGatewayConfig."
                )
                raise GatewayDisabledError(
                    f"Payment gateway '{gateway_clean}' is disabled by platform administrators."
                )

            # 2. State ACTIVE: Validate and build profile (Never falls back if invalid)
            return cls._build_from_domain_config(domain_config)

        # Step 2: State NOT_CONFIGURED in domain model -> Fallback to SystemConfig / settings / env
        return cls._resolve_legacy_fallback(gateway_clean)

    @classmethod
    def _find_domain_config(cls, gateway_clean: str, tenant_id: str | None = None):
        """
        Queries the database for PaymentGatewayConfig.
        Tenant-ready parameter is accepted for future multi-tenant routing.
        """
        try:
            from apps.payments.models import PaymentGatewayConfig

            # If tenant_id is used in the future, filter by tenant here.
            return PaymentGatewayConfig.objects.filter(gateway_type=gateway_clean).first()
        except Exception as exc:
            logger.debug(f"PaymentGatewayConfig query skipped: {exc}")
            return None

    @classmethod
    def _build_from_domain_config(cls, domain_config) -> ResolvedPaymentGatewayConfig:
        """
        Builds ResolvedPaymentGatewayConfig from a valid, active PaymentGatewayConfig domain record.
        Strictly enforces schema validation.
        """
        gateway_type = domain_config.gateway_type.upper()
        currencies = tuple(domain_config.supported_currencies or ["INR", "USD"])
        extra = domain_config.extra_config or {}

        if gateway_type == "RAZORPAY":
            key_id, key_secret = RazorpayConfigSchema.validate_and_extract(
                extra_config=extra,
                merchant_id=domain_config.merchant_id,
            )
            return ResolvedPaymentGatewayConfig(
                gateway_type=gateway_type,
                is_active=True,
                is_sandbox=domain_config.is_sandbox,
                merchant_id=domain_config.merchant_id,
                api_key=key_id,
                api_secret=key_secret,
                supported_currencies=currencies,
                source="DOMAIN_DB",
                extra=extra,
            )

        elif gateway_type == "PAYPAL":
            client_id, client_secret, is_sandbox = PayPalConfigSchema.validate_and_extract(
                extra_config=extra,
                merchant_id=domain_config.merchant_id,
                is_sandbox_default=domain_config.is_sandbox,
            )
            return ResolvedPaymentGatewayConfig(
                gateway_type=gateway_type,
                is_active=True,
                is_sandbox=is_sandbox,
                merchant_id=domain_config.merchant_id,
                api_key=client_id,
                api_secret=client_secret,
                supported_currencies=currencies,
                source="DOMAIN_DB",
                extra=extra,
            )

        elif gateway_type == "COD":
            return ResolvedPaymentGatewayConfig(
                gateway_type="COD",
                is_active=True,
                is_sandbox=False,
                merchant_id=None,
                api_key="",
                api_secret="",
                supported_currencies=currencies,
                source="DOMAIN_DB",
                extra=extra,
            )

        else:
            # Generic gateway provider
            api_key = extra.get("api_key") or domain_config.merchant_id or ""
            api_secret = extra.get("api_secret") or ""
            return ResolvedPaymentGatewayConfig(
                gateway_type=gateway_type,
                is_active=True,
                is_sandbox=domain_config.is_sandbox,
                merchant_id=domain_config.merchant_id,
                api_key=api_key,
                api_secret=api_secret,
                supported_currencies=currencies,
                source="DOMAIN_DB",
                extra=extra,
            )

    @classmethod
    def _resolve_legacy_fallback(cls, gateway_clean: str) -> ResolvedPaymentGatewayConfig:
        """
        Resolves credentials from SystemConfig or settings/environment when no domain model exists.
        """
        from core.base_models.system_models import SystemConfig

        if gateway_clean == "RAZORPAY":
            key_id = CoreConfigurationResolver.get("RAZORPAY_KEY_ID")
            key_secret = CoreConfigurationResolver.get("RAZORPAY_KEY_SECRET")

            if not key_id or not key_secret:
                raise GatewayNotConfiguredError(
                    f"Payment gateway '{gateway_clean}' is not configured in database or environment."
                )

            # Determine whether source was SystemConfig or settings/env
            try:
                db_key = SystemConfig.load_val("RAZORPAY_KEY_ID")
                source = "SYSTEM_DB" if db_key else "SETTINGS_ENV"
            except Exception:
                source = "SETTINGS_ENV"

            return ResolvedPaymentGatewayConfig(
                gateway_type="RAZORPAY",
                is_active=True,
                is_sandbox=True,
                merchant_id=None,
                api_key=str(key_id).strip(),
                api_secret=str(key_secret).strip(),
                supported_currencies=("INR", "USD"),
                source=source,
                extra={},
            )

        elif gateway_clean == "PAYPAL":
            client_id = CoreConfigurationResolver.get("PAYPAL_CLIENT_ID")
            client_secret = CoreConfigurationResolver.get("PAYPAL_CLIENT_SECRET")
            mode = CoreConfigurationResolver.get("PAYPAL_MODE", default="sandbox")

            if not client_id or not client_secret:
                raise GatewayNotConfiguredError(
                    f"Payment gateway '{gateway_clean}' is not configured in database or environment."
                )

            try:
                db_client = SystemConfig.load_val("PAYPAL_CLIENT_ID")
                source = "SYSTEM_DB" if db_client else "SETTINGS_ENV"
            except Exception:
                source = "SETTINGS_ENV"

            return ResolvedPaymentGatewayConfig(
                gateway_type="PAYPAL",
                is_active=True,
                is_sandbox=(str(mode).strip().lower() == "sandbox"),
                merchant_id=None,
                api_key=str(client_id).strip(),
                api_secret=str(client_secret).strip(),
                supported_currencies=("USD", "EUR"),
                source=source,
                extra={"mode": mode},
            )

        elif gateway_clean == "COD":
            return ResolvedPaymentGatewayConfig(
                gateway_type="COD",
                is_active=True,
                is_sandbox=False,
                merchant_id=None,
                api_key="",
                api_secret="",
                supported_currencies=("INR", "USD"),
                source="DEFAULT",
                extra={},
            )

        raise GatewayNotConfiguredError(
            f"Payment gateway '{gateway_clean}' is not supported or configured."
        )
