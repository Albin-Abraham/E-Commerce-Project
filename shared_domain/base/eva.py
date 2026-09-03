# shared_domain/base/eva.py
"""
EVA — Extensible Value Attributes.

The unified carrier for an entity's:
  - Lifecycle state (current state in the transition graph)
  - State context  (who/when/why/which-operation caused the transition)
  - Version        (monotonically increasing)
  - Attributes     (domain-specific extensible data validated by ValueSets)
"""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from datetime import UTC, datetime
from typing import Any


@dataclass(frozen=True)
class StateContext:
    """
    Records the full context of a lifecycle transition.
    """

    triggered_by: str
    triggered_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    operation: str = "unknown"
    reason: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "triggered_by": self.triggered_by,
            "triggered_at": self.triggered_at.isoformat(),
            "operation": self.operation,
            "reason": self.reason,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> StateContext:
        triggered_at = data.get("triggered_at")
        if isinstance(triggered_at, str):
            triggered_at = datetime.fromisoformat(triggered_at)
        return cls(
            triggered_by=data["triggered_by"],
            triggered_at=triggered_at or datetime.now(UTC),
            operation=data.get("operation", "unknown"),
            reason=data.get("reason"),
        )

    @classmethod
    def system(cls, operation: str = "system", reason: str | None = None) -> StateContext:
        return cls(triggered_by="system", operation=operation, reason=reason)


@dataclass(frozen=True)
class EVA:
    """
    Extensible Value Attributes — immutable lifecycle + attribute carrier.
    """

    version: int
    state: str
    state_context: StateContext
    attributes: dict[str, Any] = field(default_factory=dict)

    def transition_to(self, new_state: str, context: StateContext) -> EVA:
        return EVA(
            version=self.version + 1,
            state=new_state,
            state_context=context,
            attributes=self.attributes,
        )

    def with_attribute(self, key: str, value: Any) -> EVA:
        return replace(self, attributes={**self.attributes, key: value})

    def with_attributes(self, updates: dict[str, Any]) -> EVA:
        return replace(self, attributes={**self.attributes, **updates})

    def without_attribute(self, key: str) -> EVA:
        return replace(self, attributes={k: v for k, v in self.attributes.items() if k != key})

    def get(self, key: str, default: Any = None) -> Any:
        return self.attributes.get(key, default)

    def to_dict(self) -> dict[str, Any]:
        return {
            "version": self.version,
            "state": self.state,
            "state_context": self.state_context.to_dict(),
            "attributes": self.attributes,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> EVA:
        return cls(
            version=data["version"],
            state=data["state"],
            state_context=StateContext.from_dict(data["state_context"]),
            attributes=data.get("attributes", {}),
        )

    @classmethod
    def initial(
        cls,
        state: str,
        context: StateContext,
        attributes: dict[str, Any] | None = None,
    ) -> EVA:
        return cls(
            version=1,
            state=state,
            state_context=context,
            attributes=attributes or {},
        )

    def __repr__(self) -> str:  # pragma: no cover
        return f"EVA(v{self.version}, state={self.state!r}, attrs={list(self.attributes.keys())})"
