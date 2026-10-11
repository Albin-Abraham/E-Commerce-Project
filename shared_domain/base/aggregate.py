# shared_domain/base/aggregate.py
"""
AggregateRoot — base class for pure DDD aggregates.
Manages domain event buffering and invariant verification without framework dependencies.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List
from shared_domain.base.event import DomainEvent


@dataclass
class AggregateRoot:
    """
    Base class for pure DDD Aggregate Roots.
    Collects domain events recorded during state changes so they can be
    dispatched after successful persistence.
    """
    id: str | None = None
    version: int = 1
    _events: List[DomainEvent] = field(default_factory=list, init=False, repr=False)

    def record_event(self, event: DomainEvent) -> None:
        """Buffers a domain event onto the aggregate."""
        self._events.append(event)

    def pull_events(self) -> List[DomainEvent]:
        """Returns all recorded domain events and clears the internal buffer."""
        events = list(self._events)
        self._events.clear()
        return events
