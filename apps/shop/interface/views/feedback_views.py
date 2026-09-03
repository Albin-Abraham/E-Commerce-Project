from decimal import Decimal
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.shop.infrastructure.models.polymorphic import Review, ProductComment, ProductTestimonial
from apps.shop.services.feedback_service import ProductFeedbackService


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.username", read_only=True, default="Anonymous")

    class Meta:
        model = Review
        fields = [
            "id",
            "title",
            "rating",
            "comment",
            "customer",
            "customer_name",
            "is_verified_purchase",
            "helpful_votes",
            "media_urls",
            "seller_reply",
            "seller_replied_at",
            "content_type",
            "object_id",
            "created_at",
            "updated_at",
        ]


class ProductCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True, default="Anonymous")
    replies_count = serializers.IntegerField(source="replies.count", read_only=True)

    class Meta:
        model = ProductComment
        fields = [
            "id",
            "author",
            "author_name",
            "parent",
            "content",
            "is_seller_reply",
            "like_count",
            "is_approved",
            "replies_count",
            "content_type",
            "object_id",
            "created_at",
            "updated_at",
        ]


class ProductTestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductTestimonial
        fields = "__all__"


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    filterset_fields = ["content_type", "object_id", "is_approved", "is_verified_purchase"]

    @action(detail=False, methods=["post"], url_path="add")
    def add_review(self, request):
        target_id = request.data.get("target_id")
        rating = request.data.get("rating", 5.0)
        title = request.data.get("title")
        comment = request.data.get("comment", "")
        media_urls = request.data.get("media_urls", [])

        if not target_id:
            return Response({"detail": "target_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            review = ProductFeedbackService.add_review(
                customer_user=request.user if request.user.is_authenticated else None,
                target_entity_or_id=target_id,
                rating=Decimal(str(rating)),
                title=title,
                comment=comment,
                media_urls=media_urls,
            )
            serializer = ReviewSerializer(review)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="seller-reply")
    def seller_reply(self, request, pk=None):
        reply_text = request.data.get("reply_text")
        if not reply_text:
            return Response({"detail": "reply_text is required."}, status=status.HTTP_400_BAD_REQUEST)

        review = ProductFeedbackService.add_seller_reply_to_review(pk, reply_text)
        serializer = ReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProductCommentViewSet(viewsets.ModelViewSet):
    queryset = ProductComment.objects.all()
    serializer_class = ProductCommentSerializer
    filterset_fields = ["content_type", "object_id", "parent", "is_seller_reply", "is_approved"]

    @action(detail=False, methods=["post"], url_path="add")
    def add_comment(self, request):
        target_id = request.data.get("target_id")
        content = request.data.get("content")
        parent_comment_id = request.data.get("parent_comment_id")
        is_seller_reply = bool(request.data.get("is_seller_reply", False))

        if not target_id or not content:
            return Response({"detail": "target_id and content are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            comment = ProductFeedbackService.add_comment(
                author_user=request.user if request.user.is_authenticated else None,
                target_entity_or_id=target_id,
                content=content,
                parent_comment_id=parent_comment_id,
                is_seller_reply=is_seller_reply,
            )
            serializer = ProductCommentSerializer(comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class ProductTestimonialViewSet(viewsets.ModelViewSet):
    queryset = ProductTestimonial.objects.all()
    serializer_class = ProductTestimonialSerializer
    filterset_fields = ["content_type", "object_id", "is_featured", "is_verified"]


class FeedbackSummaryViewSet(viewsets.ViewSet):
    @action(detail=False, methods=["get"], url_path="pdp-summary")
    def summary(self, request):
        target_id = request.query_params.get("target_id")
        if not target_id:
            return Response({"detail": "target_id query param is required."}, status=status.HTTP_400_BAD_REQUEST)

        summary_data = ProductFeedbackService.get_product_feedback_summary(target_id)
        return Response(summary_data, status=status.HTTP_200_OK)
