# core/repositories/__init__.py
from core.repositories.base import BaseRepository
from core.repositories.scoped_repository import StrategyScopedRepository

__all__ = [
    "BaseRepository",
    "StrategyScopedRepository",
]
