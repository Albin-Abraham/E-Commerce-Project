# apps/payments/configuration/exceptions.py
"""
Exceptions raised during payment gateway configuration and credential resolution.
"""


class GatewayResolutionError(Exception):
    """Base exception for payment gateway resolution failures."""
    pass


class GatewayDisabledError(GatewayResolutionError):
    """
    Raised when a payment gateway exists in the database but is explicitly deactivated (is_active=False).
    According to security invariants, disabled gateways MUST NEVER fall back to legacy credentials.
    HTTP Mapping: 409 Conflict.
    """
    pass


class GatewayNotConfiguredError(GatewayResolutionError):
    """
    Raised when no configuration (domain, system, or environment) exists for the requested gateway.
    HTTP Mapping: 503 Service Unavailable.
    """
    pass


class GatewayConfigurationError(GatewayResolutionError):
    """
    Raised when gateway configuration exists but is incomplete, invalid, or schema-violating.
    HTTP Mapping: 503 Service Unavailable.
    """
    pass
