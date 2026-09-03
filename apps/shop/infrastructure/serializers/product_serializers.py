from rest_framework import serializers
from core.base_serializers.base_serializers import BaseModelSerializer
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant
from apps.shop.application.services.product_knowledge_service import ProductKnowledgeService


class ProductVariantSerializer(BaseModelSerializer):
    knowledge_content = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = [
            "id", "product", "sku", "price", "compare_at_price",
            "barcode", "status", "attributes", "is_active",
            "knowledge_content", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_knowledge_content(self, obj):
        return ProductKnowledgeService.resolve_knowledge_content(obj)


class ProductSerializer(BaseModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    knowledge_content = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "sku", "name", "slug", "brand", "brand_name",
            "category", "category_name", "price", "status",
            "is_active", "metadata", "extensions", "company",
            "variants", "knowledge_content", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_knowledge_content(self, obj):
        return ProductKnowledgeService.resolve_knowledge_content(obj)
