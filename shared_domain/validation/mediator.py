# shared_domain/validation/mediator.py
"""
PureValidationMediator — framework-agnostic domain validation engine.

Iterates over a field_name → [Rule, ...] mapping and applies each rule
to the corresponding value in a data dict or entity instance.

Collects ALL field errors before raising (not fail-fast) so the caller
receives a complete error map in one shot.
"""

from __future__ import annotations

from typing import Any

from .exceptions import DomainValidationError


class PureValidationMediator:
    """
    Framework-agnostic validation engine for pure Python domain objects.
    """

    def __init__(self, rules: dict[str, list[Any]]):
        self.rules = rules  # {field_name: [Rule, ...]}

    def validate(
        self,
        data: dict[str, Any],
        instance: Any = None,
        context: dict[str, Any] | None = None,
    ) -> tuple[dict[str, Any], Any]:
        context = context or {}
        trace: list[str] | None = [] if context.get("explain") else None
        context["_trace"] = trace

        errors: dict[str, Any] = {}

        for field_name, field_rules in self.rules.items():
            if field_name in data:
                value = data[field_name]
            elif instance is not None:
                value = getattr(instance, field_name, None)
            else:
                value = None

            for rule in field_rules:
                try:
                    rule.validate(field_name, value, context=context)
                    if trace is not None:
                        trace.append(f"✓ {field_name}: {rule.__class__.__name__} passed")
                except DomainValidationError as exc:
                    field_error = exc.errors.get(field_name, str(exc))
                    errors[field_name] = field_error
                    if trace is not None:
                        trace.append(f"✗ {field_name}: {rule.__class__.__name__} → {field_error}")
                    break

        if errors:
            raise DomainValidationError("Validation failed.", errors=errors)

        return data, instance
