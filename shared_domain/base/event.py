# shared_domain/base/event.py
"""
DomainEvent — signals that something happened in the domain.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, ClassVar
from uuid import uuid4


@dataclass(frozen=True)
class DomainEvent:
    event_id: str = field(default_factory=lambda: str(uuid4()))
    occurred_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    aggregate_id: str = ""
    aggregate_type: str = ""
    aggregate_version: int = 0

    event_name: ClassVar[str] = "domain.base.event"

    def to_dict(self) -> dict[str, Any]:
        return {
            "event_name": self.__class__.event_name,
            "event_id": self.event_id,
            "occurred_at": self.occurred_at.isoformat(),
            "aggregate_id": self.aggregate_id,
            "aggregate_type": self.aggregate_type,
            "aggregate_version": self.aggregate_version,
            **{
                k: v
                for k, v in self.__dict__.items()
                if k
                not in (
                    "event_id",
                    "occurred_at",
                    "aggregate_id",
                    "aggregate_type",
                    "aggregate_version",
                )
            },
        }


class IEventBus(ABC):
    @abstractmethod
    def publish(self, event: DomainEvent) -> None:
        ...

    @abstractmethod
    def publish_many(self, events: list[DomainEvent]) -> None:
        ...

    @abstractmethod
    def subscribe(self, event_name: str, handler: Callable[[DomainEvent], None]) -> None:
        ...


class NullEventBus(IEventBus):
    def __init__(self):
        self._published: list[DomainEvent] = []

    def publish(self, event: DomainEvent) -> None:
        self._published.append(event)

    def publish_many(self, events: list[DomainEvent]) -> None:
        self._published.extend(events)

    def subscribe(self, event_name: str, handler: Callable[[DomainEvent], None]) -> None:
        pass

    @property
    def published(self) -> list[DomainEvent]:
        return list(self._published)

    def clear(self) -> None:
        self._published.clear()


class InProcessEventBus(IEventBus):
    def __init__(self):
        self._handlers: dict[str, list[Callable]] = {}

    def subscribe(self, event_name: str, handler: Callable[[DomainEvent], None]) -> None:
        self._handlers.setdefault(event_name, []).append(handler)

    def publish(self, event: DomainEvent) -> None:
        for handler in self._handlers.get(event.__class__.event_name, []):
            handler(event)

    def publish_many(self, events: list[DomainEvent]) -> None:
        for event in events:
            self.publish(event)
