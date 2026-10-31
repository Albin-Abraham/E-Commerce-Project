# core/repositories/base.py
from typing import Any, Generic, TypeVar

from django.db.models import Model, QuerySet

T = TypeVar("T", bound=Model)


class BaseRepository(Generic[T]):
    """Abstract Base Repository providing standard CRUD interfaces."""

    def __init__(self, model_class: type[T]):
        self.model = model_class

    def get_by_id(self, entity_id: Any) -> T:
        return self.model.objects.get(id=entity_id)

    def all(self) -> QuerySet[T]:
        return self.model.objects.all()

    def create(self, **kwargs) -> T:
        return self.model.objects.create(**kwargs)

    def save(self, entity: T) -> T:
        entity.save()
        return entity

    def delete(self, entity: T) -> None:
        entity.delete()
