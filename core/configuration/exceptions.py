# core/configuration/exceptions.py
"""
Base exception hierarchy for the configuration framework.
"""


class ConfigurationError(Exception):
    """Base exception for all configuration resolution errors."""

    pass


class MissingConfigurationError(ConfigurationError):
    """Raised when a required configuration key cannot be resolved from any source."""

    pass


class InvalidConfigurationError(ConfigurationError):
    """Raised when configuration values fail type, schema, or invariant validation."""

    pass
