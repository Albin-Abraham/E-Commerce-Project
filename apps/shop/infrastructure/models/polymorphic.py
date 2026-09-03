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
    rating = models.PositiveSmallIntegerField(
        help_text="Rating score from 1 to 5"
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

    # Generic Relation (Product, Seller, Order)
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

    def __str__(self):
        return f"Review {self.rating}/5 for {self.content_object}"


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
