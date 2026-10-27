from django.contrib.contenttypes.models import ContentType
from django.db.models import Avg, Count
from django.utils.text import slugify
from rest_framework import serializers

from apps.shop.application.services.product_knowledge_service import ProductKnowledgeService
from apps.shop.infrastructure.models.polymorphic import Media, Review
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant
from apps.shop.infrastructure.serializers.media_serializers import MediaAssetSerializer
from core.base_serializers.base_serializers import BaseModelSerializer


def _auto_slug(serializer, data):
    if isinstance(data, dict):
        data = dict(data)
    if not data.get("slug"):
        name = data.get("name")
        if name:
            data["slug"] = slugify(name)
        elif serializer.instance is not None:
            data["slug"] = serializer.instance.slug
    return data


def _get_media_for_instance(instance):
    ct = ContentType.objects.get_for_model(instance.__class__)
    return Media.objects.filter(content_type=ct, object_id=str(instance.pk)).order_by(
        "sort_order", "-created_at"
    )


class ProductVariantSerializer(BaseModelSerializer):
    knowledge_content = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    available_stock = serializers.SerializerMethodField()
    is_in_stock = serializers.SerializerMethodField()

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "product",
            "sku",
            "price",
            "compare_at_price",
            "barcode",
            "status",
            "attributes",
            "is_active",
            "images",
            "available_stock",
            "is_in_stock",
            "knowledge_content",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_knowledge_content(self, obj):
        return ProductKnowledgeService.resolve_knowledge_content(obj)

    def get_images(self, obj):
        media_qs = _get_media_for_instance(obj)
        if not media_qs.exists() and obj.product:
            media_qs = _get_media_for_instance(obj.product)
        return MediaAssetSerializer(media_qs, many=True).data

    def get_available_stock(self, obj) -> int:
        records = getattr(obj, "inventory_records", None)
        if records is not None:
            return sum(max(0, inv.quantity - inv.reserved_quantity) for inv in records.all())
        return 0

    def get_is_in_stock(self, obj) -> bool:
        return self.get_available_stock(obj) > 0


class ProductSerializer(BaseModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    knowledge_content = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    available_stock = serializers.SerializerMethodField()
    is_in_stock = serializers.SerializerMethodField()
    rating_summary = serializers.SerializerMethodField()
    options_matrix = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "sku",
            "name",
            "slug",
            "brand",
            "brand_name",
            "category",
            "category_name",
            "price",
            "status",
            "is_active",
            "metadata",
            "extensions",
            "company",
            "images",
            "available_stock",
            "is_in_stock",
            "rating_summary",
            "options_matrix",
            "variants",
            "knowledge_content",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_knowledge_content(self, obj):
        return ProductKnowledgeService.resolve_knowledge_content(obj)

    def get_images(self, obj):
        media_qs = _get_media_for_instance(obj)
        if not media_qs.exists():
            first_variant = obj.variants.first()
            if first_variant:
                media_qs = _get_media_for_instance(first_variant)
        return MediaAssetSerializer(media_qs, many=True).data

    def get_available_stock(self, obj) -> int:
        variants = obj.variants.all()
        if variants.exists():
            total = 0
            for v in variants:
                records = getattr(v, "inventory_records", None)
                if records is not None:
                    total += sum(
                        max(0, inv.quantity - inv.reserved_quantity) for inv in records.all()
                    )
            return total
        legacy_records = getattr(obj, "legacy_inventory_records", None)
        if legacy_records is not None:
            return sum(max(0, inv.quantity - inv.reserved_quantity) for inv in legacy_records.all())
        return 0

    def get_is_in_stock(self, obj) -> bool:
        return self.get_available_stock(obj) > 0

    def get_rating_summary(self, obj) -> dict:
        ct = ContentType.objects.get_for_model(obj.__class__)
        agg = Review.objects.filter(
            content_type=ct, object_id=str(obj.pk), is_approved=True
        ).aggregate(
            avg_rating=Avg("rating"),
            count=Count("id"),
        )
        avg = agg.get("avg_rating")
        return {
            "average_rating": round(float(avg), 1) if avg is not None else 0.0,
            "review_count": agg.get("count") or 0,
        }

    def get_options_matrix(self, obj) -> dict:
        matrix = {}
        for variant in obj.variants.filter(is_active=True):
            if isinstance(variant.attributes, dict):
                for k, v in variant.attributes.items():
                    key = str(k).strip()
                    val = str(v).strip()
                    if key not in matrix:
                        matrix[key] = []
                    if val not in matrix[key]:
                        matrix[key].append(val)
        return matrix

    def to_internal_value(self, data):
        return super().to_internal_value(_auto_slug(self, data))
