from rest_framework import serializers
from core.base_serializers.base_serializers import BaseModelSerializer
from apps.knowledgebase.models.kb import KnowledgeCategory, KnowledgeArticle, ProductKnowledgeLink


class KnowledgeCategorySerializer(BaseModelSerializer):
    class Meta:
        model = KnowledgeCategory
        fields = ["id", "name", "slug", "description", "parent", "created_at"]
        read_only_fields = ["id", "created_at"]


class KnowledgeArticleSerializer(BaseModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = KnowledgeArticle
        fields = [
            "id", "title", "slug", "summary", "content", "category",
            "author", "author_username", "status", "is_internal_only",
            "tags", "metadata", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ProductKnowledgeLinkSerializer(BaseModelSerializer):
    article_title = serializers.CharField(source="article.title", read_only=True)
    article_slug = serializers.CharField(source="article.slug", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    variant_sku = serializers.CharField(source="variant.sku", read_only=True)

    class Meta:
        model = ProductKnowledgeLink
        fields = [
            "id", "article", "article_title", "article_slug", "product", "product_name",
            "variant", "variant_sku", "inventory", "shop_category",
            "target_identifier", "link_type", "is_active", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
