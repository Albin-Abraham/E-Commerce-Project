from core.base_views.api_views import BaseAPIView
from core.admin.helpers.query_helpers import FilterSchema, FilterField, LOOKUP_OPERATORS
from apps.knowledgebase.models.kb import KnowledgeCategory, KnowledgeArticle, ProductKnowledgeLink
from apps.knowledgebase.serializers import (
    KnowledgeCategorySerializer,
    KnowledgeArticleSerializer,
    ProductKnowledgeLinkSerializer,
)


class KnowledgeCategoryViewSet(BaseAPIView):
    model = KnowledgeCategory
    serializer_class = KnowledgeCategorySerializer
    entity_name = "KnowledgeCategory"
    view_id = "KB_CATEGORY_MGMT"

    search_fields = ["name", "description"]
    filter_schema = FilterSchema(
        name=FilterField(type=str, lookups=["exact", "icontains"]),
        slug=FilterField(type=str, lookups=["exact"]),
    )


class KnowledgeArticleViewSet(BaseAPIView):
    """
    Knowledge Base Article API ViewSet.
    Integrated with FilterSchema for searching manuals, guides, pitches, and compliance certs by title, slug, metadata, or tags.
    """
    model = KnowledgeArticle
    serializer_class = KnowledgeArticleSerializer
    entity_name = "KnowledgeArticle"
    view_id = "KB_ARTICLE_MGMT"

    paginate = True
    search_fields = ["title", "summary", "content", "slug"]
    filter_schema = FilterSchema(
        title=FilterField(type=str, lookups=["exact", "icontains"]),
        slug=FilterField(type=str, lookups=["exact"]),
        category=FilterField(type=str, lookups=["exact"]),
        status=FilterField(type=str, lookups=["exact"]),
        is_internal_only=FilterField(type=bool),
        metadata=FilterField(type=str, lookups=LOOKUP_OPERATORS),
    )

    def get_base_queryset(self):
        return KnowledgeArticle.objects.select_related("category", "author")


class ProductKnowledgeLinkViewSet(BaseAPIView):
    """
    Product, Variant, Inventory & Category Knowledgebase Linkage API ViewSet.
    Enables lookups by Foreign Keys OR direct target_identifier strings (Product Slug, Variant SKU, Inventory ID, Category Slug).
    """
    model = ProductKnowledgeLink
    serializer_class = ProductKnowledgeLinkSerializer
    entity_name = "ProductKnowledgeLink"
    view_id = "KB_PRODUCT_LINK_MGMT"

    paginate = True
    search_fields = ["target_identifier", "notes"]
    filter_schema = FilterSchema(
        article=FilterField(type=str, lookups=["exact"]),
        product=FilterField(type=str, lookups=["exact"]),
        variant=FilterField(type=str, lookups=["exact"]),
        inventory=FilterField(type=str, lookups=["exact"]),
        shop_category=FilterField(type=str, lookups=["exact"]),
        target_identifier=FilterField(type=str, lookups=["exact", "icontains"]),
        link_type=FilterField(type=str, lookups=["exact"]),
        is_active=FilterField(type=bool),
    )

    def get_base_queryset(self):
        return ProductKnowledgeLink.objects.select_related("article", "product", "variant", "inventory", "shop_category")
