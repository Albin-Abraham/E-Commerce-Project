from rest_framework.relations import PrimaryKeyRelatedField
from rest_framework.serializers import BaseSerializer, ListSerializer


def get_related_fields_from_serializer(serializer_class) -> tuple[list[str], list[str]]:
    """
    Industrialized N+1 Prevention:
    Dynamically determines select_related and prefetch_related fields from a serializer.
    - ForeignKey/OneToOne (PrimaryKeyRelatedField or nested Serializer) → select_related
    - ManyToMany (many=True or nested ListSerializer) → prefetch_related
    """
    select_related = []
    prefetch_related = []

    try:
        serializer = serializer_class()
    except Exception:
        # Failsafe if serializer_class requires specific initialization args
        return [], []

    for field_name, field in serializer.get_fields().items():
        if not hasattr(serializer.Meta.model, field_name):
            continue

        # 1. Handle Many-to-Many / Reverse Relations (Prefetch)
        if getattr(field, "many", False) or isinstance(field, ListSerializer):
            prefetch_related.append(field_name)

        # 2. Handle Foreign Keys / One-to-One (Select)
        elif isinstance(field, PrimaryKeyRelatedField) or isinstance(field, BaseSerializer):
            select_related.append(field_name)

    return select_related, prefetch_related


def optimize_queryset_with_serializer(queryset, serializer_class):
    """
    Apply select_related and prefetch_related to queryset based on serializer fields.
    """
    select_related, prefetch_related = get_related_fields_from_serializer(
        serializer_class
    )

    if select_related:
        queryset = queryset.select_related(*select_related)
    if prefetch_related:
        queryset = queryset.prefetch_related(*prefetch_related)

    return queryset