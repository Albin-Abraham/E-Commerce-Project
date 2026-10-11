# apps/access_control/providers.py
"""
EntityAccessControlProvider — Concrete implementation of IAccessControlProvider.
Registers with core.registry.provider_registry.ProviderRegistry at startup.
"""

from typing import Any
from django.contrib.contenttypes.models import ContentType
from core.registry.provider_registry import IAccessControlProvider


class EntityAccessControlProvider(IAccessControlProvider):
    def has_entity_access(self, user: Any, content_type_or_model: Any, object_id: str) -> bool:
        from apps.access_control.models import EntityAccessControl
        if not isinstance(content_type_or_model, ContentType):
            ct = ContentType.objects.get_for_model(content_type_or_model)
        else:
            ct = content_type_or_model
        return EntityAccessControl.objects.filter(
            user=user, content_type=ct, object_id=str(object_id)
        ).exists()

    def get_allowed_object_ids(self, user: Any, model: Any) -> list[str]:
        from apps.access_control.models import EntityAccessControl
        ct = ContentType.objects.get_for_model(model)
        return list(
            EntityAccessControl.objects.filter(user=user, content_type=ct).values_list(
                "object_id", flat=True
            )
        )
