from django.utils.text import slugify
from core.base_serializers.base_serializers import BaseModelSerializer
from apps.shop.infrastructure.models.category import Category


class CategorySerializer(BaseModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id", "name", "slug", "parent",
            "is_active", "metadata",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = dict(data)
        if not data.get("slug"):
            name = data.get("name")
            if name:
                data["slug"] = slugify(name)
            elif self.instance is not None:
                data["slug"] = self.instance.slug
        return super().to_internal_value(data)
