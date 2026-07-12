from core.base_views.api_views import BaseAPIView
from apps.shop.infrastructure.models.category import Category
from apps.shop.infrastructure.serializers.category_serializers import CategorySerializer


class CategoryViewSet(BaseAPIView):
    model = Category
    serializer_class = CategorySerializer
    entity_name = "Category"
    view_id = "SHOP_CATEGORY_MGMT"

    paginate = True
    supports_soft_delete = True

    search_fields = ["name", "description"]
    filter_fields = [("name", "name"), ("parent", "parent")]
    orderby = "name"
