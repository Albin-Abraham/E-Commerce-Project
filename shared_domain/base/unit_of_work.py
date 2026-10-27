# shared_domain/base/unit_of_work.py
"""
UnitOfWork — interface for managing transactional consistency boundaries.
Pure Python, completely framework-agnostic.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class IUnitOfWork(ABC):
    """
    Abstract Unit of Work contract.
    Coordinates the writing out of changes and manages transaction boundaries.
    """

    @abstractmethod
    def __enter__(self) -> IUnitOfWork:
        """Enter the transaction context."""
        ...

    @abstractmethod
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Exit the transaction context, auto-rolling back if an exception occurred."""
        ...

    @abstractmethod
    def commit(self) -> None:
        """Explicitly commit changes."""
        ...

    @abstractmethod
    def rollback(self) -> None:
        """Explicitly rollback changes."""
        ...
