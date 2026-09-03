# shared_domain/base/entity.py
"""
Entity — base class for all domain entities.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, ClassVar

from .eva import EVA, StateContext
from .lifecycle import LifecycleEngine


@dataclass
class Entity:
    id: str | None = None
    eva: EVA = field(default=None)  # type: ignore[assignment]
    lifecycle: ClassVar[LifecycleEngine]

    @classmethod
    def create(
        cls,
        context: StateContext,
        attributes: dict[str, Any] | None = None,
        **kwargs,
    ) -> Entity:
        lifecycle = cls._get_lifecycle()
        initial_eva = lifecycle.make_initial_eva(context, attributes)
        return cls(eva=initial_eva, **kwargs)

    def transition_to(
        self,
        target_state: str,
        context: StateContext,
        policies=None,
        attribute_updates: dict[str, Any] | None = None,
    ) -> None:
        lifecycle = self._get_lifecycle()
        self.eva = lifecycle.transition(
            eva=self.eva,
            target_state=target_state,
            context=context,
            policies=policies,
            attribute_updates=attribute_updates,
            subject=self,
        )

    @property
    def state(self) -> str:
        return self.eva.state

    @property
    def version(self) -> int:
        return self.eva.version

    def get_attr(self, key: str, default: Any = None) -> Any:
        return self.eva.get(key, default)

    def set_attr(self, key: str, value: Any) -> None:
        self.eva = self.eva.with_attribute(key, value)

    def set_attrs(self, updates: dict[str, Any]) -> None:
        self.eva = self.eva.with_attributes(updates)

    @classmethod
    def _get_lifecycle(cls) -> LifecycleEngine:
        lifecycle = getattr(cls, "lifecycle", None)
        if lifecycle is None or not isinstance(lifecycle, LifecycleEngine):
            raise NotImplementedError(
                f"Entity '{cls.__name__}' must declare a "
                f"'lifecycle: ClassVar[LifecycleEngine]' class variable."
            )
        return lifecycle

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Entity):
            return NotImplemented
        return self.id is not None and self.id == other.id

    def __hash__(self) -> int:
        return hash(self.id)

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"{self.__class__.__name__}("
            f"id={self.id!r}, "
            f"state={self.eva.state!r}, "
            f"version={self.eva.version})"
        )
