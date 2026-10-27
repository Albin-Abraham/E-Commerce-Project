# core/configuration/resolver.py
"""
Hierarchical configuration resolver.
Order of Precedence:
1. SystemConfig model (Database runtime config)
2. Django settings (Application deployment settings)
3. os.environ (Container / Process environment)
"""

import json
import logging
import os
from collections.abc import Callable
from typing import Any

from django.conf import settings

from .exceptions import InvalidConfigurationError, MissingConfigurationError

logger = logging.getLogger(__name__)


class CoreConfigurationResolver:
    """
    Centralized configuration resolver supporting fallback chains across
    database SystemConfig, Django settings, and OS environment variables.
    """

    @classmethod
    def get(
        cls,
        key: str,
        default: Any = None,
        required: bool = False,
        cast: Callable[[Any], Any] | None = None,
    ) -> Any:
        """
        Resolves a single configuration value by key.
        Precedence:
          1. SystemConfig (DB)
          2. settings.<KEY>
          3. os.environ[<KEY>]
        """
        val = None

        # 1. SystemConfig (DB)
        try:
            from core.base_models.system_models import SystemConfig

            db_val = SystemConfig.load_val(key)
            if db_val is not None and db_val != "":
                val = db_val
        except Exception as exc:
            logger.debug(f"SystemConfig lookup skipped for '{key}': {exc}")

        # 2. Django settings
        if val is None and hasattr(settings, key):
            setting_val = getattr(settings, key)
            if setting_val is not None:
                val = setting_val

        # 3. Environment variables
        if val is None:
            env_val = os.environ.get(key)
            if env_val is not None:
                val = env_val

        # Check required
        if val is None:
            if required:
                raise MissingConfigurationError(
                    f"Configuration parameter '{key}' is required but not configured in SystemConfig, settings, or environment."
                )
            return default

        # Apply cast if specified
        if cast is not None:
            try:
                return cast(val)
            except Exception as exc:
                raise InvalidConfigurationError(
                    f"Configuration parameter '{key}' with value '{val}' could not be converted: {exc}"
                )

        return val

    @classmethod
    def get_bool(cls, key: str, default: bool = False, required: bool = False) -> bool:
        """
        Resolves a boolean configuration parameter.
        Supports standard truthy representations ('true', '1', 'yes', 't', True).
        """
        val = cls.get(key, default=None, required=required)
        if val is None:
            return default
        if isinstance(val, bool):
            return val
        return str(val).strip().lower() in ("true", "1", "yes", "t", "enabled")

    @classmethod
    def get_int(cls, key: str, default: int | None = None, required: bool = False) -> int | None:
        """
        Resolves an integer configuration parameter.
        """
        val = cls.get(key, default=None, required=required)
        if val is None:
            return default
        try:
            return int(val)
        except (ValueError, TypeError) as exc:
            raise InvalidConfigurationError(
                f"Configuration parameter '{key}' with value '{val}' is not a valid integer: {exc}"
            )

    @classmethod
    def get_json(cls, key: str, default: Any = None, required: bool = False) -> Any:
        """
        Resolves a JSON-structured configuration parameter (dict or list).
        Can be stored as serialized JSON string or already parsed dict.
        """
        val = cls.get(key, default=None, required=required)
        if val is None:
            return default
        if isinstance(val, (dict, list)):
            return val
        try:
            return json.loads(val)
        except Exception as exc:
            raise InvalidConfigurationError(
                f"Configuration parameter '{key}' contains invalid JSON: {exc}"
            )
