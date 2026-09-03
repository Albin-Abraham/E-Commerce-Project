from rest_framework import serializers
from core.base_serializers.base_serializers import BaseModelSerializer
from apps.shop.infrastructure.models.brand import Brand
from apps.shop.infrastructure.models.warehouse import Warehouse
from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.infrastructure.models.polymorphic import Media, Review, ActivityLog
from apps.shop.infrastructure.models.graph import EntityEdge, BOMEdge, CategoryEdge
from apps.shop.infrastructure.models.events import DomainEventOutbox


class BrandSerializer(BaseModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "description", "website", "is_active", "metadata", "created_at"]
        read_only_fields = ["id", "created_at"]


class WarehouseSerializer(BaseModelSerializer):
    class Meta:
        model = Warehouse
        fields = ["id", "name", "code", "address", "is_active", "company", "created_at"]
        read_only_fields = ["id", "created_at"]


class InventorySerializer(BaseModelSerializer):
    available_quantity = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    target_sku = serializers.SerializerMethodField()

    class Meta:
        model = Inventory
        fields = [
            "id", "variant", "product", "warehouse", "branch",
            "quantity", "reserved_quantity", "reorder_point",
            "available_quantity", "is_low_stock", "target_sku", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_target_sku(self, obj):
        if obj.variant:
            return obj.variant.sku
        if obj.product:
            return obj.product.sku
        return None


class MediaSerializer(BaseModelSerializer):
    class Meta:
        model = Media
        fields = [
            "id", "url", "media_type", "alt_text", "sort_order",
            "content_type", "object_id", "metadata", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ReviewSerializer(BaseModelSerializer):
    customer_username = serializers.CharField(source="customer.username", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "rating", "comment", "customer", "customer_username",
            "is_verified_purchase", "is_approved", "content_type", "object_id", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ActivityLogSerializer(BaseModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            "id", "actor", "actor_username", "action",
            "content_type", "object_id", "metadata", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class EntityEdgeSerializer(BaseModelSerializer):
    class Meta:
        model = EntityEdge
        fields = [
            "id", "source_content_type", "source_object_id",
            "target_content_type", "target_object_id",
            "relation_type", "weight", "metadata", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class CategoryEdgeSerializer(BaseModelSerializer):
    class Meta:
        model = CategoryEdge
        fields = [
            "id", "from_category", "to_category",
            "relation_type", "weight", "metadata", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class BOMEdgeSerializer(BaseModelSerializer):
    parent_sku = serializers.CharField(source="parent_variant.sku", read_only=True)
    child_sku = serializers.CharField(source="child_variant.sku", read_only=True)

    class Meta:
        model = BOMEdge
        fields = [
            "id", "parent_variant", "parent_sku", "child_variant", "child_sku",
            "quantity", "unit", "metadata", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class DomainEventOutboxSerializer(BaseModelSerializer):
    class Meta:
        model = DomainEventOutbox
        fields = [
            "id", "event_type", "version", "entity_id", "payload",
            "idempotency_key", "status", "retry_count", "error_log",
            "processed_at", "created_at",
        ]
        read_only_fields = ["id", "idempotency_key", "processed_at", "created_at"]
