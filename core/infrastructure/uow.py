# core/infrastructure/uow.py
"""
DjangoUnitOfWork — Concrete implementation of IUnitOfWork backed by Django database transactions.
"""

from typing import Any

from django.db import transaction

from shared_domain.base.unit_of_work import IUnitOfWork


class DjangoUnitOfWork(IUnitOfWork):
    """
    Unit of Work implementation integrating with Django transaction.atomic.
    """

    def __init__(self, using: str = "default"):
        self.using = using
        self._atomic: Any | None = None

    def __enter__(self) -> "DjangoUnitOfWork":
        self._atomic = transaction.atomic(using=self.using)
        self._atomic.__enter__()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        if self._atomic is not None:
            self._atomic.__exit__(exc_type, exc_val, exc_tb)
            self._atomic = None

    def commit(self) -> None:
        # Django transaction commits automatically when atomic block exits without exception
        pass

    def rollback(self) -> None:
        transaction.set_rollback(True, using=self.using)
