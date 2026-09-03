from decimal import Decimal
import logging
from django.contrib.contenttypes.models import ContentType
from django.db.models import Avg, Count
from django.utils import timezone
from apps.shop.infrastructure.models.polymorphic import Review, ProductComment, ProductTestimonial
from apps.shop.infrastructure.models.product import Product

logger = logging.getLogger(__name__)


class ProductFeedbackService:
    """
    Polymorphic Product Reviews, Half-Star Ratings (0.5-5.0), Self-Referencing Nested Comments & Testimonials Service.
    Supports GFK polymorphism to bind reviews, Q&As, and testimonials to ANY entity (Product, Variant, Seller, Service).
    """

    @classmethod
    def add_review(
        cls,
        customer_user,
        target_entity_or_id,
        rating: float | Decimal,
        title: str | None = None,
        comment: str = "",
        media_urls: list[str] | None = None,
        is_verified_purchase: bool = False,
    ) -> Review:
        """
        Submits a customer rating and review for any domain entity.
        Supports 0.5 half-star ratings (0.5 to 5.0).
        """
        rating_dec = Decimal(str(rating))
        if not (Decimal("0.5") <= rating_dec <= Decimal("5.0")):
            raise ValueError("Rating score must be between 0.5 and 5.0 stars.")

        target = target_entity_or_id
        if isinstance(target_entity_or_id, str):
            target = Product.objects.get(pk=target_entity_or_id)

        ct = ContentType.objects.get_for_model(target)

        review = Review.objects.create(
            title=title,
            rating=rating_dec,
            comment=comment,
            customer=customer_user,
            is_verified_purchase=is_verified_purchase,
            media_urls=media_urls or [],
            content_type=ct,
            object_id=str(target.pk),
        )
        logger.info(f"Submitting {rating_dec}-star review for '{target}' by customer {customer_user}")
        return review

    @classmethod
    def add_comment(
        cls,
        author_user,
        target_entity_or_id,
        content: str,
        parent_comment_id: str | None = None,
        is_seller_reply: bool = False,
    ) -> ProductComment:
        """
        Adds a comment or self-referencing nested reply to an existing comment thread.
        Polymorphically binds to any target domain entity using GenericForeignKey.
        """
        if not content or not content.strip():
            raise ValueError("Comment text cannot be empty.")

        target = target_entity_or_id
        if isinstance(target_entity_or_id, str):
            target = Product.objects.get(pk=target_entity_or_id)

        ct = ContentType.objects.get_for_model(target)
        parent_comment = ProductComment.objects.get(pk=parent_comment_id) if parent_comment_id else None

        comment = ProductComment.objects.create(
            author=author_user,
            parent=parent_comment,
            content=content.strip(),
            is_seller_reply=is_seller_reply,
            content_type=ct,
            object_id=str(target.pk),
        )
        return comment

    @classmethod
    def add_seller_reply_to_review(cls, review_id: str, seller_reply_text: str) -> Review:
        """
        Allows official merchant/seller to reply to a customer review.
        """
        review = Review.objects.get(pk=review_id)
        review.seller_reply = seller_reply_text.strip()
        review.seller_replied_at = timezone.now()
        review.save(update_fields=["seller_reply", "seller_replied_at", "updated_at"])
        return review

    @classmethod
    def add_testimonial(
        cls,
        target_entity_or_id,
        customer_name: str,
        testimonial_text: str,
        designation_or_company: str | None = None,
        rating: float | Decimal = Decimal("5.0"),
        avatar_url: str | None = None,
        is_featured: bool = True,
    ) -> ProductTestimonial:
        """
        Adds a featured customer endorsement/testimonial bound to a target entity via GFK.
        """
        target = target_entity_or_id
        if isinstance(target_entity_or_id, str):
            target = Product.objects.get(pk=target_entity_or_id)

        ct = ContentType.objects.get_for_model(target)
        return ProductTestimonial.objects.create(
            customer_name=customer_name,
            designation_or_company=designation_or_company,
            avatar_url=avatar_url,
            testimonial_text=testimonial_text.strip(),
            rating=Decimal(str(rating)),
            is_featured=is_featured,
            content_type=ct,
            object_id=str(target.pk),
        )

    @classmethod
    def get_product_feedback_summary(cls, target_entity_or_id) -> dict:
        """
        Generates complete PDP feedback summary: 0.5-5.0 rating average, half-star breakdown,
        nested self-referencing comment trees, and featured testimonials using GenericForeignKey.
        """
        target = target_entity_or_id
        if isinstance(target_entity_or_id, str):
            target = Product.objects.get(pk=target_entity_or_id)

        ct = ContentType.objects.get_for_model(target)
        reviews_qs = Review.objects.filter(content_type=ct, object_id=str(target.pk), is_approved=True)

        avg_rating_val = reviews_qs.aggregate(avg=Avg("rating"))["avg"] or 0.0
        total_reviews = reviews_qs.count()

        # Star breakdown counters supporting 0.5 steps
        star_counts = {"5.0": 0, "4.5": 0, "4.0": 0, "3.5": 0, "3.0": 0, "2.5": 0, "2.0": 0, "1.5": 0, "1.0": 0, "0.5": 0}
        counts_qs = reviews_qs.values("rating").annotate(cnt=Count("id"))
        for item in counts_qs:
            r_str = f"{float(item['rating']):.1f}"
            if r_str in star_counts:
                star_counts[r_str] = item["cnt"]

        # Fetch top root comments (parent=None) with their nested replies
        root_comments = ProductComment.objects.filter(
            content_type=ct, object_id=str(target.pk), parent=None, is_approved=True
        ).select_related("author").prefetch_related("replies")

        comment_threads = []
        for parent in root_comments:
            comment_threads.append({
                "comment_id": str(parent.id),
                "author": str(parent.author) if parent.author else "Anonymous",
                "content": parent.content,
                "created_at": parent.created_at.isoformat(),
                "is_seller_reply": parent.is_seller_reply,
                "likes_count": parent.like_count,
                "replies": [
                    {
                        "comment_id": str(reply.id),
                        "author": str(reply.author) if reply.author else "Anonymous",
                        "content": reply.content,
                        "created_at": reply.created_at.isoformat(),
                        "is_seller_reply": reply.is_seller_reply,
                        "likes_count": reply.like_count,
                    }
                    for reply in parent.replies.filter(is_approved=True)
                ],
            })

        # Fetch featured testimonials
        testimonials = ProductTestimonial.objects.filter(content_type=ct, object_id=str(target.pk), is_featured=True)
        testimonial_list = [
            {
                "id": str(t.id),
                "customer_name": t.customer_name,
                "designation_or_company": t.designation_or_company,
                "avatar_url": t.avatar_url,
                "testimonial_text": t.testimonial_text,
                "rating": float(t.rating),
                "is_verified": t.is_verified,
            }
            for t in testimonials
        ]

        return {
            "entity_id": str(target.pk),
            "entity_name": str(target),
            "average_rating": round(float(avg_rating_val), 1),
            "total_reviews_count": total_reviews,
            "star_breakdown": star_counts,
            "comment_threads": comment_threads,
            "featured_testimonials": testimonial_list,
        }
