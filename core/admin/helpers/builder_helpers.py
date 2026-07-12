from typing import Any, Optional, Type
from django.db.models import Model


class ModelInstanceBuilder:
    """
    GoF Builder Pattern: Centralizes instance construction and partial updates.
    """
    def __init__(self, model_class: Type[Model], instance: Optional[Model] = None):
        self.model_class = model_class
        self.instance = instance

    def build(self, data: dict, partial: bool = False) -> Model:
        """
        Construct a new instance or update an existing one without saving.
        Filters out non-model fields (e.g. nested serializer data).
        """
        model_fields = {f.name for f in self.model_class._meta.fields}
        filtered_data = {k: v for k, v in data.items() if k in model_fields}

        if self.instance:
            # Update existing instance (PATCH/PUT logic)
            for field, value in filtered_data.items():
                setattr(self.instance, field, value)
            return self.instance

        # Create new instance
        return self.model_class(**filtered_data)
