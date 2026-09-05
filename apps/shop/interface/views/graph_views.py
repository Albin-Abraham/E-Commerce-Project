from core.base_views.api_views import BaseAPIView
from core.admin.helpers.query_helpers import FilterSchema, FilterField
from apps.shop.infrastructure.models.graph import EntityEdge, BOMEdge
from apps.shop.infrastructure.models.category import CategoryEdge
from apps.shop.infrastructure.serializers.shop_serializers import (
    EntityEdgeSerializer,
    CategoryEdgeSerializer,
    BOMEdgeSerializer,
)


class EntityEdgeViewSet(BaseAPIView):
    """
    Knowledge Graph Ontology API ViewSet.
    Managed strict hard relations (belongs_to, supplied_by, listed_by) and soft relations (bought_with, similar_to).
    """
    model = EntityEdge
    serializer_class = EntityEdgeSerializer
    entity_name = "EntityEdge"
    view_id = "SHOP_GRAPH_EDGE_MGMT"

    paginate = True
    filter_schema = FilterSchema(
        relation_type=FilterField(type=str, lookups=["exact"]),
        weight=FilterField(type=float, lookups=["exact", "gte", "lte"]),
    )


class CategoryEdgeViewSet(BaseAPIView):
    model = CategoryEdge
    serializer_class = CategoryEdgeSerializer
    entity_name = "CategoryEdge"
    view_id = "SHOP_CATEGORY_EDGE_MGMT"

    filter_schema = FilterSchema(
        relation_type=FilterField(type=str, lookups=["exact"]),
        from_category=FilterField(type=str, lookups=["exact"]),
        to_category=FilterField(type=str, lookups=["exact"]),
    )


class BOMEdgeViewSet(BaseAPIView):
    """
    Bill of Materials (BOM) DAG Graph API ViewSet.
    """
    model = BOMEdge
    serializer_class = BOMEdgeSerializer
    entity_name = "BOMEdge"
    view_id = "SHOP_BOM_EDGE_MGMT"

    paginate = True
    filter_schema = FilterSchema(
        parent_variant=FilterField(type=str, lookups=["exact"]),
        child_variant=FilterField(type=str, lookups=["exact"]),
    )

    def get_base_queryset(self):
        return BOMEdge.objects.select_related("parent_variant", "child_variant")
