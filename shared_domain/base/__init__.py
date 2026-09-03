"""
shared_domain/base/
Pure Python domain infrastructure — zero framework imports.
All domain entities, operations, policies and events build on these contracts.
"""

from .bulk import (
    BatchOperation,
    BatchOperationResult,
    BatchStatus,
    BulkItemResult,
    BulkOperation,
    BulkOperationResult,
)
from .entity import Entity
from .eva import EVA, StateContext
from .event import DomainEvent, IEventBus
from .lifecycle import InvalidStateTransitionError, LifecycleEngine
from .operation import Operation, OperationResult
from .policy import Policy, PolicySet, PolicyViolationError
from .valuesets import ValueSet, ValueSetItem, ValueSetRegistry

__all__ = [
    "EVA",
    "StateContext",
    "ValueSet",
    "ValueSetItem",
    "ValueSetRegistry",
    "Entity",
    "LifecycleEngine",
    "InvalidStateTransitionError",
    "Policy",
    "PolicyViolationError",
    "PolicySet",
    "Operation",
    "OperationResult",
    "DomainEvent",
    "IEventBus",
    "BulkItemResult",
    "BulkOperationResult",
    "BatchStatus",
    "BatchOperationResult",
    "BulkOperation",
    "BatchOperation",
]
