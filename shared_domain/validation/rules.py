# shared_domain/validation/rules.py
"""
Pure Python domain validation rules.

Each rule validates one aspect of a single field value.
Rules are attached to entities via _manual_rules or EVAAttributeSchema.

These are the DOMAIN rules — framework-agnostic.
Django serializer validators are a separate concern.
"""

from __future__ import annotations

import re
from abc import ABC, abstractmethod
from typing import Any

from .exceptions import DomainValidationError

# ---------------------------------------------------------------------------
# Base Rule
# ---------------------------------------------------------------------------


class Rule(ABC):
    """
    Base class for all domain validation rules.

    Subclass and implement validate().
    validate() should raise DomainValidationError on failure, return None on success.
    """

    error_code: str = "invalid"
    error_message: str = "This field is invalid."

    def __init__(self, field_name: str = "", message: str | None = None):
        self.field_name = field_name
        if message:
            self.error_message = message

    @abstractmethod
    def validate(self, field_name: str, value: Any, context: dict | None = None) -> None:
        """Raise DomainValidationError if the value fails this rule."""
        ...

    def _raise(self, field_name: str, message: str | None = None) -> None:
        raise DomainValidationError(
            message or self.error_message,
            errors={field_name: message or self.error_message, "code": self.error_code},
        )


# ---------------------------------------------------------------------------
# Concrete Rules
# ---------------------------------------------------------------------------


class RequiredRule(Rule):
    """Field must be present and non-empty."""

    error_code = "required"
    error_message = "This field is required."

    def validate(self, field_name: str, value: Any, context: dict | None = None) -> None:
        if value is None or value == "" or value == [] or value == {}:
            self._raise(field_name, f"'{field_name}' is required.")


class MinLengthRule(Rule):
    """String value must have at least *min_length* characters."""

    error_code = "min_length"

    def __init__(self, field_name: str = "", min_length: int = 1, message: str | None = None):
        super().__init__(field_name, message)
        self.min_length = min_length
        self.error_message = message or f"Must be at least {min_length} characters."

    def validate(self, field_name: str, value: Any, context: dict | None = None) -> None:
        if value is not None and isinstance(value, str) and len(value) < self.min_length:
            self._raise(
                field_name, f"'{field_name}' must be at least {self.min_length} characters."
            )


class MaxLengthRule(Rule):
    """String value must not exceed *max_length* characters."""

    error_code = "max_length"

    def __init__(self, field_name: str = "", max_length: int = 255, message: str | None = None):
        super().__init__(field_name, message)
        self.max_length = max_length
        self.error_message = message or f"Must be at most {max_length} characters."

    def validate(self, field_name: str, value: Any, context: dict | None = None) -> None:
        if value is not None and isinstance(value, str) and len(value) > self.max_length:
            self._raise(field_name, f"'{field_name}' must be at most {self.max_length} characters.")


class RegexRule(Rule):
    """Value must match the provided regular expression."""

    error_code = "invalid_format"

    def __init__(self, field_name: str = "", pattern: str = "", message: str | None = None):
        super().__init__(field_name, message)
        self.pattern = re.compile(pattern)
        self.error_message = message or f"'{field_name}' has an invalid format."

    def validate(self, field_name: str, value: Any, context: dict | None = None) -> None:
        if value is not None and not self.pattern.match(str(value)):
            self._raise(field_name)


class AllowedValuesRule(Rule):
    """Value must be one of the allowed choices."""

    error_code = "invalid_choice"

    def __init__(self, field_name: str = "", allowed: list[Any] = None, message: str | None = None):
        super().__init__(field_name, message)
        self.allowed = allowed or []
        self.error_message = message or f"Must be one of: {self.allowed}."

    def validate(self, field_name: str, value: Any, context: dict | None = None) -> None:
        if value is not None and value not in self.allowed:
            self._raise(
                field_name,
                f"'{value}' is not a valid choice for '{field_name}'. Allowed: {self.allowed}.",
            )


class ValueSetRule(Rule):
    """
    Value must be a valid code in the named ValueSet.
    Bridges pure-Python Rules with the ValueSetRegistry.
    """

    error_code = "invalid_valueset_code"

    def __init__(self, field_name: str = "", valueset_name: str = "", message: str | None = None):
        super().__init__(field_name, message)
        self.valueset_name = valueset_name

    def validate(self, field_name: str, value: Any, context: dict | None = None) -> None:
        if value is None:
            return
        from shared_domain.base.valuesets import ValueSetRegistry

        try:
            ValueSetRegistry.validate(self.valueset_name, str(value))
        except (DomainValidationError, KeyError) as exc:
            self._raise(field_name, str(exc))


class EmailRule(Rule):
    """Value must be a syntactically valid email address."""

    error_code = "invalid_email"
    _pattern = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

    def validate(self, field_name: str, value: Any, context: dict | None = None) -> None:
        if value is not None and not self._pattern.match(str(value)):
            self._raise(field_name, f"'{field_name}' must be a valid email address.")


class NumericRangeRule(Rule):
    """Numeric value must be within [min_val, max_val]."""

    error_code = "out_of_range"

    def __init__(
        self,
        field_name: str = "",
        min_val: float | None = None,
        max_val: float | None = None,
        message: str | None = None,
    ):
        super().__init__(field_name, message)
        self.min_val = min_val
        self.max_val = max_val

    def validate(self, field_name: str, value: Any, context: dict | None = None) -> None:
        if value is None:
            return
        try:
            num = float(value)
        except (TypeError, ValueError):
            self._raise(field_name, f"'{field_name}' must be a number.")
            return

        if self.min_val is not None and num < self.min_val:
            self._raise(field_name, f"'{field_name}' must be ≥ {self.min_val}.")
        if self.max_val is not None and num > self.max_val:
            self._raise(field_name, f"'{field_name}' must be ≤ {self.max_val}.")


class ConditionalRule(Rule):
    """
    Applies an inner rule only when a condition function returns True.
    """

    error_code = "conditional_validation_failed"

    def __init__(self, field_name: str = "", condition=None, inner_rule: Rule = None):
        super().__init__(field_name)
        self._condition = condition or (lambda data, ctx: True)
        self._inner = inner_rule

    def validate(self, field_name: str, value: Any, context: dict | None = None) -> None:
        context = context or {}
        if self._condition(value, context) and self._inner:
            self._inner.validate(field_name, value, context)
