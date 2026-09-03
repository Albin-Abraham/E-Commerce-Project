from django.urls import path
from apps.knowledgebase.views import (
    KnowledgeCategoryViewSet,
    KnowledgeArticleViewSet,
    ProductKnowledgeLinkViewSet,
)

urlpatterns = [
    path("kb/categories/", KnowledgeCategoryViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="kb-category-list"),
    path("kb/categories/<str:pk>/", KnowledgeCategoryViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="kb-category-detail"),
    path("kb/articles/", KnowledgeArticleViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="kb-article-list"),
    path("kb/articles/<str:pk>/", KnowledgeArticleViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="kb-article-detail"),
    path("kb/product-links/", ProductKnowledgeLinkViewSet.as_view(), {"HTTP_METHOD": ["GET", "POST"]}, name="kb-product-link-list"),
    path("kb/product-links/<str:pk>/", ProductKnowledgeLinkViewSet.as_view(), {"HTTP_METHOD": ["GET", "PUT", "DELETE"]}, name="kb-product-link-detail"),
]
