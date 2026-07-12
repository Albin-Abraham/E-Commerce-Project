from core.base_serializers.base_serializers import BaseModelSerializer
from apps.shop.infrastructure.models.product import Product


class ProductSerializer(BaseModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id", "name", "sku", "description", "category",
            "price", "is_active", "company",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
