from apps.shop.infrastructure.models.category import Category
from apps.shop.infrastructure.serializers.category_serializers import CategorySerializer
from core.admin.helpers.query_helpers import FilterField, FilterSchema
from core.base_views.api_views import BaseAPIView


class CategoryViewSet(BaseAPIView):
    model = Category
    serializer_class = CategorySerializer
    entity_name = "Category"
    view_id = "SHOP_CATEGORY_MGMT"

    paginate = True
    supports_soft_delete = True

    search_fields = ["name", "description"]
    filter_schema = FilterSchema(
        name=FilterField(type=str),
        parent=FilterField(type=str),
        is_active=FilterField(type=bool),
    )
    orderby = "name"
