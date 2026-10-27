from rest_framework import serializers

from apps.shop.infrastructure.models.polymorphic import Media
from core.base_serializers.base_serializers import BaseModelSerializer


class MediaAssetSerializer(BaseModelSerializer):
    """
    Standardized Storefront Media Asset Serializer for images, videos, and 3D assets.
    """

    is_primary = serializers.SerializerMethodField()

    class Meta:
        model = Media
        fields = [
            "id",
            "url",
            "media_type",
            "alt_text",
            "sort_order",
            "is_primary",
            "metadata",
        ]
        read_only_fields = ["id"]

    def get_is_primary(self, obj) -> bool:
        if isinstance(obj.metadata, dict) and obj.metadata.get("is_primary") is True:
            return True
        return obj.sort_order == 0
