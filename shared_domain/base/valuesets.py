# shared_domain/base/valuesets.py
"""
ValueSet — typed, validated enumeration of allowed values.
"""

from __future__ import annotations

from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Any

from shared_domain.validation.exceptions import DomainValidationError


@dataclass(frozen=True)
class ValueSetItem:
    code: str
    label: str
    description: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    is_active: bool = True

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.code} ({self.label})"


class ValueSet:
    def __init__(
        self,
        name: str,
        domain: str,
        items: list[ValueSetItem],
        is_extensible: bool = False,
        description: str | None = None,
    ):
        self.name = name
        self.domain = domain
        self.description = description
        self.is_extensible = is_extensible

        self._items: dict[str, ValueSetItem] = {item.code: item for item in items}
        if len(self._items) != len(items):
            codes = [item.code for item in items]
            seen = set()
            dupes = [c for c in codes if c in seen or seen.add(c)]
            raise ValueError(f"ValueSet '{name}' contains duplicate codes: {dupes}")

    def get(self, code: str) -> ValueSetItem | None:
        return self._items.get(code)

    def validate(self, code: str) -> ValueSetItem:
        item = self._items.get(code)
        if item is None:
            valid = [c for c, i in self._items.items() if i.is_active]
            raise DomainValidationError(
                f"'{code}' is not a valid value for '{self.name}'.",
                errors={
                    "field": self.name,
                    "code": "invalid_value",
                    "received": code,
                    "valid_values": valid,
                },
            )
        if not item.is_active:
            raise DomainValidationError(
                f"'{code}' is no longer an active value for '{self.name}'.",
                errors={"field": self.name, "code": "inactive_value", "received": code},
            )
        return item

    def validate_many(self, codes: list[str]) -> list[ValueSetItem]:
        return [self.validate(code) for code in codes]

    def is_valid(self, code: str) -> bool:
        item = self._items.get(code)
        return item is not None and item.is_active

    def active_items(self) -> list[ValueSetItem]:
        return [i for i in self._items.values() if i.is_active]

    def codes(self) -> list[str]:
        return [i.code for i in self.active_items()]

    def extend(self, *new_items: ValueSetItem) -> None:
        if not self.is_extensible:
            raise TypeError(
                f"ValueSet '{self.name}' is not extensible. Create a new static item instead."
            )
        for item in new_items:
            self._items[item.code] = item

    def deactivate(self, code: str) -> None:
        if not self.is_extensible:
            raise TypeError(f"ValueSet '{self.name}' is not extensible.")
        item = self._items.get(code)
        if item:
            self._items[code] = ValueSetItem(
                code=item.code,
                label=item.label,
                description=item.description,
                metadata=item.metadata,
                is_active=False,
            )

    def as_django_choices(self) -> list[tuple[str, str]]:
        return [(i.code, i.label) for i in self.active_items()]

    def __iter__(self) -> Iterator[ValueSetItem]:
        return iter(self._items.values())

    def __contains__(self, code: str) -> bool:
        return self.is_valid(code)

    def __repr__(self) -> str:  # pragma: no cover
        return f"ValueSet(name={self.name!r}, domain={self.domain!r}, items={len(self._items)})"


class EVAAttributeSchema:
    def __init__(
        self,
        state_attributes: dict[str, dict[str, ValueSet | None]],
        required_on_transition: dict[str, list[str]] | None = None,
    ):
        self._state_attributes = state_attributes
        self._required = required_on_transition or {}

    def allowed_keys(self, state: str) -> set[str]:
        return set(self._state_attributes.get(state, {}).keys())

    def governing_valueset(self, state: str, key: str) -> ValueSet | None:
        return self._state_attributes.get(state, {}).get(key)

    def validate_attributes(
        self,
        state: str,
        attributes: dict[str, Any],
        strict: bool = True,
    ) -> None:
        schema = self._state_attributes.get(state, {})
        errors: dict[str, str] = {}

        for key, value in attributes.items():
            if key not in schema:
                if strict:
                    errors[key] = f"Attribute '{key}' is not allowed in state '{state}'."
                continue

            valueset = schema[key]
            if valueset is not None and value is not None:
                try:
                    valueset.validate(str(value))
                except DomainValidationError as exc:
                    errors[key] = str(exc)

        if errors:
            raise DomainValidationError(
                "EVA attribute validation failed.",
                errors=errors,
            )

    def validate_required_on_transition(
        self, target_state: str, attributes: dict[str, Any]
    ) -> None:
        required_keys = self._required.get(target_state, [])
        missing = [k for k in required_keys if not attributes.get(k)]
        if missing:
            raise DomainValidationError(
                f"Missing required attributes for transition to '{target_state}'.",
                errors=dict.fromkeys(missing, f"Required when entering state '{target_state}'."),
            )


class ValueSetRegistry:
    _registry: dict[str, ValueSet] = {}

    @classmethod
    def register(cls, valueset: ValueSet) -> None:
        if valueset.name in cls._registry and not cls._registry[valueset.name].is_extensible:
            raise ValueError(
                f"ValueSet '{valueset.name}' is already registered and is not extensible."
            )
        cls._registry[valueset.name] = valueset

    @classmethod
    def get(cls, name: str) -> ValueSet:
        vs = cls._registry.get(name)
        if vs is None:
            raise KeyError(
                f"ValueSet '{name}' is not registered. Available sets: {list(cls._registry.keys())}"
            )
        return vs

    @classmethod
    def validate(cls, valueset_name: str, code: str) -> ValueSetItem:
        return cls.get(valueset_name).validate(code)

    @classmethod
    def is_registered(cls, name: str) -> bool:
        return name in cls._registry

    @classmethod
    def all(cls) -> dict[str, ValueSet]:
        return dict(cls._registry)

    @classmethod
    def clear(cls) -> None:
        cls._registry.clear()
