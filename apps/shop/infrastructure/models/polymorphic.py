from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from core.base_models.validator_model import BaseModel
from core.base_models.constants import USER_MODEL
from core.base_models.fields.short_ui_fields import CustomShortUUIDField


from apps.shop.valuesets import MEDIA_TYPE_VALUESET


class Media(BaseModel):

    id = CustomShortUUIDField(primary_key=True, prefix="med_")
    url = models.URLField(max_length=500)
    media_type = models.CharField(
        max_length=20,
        choices=MEDIA_TYPE_VALUESET.as_django_choices(),
        default="IMAGE",
    )
    alt_text = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    # Generic Relation (Product, Category, Brand, Seller)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=50)
    content_object = GenericForeignKey("content_type", "object_id")

    metadata = models.JSONField(default=dict, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "shop_media"
        ordering = ["sort_order", "-created_at"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]
        verbose_name = "Media Asset"
        verbose_name_plural = "Media Assets"

    def __str__(self):
        return f"{self.media_type} for {self.content_object}"


class Review(BaseModel):
    id = CustomShortUUIDField(primary_key=True, prefix="rev_")
    title = models.CharField(max_length=200, blank=True, null=True, help_text="Review title/headline")
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=5.0,
        help_text="Rating score from 0.5 to 5.0 (supports 0.5 half-star increments)",
    )
    comment = models.TextField(blank=True)
    customer = models.ForeignKey(
        USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="product_reviews",
    )
    is_verified_purchase = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=True)
    helpful_votes = models.IntegerField(default=0, help_text="Number of upvotes for helpful review")
    media_urls = models.JSONField(default=list, blank=True, help_text="Customer photo/video attachments")

    # Seller / Merchant Official Response
    seller_reply = models.TextField(blank=True, null=True, help_text="Official response from seller/vendor")
    seller_replied_at = models.DateTimeField(null=True, blank=True)

    # Generic Polymorphic Relation (Product, Variant, Seller, Service, Brand)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=50)
    content_object = GenericForeignKey("content_type", "object_id")

    class Meta(BaseModel.Meta):
        db_table = "shop_reviews"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]
        verbose_name = "Review"
        verbose_name_plural = "Reviews"

    def set_target_entity(self, entity_obj):
        """
        Polymorphically binds this review to any target domain entity.
        """
        self.content_type = ContentType.objects.get_for_model(entity_obj)
        self.object_id = str(entity_obj.pk)

    def __str__(self):
        return f"Review {self.rating}/5.0 for {self.content_object}"


class ProductComment(BaseModel):
    """
    Nested Comment & Q&A Discussion Threading on Product Pages.
    Supports multi-level nested replies, seller answers, and polymorphic entity linkage via GenericForeignKey.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="pcom_")
    author = models.ForeignKey(
        USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="product_comments",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
        help_text="Parent comment for nested self-referencing reply threads",
    )
    content = models.TextField(help_text="Comment body text")
    is_seller_reply = models.BooleanField(default=False, help_text="True if response is from verified product seller")
    like_count = models.PositiveIntegerField(default=0)
    is_approved = models.BooleanField(default=True)

    # Generic Polymorphic Relation (Product, Variant, Seller, Facility)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=50)
    content_object = GenericForeignKey("content_type", "object_id")

    class Meta(BaseModel.Meta):
        db_table = "shop_product_comments"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]
        verbose_name = "Product Comment"
        verbose_name_plural = "Product Comments"

    def set_target_entity(self, entity_obj):
        """
        Polymorphically binds this comment thread to any target domain entity.
        """
        self.content_type = ContentType.objects.get_for_model(entity_obj)
        self.object_id = str(entity_obj.pk)

    def __str__(self):
        return f"Comment by {self.author} on {self.content_object}"


class ProductTestimonial(BaseModel):
    """
    Verified Product Testimonials & Customer Endorsements.
    Featured social proof testimonials polymorphically linked to products or entities.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="tstm_")
    customer_name = models.CharField(max_length=150, help_text="Display name of testimonial author")
    designation_or_company = models.CharField(max_length=150, blank=True, null=True, help_text="e.g. Verified Buyer, CEO at TechCorp")
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    testimonial_text = models.TextField(help_text="Testimonial content body")
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=5.0,
        help_text="Rating score from 0.5 to 5.0",
    )
    is_featured = models.BooleanField(default=True, help_text="If true, highlighted in storefront hero/reviews section")
    is_verified = models.BooleanField(default=True)

    # Generic Polymorphic Relation (Product, Brand, Seller)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=50)
    content_object = GenericForeignKey("content_type", "object_id")

    class Meta(BaseModel.Meta):
        db_table = "shop_product_testimonials"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]
        verbose_name = "Product Testimonial"
        verbose_name_plural = "Product Testimonials"

    def set_target_entity(self, entity_obj):
        """
        Polymorphically binds this testimonial to any target domain entity.
        """
        self.content_type = ContentType.objects.get_for_model(entity_obj)
        self.object_id = str(entity_obj.pk)

    def __str__(self):
        return f"Testimonial from {self.customer_name} for {self.content_object}"


class ActivityLog(BaseModel):
    id = CustomShortUUIDField(primary_key=True, prefix="act_")
    actor = models.ForeignKey(
        USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="shop_activity_logs",
    )
    action = models.CharField(max_length=100, help_text="e.g. PRODUCT_UPDATED, STOCK_RESERVED")
    
    # Generic Target Relation
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=50)
    content_object = GenericForeignKey("content_type", "object_id")

    metadata = models.JSONField(default=dict, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "shop_activity_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]
        verbose_name = "Activity Log"
        verbose_name_plural = "Activity Logs"

    def __str__(self):
        return f"{self.action} on {self.content_object} by {self.actor}"
