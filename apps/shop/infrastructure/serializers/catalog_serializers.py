from rest_framework import serializers

from apps.shop.infrastructure.models.catalog import (
    Catalog,
    CatalogCollection,
    CatalogItem,
    CatalogPublication,
    EntityTag,
    TagDefinition,
)
from apps.shop.infrastructure.serializers.product_serializers import (
    ProductSerializer,
    ProductVariantSerializer,
)
from core.base_serializers.base_serializers import BaseModelSerializer


class TagDefinitionSerializer(BaseModelSerializer):
    class Meta:
        model = TagDefinition
        fields = [
            "id",
            "code",
            "name",
            "badge_label",
            "badge_color",
            "icon_url",
            "is_active",
            "metadata",
            "company",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class EntityTagSerializer(BaseModelSerializer):
    tag_code = serializers.CharField(source="tag_definition.code", read_only=True)
    tag_name = serializers.CharField(source="tag_definition.name", read_only=True)

    class Meta:
        model = EntityTag
        fields = [
            "id",
            "tag_definition",
            "tag_code",
            "tag_name",
            "content_type",
            "object_id",
            "start_date",
            "end_date",
            "company",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CatalogSerializer(BaseModelSerializer):
    class Meta:
        model = Catalog
        fields = [
            "id",
            "name",
            "code",
            "slug",
            "description",
            "is_active",
            "company",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CatalogItemSerializer(BaseModelSerializer):
    product_details = ProductSerializer(source="product", read_only=True)
    variant_details = ProductVariantSerializer(source="variant", read_only=True)
    display_name = serializers.CharField(read_only=True)
    effective_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CatalogItem
        fields = [
            "id",
            "catalog",
            "product",
            "variant",
            "override_name",
            "override_price",
            "display_name",
            "effective_price",
            "is_new_arrival",
            "is_budget_friendly",
            "tags",
            "is_published",
            "sort_order",
            "metadata",
            "company",
            "product_details",
            "variant_details",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CatalogCollectionSerializer(BaseModelSerializer):
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = CatalogCollection
        fields = [
            "id",
            "catalog",
            "name",
            "slug",
            "collection_type",
            "max_budget_price",
            "items",
            "items_count",
            "is_active",
            "metadata",
            "company",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_items_count(self, obj) -> int:
        return obj.get_effective_items().count()


class CatalogPublicationSerializer(BaseModelSerializer):
    channel_display = serializers.CharField(source="get_channel_display", read_only=True)

    class Meta:
        model = CatalogPublication
        fields = [
            "id",
            "catalog",
            "channel",
            "channel_display",
            "published_at",
            "is_active",
            "company",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
