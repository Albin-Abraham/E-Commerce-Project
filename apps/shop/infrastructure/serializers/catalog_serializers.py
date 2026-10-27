from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from apps.shop.infrastructure.models.catalog import (
    Catalog,
    CatalogCollection,
    CatalogItem,
    CatalogPublication,
    EntityTag,
    TagDefinition,
)
from apps.shop.infrastructure.models.polymorphic import Media
from apps.shop.infrastructure.serializers.media_serializers import MediaAssetSerializer
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
    primary_image = serializers.SerializerMethodField()
    is_in_stock = serializers.SerializerMethodField()
    available_stock = serializers.SerializerMethodField()
    badges = serializers.SerializerMethodField()

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
            "badges",
            "primary_image",
            "is_in_stock",
            "available_stock",
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

    def get_badges(self, obj) -> list[str]:
        badges = []
        if obj.is_new_arrival:
            badges.append("New Arrival")
        if obj.is_budget_friendly:
            badges.append("Budget Friendly")
        if isinstance(obj.tags, list):
            badges.extend([str(t) for t in obj.tags if t])
        return badges

    def get_primary_image(self, obj) -> dict | None:
        target = obj.variant if obj.variant is not None else obj.product
        if target:
            ct = ContentType.objects.get_for_model(target.__class__)
            media = (
                Media.objects.filter(content_type=ct, object_id=str(target.pk))
                .order_by("sort_order", "-created_at")
                .first()
            )
            if not media and obj.variant and obj.product:
                prod_ct = ContentType.objects.get_for_model(obj.product.__class__)
                media = (
                    Media.objects.filter(content_type=prod_ct, object_id=str(obj.product.pk))
                    .order_by("sort_order", "-created_at")
                    .first()
                )
            if media:
                return MediaAssetSerializer(media).data
        return None

    def get_available_stock(self, obj) -> int:
        if obj.variant is not None:
            records = getattr(obj.variant, "inventory_records", None)
            return (
                sum(max(0, inv.quantity - inv.reserved_quantity) for inv in records.all())
                if records
                else 0
            )
        if obj.product is not None:
            variants = obj.product.variants.all()
            if variants.exists():
                return sum(
                    sum(
                        max(0, inv.quantity - inv.reserved_quantity)
                        for inv in v.inventory_records.all()
                    )
                    for v in variants
                )
            legacy = getattr(obj.product, "legacy_inventory_records", None)
            return (
                sum(max(0, inv.quantity - inv.reserved_quantity) for inv in legacy.all())
                if legacy
                else 0
            )
        return 0

    def get_is_in_stock(self, obj) -> bool:
        return self.get_available_stock(obj) > 0


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
