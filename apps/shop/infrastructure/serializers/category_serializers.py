from core.base_serializers.base_serializers import BaseModelSerializer
from apps.shop.infrastructure.models.category import Category


class CategorySerializer(BaseModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id", "name", "parent", "description",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
