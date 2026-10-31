from rest_framework.decorators import action
from rest_framework.response import Response

from apps.shop.infrastructure.models.catalog import (
    Catalog,
    CatalogCollection,
    CatalogItem,
    CatalogPublication,
    EntityTag,
    TagDefinition,
)
from apps.shop.infrastructure.serializers.catalog_serializers import (
    CatalogCollectionSerializer,
    CatalogItemSerializer,
    CatalogPublicationSerializer,
    CatalogSerializer,
    EntityTagSerializer,
    TagDefinitionSerializer,
)
from core.admin.helpers.query_helpers import FilterField, FilterSchema
from core.base_views.api_views import BaseAPIView


class TagDefinitionViewSet(BaseAPIView):
    model = TagDefinition
    serializer_class = TagDefinitionSerializer
    entity_name = "TagDefinition"
    view_id = "SHOP_TAG_DEF_MGMT"

    paginate = True
    search_fields = ["name", "code", "badge_label"]
    filter_schema = FilterSchema(
        code=FilterField(type=str),
        name=FilterField(type=str),
        is_active=FilterField(type=bool),
    )
    orderby = "name"


class EntityTagViewSet(BaseAPIView):
    model = EntityTag
    serializer_class = EntityTagSerializer
    entity_name = "EntityTag"
    view_id = "SHOP_ENTITY_TAG_MGMT"

    paginate = True
    filter_schema = FilterSchema(
        tag_definition=FilterField(type=str),
        object_id=FilterField(type=str),
    )
    orderby = "-created_at"


class CatalogViewSet(BaseAPIView):
    model = Catalog
    serializer_class = CatalogSerializer
    entity_name = "Catalog"
    view_id = "SHOP_CATALOG_MGMT"

    paginate = True
    supports_soft_delete = True

    search_fields = ["name", "code", "slug"]
    orderby = "name"

    filter_schema = FilterSchema(
        name=FilterField(type=str),
        code=FilterField(type=str),
        is_active=FilterField(type=bool),
    )


class CatalogItemViewSet(BaseAPIView):
    model = CatalogItem
    serializer_class = CatalogItemSerializer
    entity_name = "CatalogItem"
    view_id = "SHOP_CATALOG_ITEM_MGMT"

    paginate = True
    supports_soft_delete = True

    search_fields = ["override_name", "product__name", "product__sku"]
    orderby = "sort_order"

    filter_schema = FilterSchema(
        catalog=FilterField(type=str),
        product=FilterField(type=str),
        is_new_arrival=FilterField(type=bool),
        is_budget_friendly=FilterField(type=bool),
        is_published=FilterField(type=bool),
    )

    def get_base_queryset(self):
        return CatalogItem.objects.select_related(
            "catalog", "product__brand", "product__category", "variant"
        ).prefetch_related(
            "product__variants__inventory_records",
            "variant__inventory_records",
        )


class CatalogCollectionViewSet(BaseAPIView):
    model = CatalogCollection
    serializer_class = CatalogCollectionSerializer
    entity_name = "CatalogCollection"
    view_id = "SHOP_CATALOG_COLLECTION_MGMT"

    paginate = True
    supports_soft_delete = True

    search_fields = ["name", "slug"]
    orderby = "name"

    filter_schema = FilterSchema(
        catalog=FilterField(type=str),
        name=FilterField(type=str),
        collection_type=FilterField(type=str),
        is_active=FilterField(type=bool),
    )

    @action(detail=True, methods=["get"])
    def effective_items(self, request, pk=None):
        collection = self.get_object()
        items = collection.get_effective_items()
        serializer = CatalogItemSerializer(items, many=True)
        return Response({"success": True, "data": serializer.data})


class CatalogPublicationViewSet(BaseAPIView):
    model = CatalogPublication
    serializer_class = CatalogPublicationSerializer
    entity_name = "CatalogPublication"
    view_id = "SHOP_CATALOG_PUBLICATION_MGMT"

    paginate = True

    search_fields = ["channel"]
    orderby = "-published_at"

    filter_schema = FilterSchema(
        catalog=FilterField(type=str),
        channel=FilterField(type=str),
        is_active=FilterField(type=bool),
    )

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        publication = self.get_object()
        publication.publish()
        serializer = self.get_serializer(publication)
        return Response(
            {"success": True, "message": "Catalog publication updated", "data": serializer.data}
        )
