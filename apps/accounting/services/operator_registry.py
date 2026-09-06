"""
Operator registry for discount conditions.

Each operator is a registry entry linking an operator code to a comparator
object (callable) and its operand contract. Conditions declare the operator as
a code; the linkage to the comparator is resolved here, giving a single source
of truth for equality / range semantics and validating which operands the
operator consumes (value 1, value 2, or equal-to value).
"""

from __future__ import annotations

from decimal import Decimal, InvalidOperation

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from apps.accounting.valuesets import DISCOUNT_OPERATOR_VALUESET

BETWEEN = "BETWEEN"
EQUAL_TO = "EQUAL_TO"
NOT_EQUAL_TO = "NOT_EQUAL_TO"
GREATER_THAN = "GREATER_THAN"
LESS_THAN = "LESS_THAN"
GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL"
LESS_THAN_OR_EQUAL = "LESS_THAN_OR_EQUAL"


def _as_decimal(value):
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def _equal_comparator(raw, value, value_to):
    return str(raw) == str(value)


def _not_equal_comparator(raw, value, value_to):
    return str(raw) != str(value)


def _numeric_range_comparator(compare):
    def comparator(raw, value, value_to):
        num = _as_decimal(raw)
        num_value = _as_decimal(value)
        if num is None or num_value is None:
            return False
        return compare(num, num_value)

    return comparator


def _between_comparator(raw, value, value_to):
    num = _as_decimal(raw)
    num_value = _as_decimal(value)
    num_value_to = _as_decimal(value_to)
    if num is None or num_value is None or num_value_to is None:
        return False
    return num_value < num < num_value_to


class OperatorRegistry:
    """
    Centralized registry mapping discount operator codes to their comparator
    objects. Mirror of the NumberSeriesRegistry idiom so new operators can be
    registered modularly across the system.
    """

    _registry: dict[str, dict] = {}

    @classmethod
    def register(cls, code, label, comparator, statement="", args=None):
        """
        Registers (or overrides) an operator code with its comparator object.

        ``comparator`` has the signature ``(raw, value, value_to) -> bool`` and
        ``args`` documents which linkage objects the operator consumes.
        """
        cls._registry[code] = {
            "label": label,
            "comparator": comparator,
            "statement": statement,
            "args": args or ("value",),
        }
        return code

    @classmethod
    def resolve(cls, code) -> dict | None:
        """Returns the operator registry entry, or None for unknown codes."""
        entry = cls._registry.get(code)
        if entry is not None:
            return dict(entry)
        return None

    @classmethod
    def comparator(cls, code):
        entry = cls._registry.get(code)
        return entry["comparator"] if entry else None

    @classmethod
    def enabled_operators(cls) -> set[str]:
        return set(cls._registry)

    @classmethod
    def validate_operator(cls, code):
        """Raises a ValidationError when the operator is not registered."""
        if code not in cls._registry:
            raise ValidationError(f"Unknown discount operator '{code}'")

    @classmethod
    def validate_operands(cls, code, value, value_to):
        """
        Validates the operator's linkage objects:
        * EQUAL_TO / NOT_EQUAL_TO consume a single equal-to ``value``.
        * BETWEEN consumes both ``value`` (value 1) and ``value_to`` (value 2).
        * GREATER_THAN / LESS_THAN / OR_EQUAL variants consume ``value``.
        """
        entry = cls._registry[code]
        args = entry["args"]

        if "value_to" in args and not value_to:
            raise ValidationError(
                f"Operator '{code}' links value 1 ({value!r}) to value 2; "
                "'value_to' is required"
            )
        if "value" in args and not value:
            raise ValidationError(
                f"Operator '{code}' requires an equal-to/range value"
            )
        return True


DEFAULT_OPERATORS = (
    (EQUAL_TO, _("Equal To"), _equal_comparator, "field equals the value", ("value",)),
    (NOT_EQUAL_TO, _("Not Equal To"), _not_equal_comparator, "field differs from the value", ("value",)),
    (GREATER_THAN, _("Greater Than"), _numeric_range_comparator(lambda a, b: a > b), "field is greater than the value", ("value",)),
    (LESS_THAN, _("Less Than"), _numeric_range_comparator(lambda a, b: a < b), "field is less than the value", ("value",)),
    (GREATER_THAN_OR_EQUAL, _("Greater Than Or Equal To"), _numeric_range_comparator(lambda a, b: a >= b), "field is at least the value", ("value",)),
    (LESS_THAN_OR_EQUAL, _("Less Than Or Equal To"), _numeric_range_comparator(lambda a, b: a <= b), "field is at most the value", ("value",)),
    (BETWEEN, _("Between Value 1 And Value 2"), _between_comparator, "value 1 < field < value 2", ("value", "value_to")),
)


def register_default_operators():
    if OperatorRegistry.enabled_operators():
        return
    for code, label, comparator, statement, args in DEFAULT_OPERATORS:
        OperatorRegistry.register(code, label, comparator, statement, args)


def synced_operator_choices() -> bool:
    """
    True when every valueset operator code has a registered comparator (test hook).
    """
    codes = {item.code for item in DISCOUNT_OPERATOR_VALUESET}
    return codes <= OperatorRegistry.enabled_operators()


register_default_operators()