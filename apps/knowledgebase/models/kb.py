from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from core.base_models.validator_model import BaseModel
from core.base_models.constants import USER_MODEL
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField, CustomTextField
from core.base_models.validators.rules import RequiredRule, UniqueRule


class KnowledgeCategory(BaseModel):
    id = CustomShortUUIDField(primary_key=True, prefix="kbc_")
    name = CustomCharField(
        max_length=120,
        rules=[RequiredRule("name"), UniqueRule("name")],
    )
    slug = CustomCharField(
        max_length=140,
        rules=[RequiredRule("slug"), UniqueRule("slug")],
    )
    description = CustomTextField(nullable=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )

    class Meta(BaseModel.Meta):
        db_table = "kb_categories"
        ordering = ["name"]
        verbose_name = "Knowledge Category"
        verbose_name_plural = "Knowledge Categories"

    def __str__(self):
        return self.name


from apps.knowledgebase.valuesets import (
    ARTICLE_STATUS_VALUESET,
    LINK_TYPE_VALUESET,
)


class KnowledgeArticle(BaseModel):
    class ArticleStatus:
        DRAFT = "DRAFT"
        PUBLISHED = "PUBLISHED"
        ARCHIVED = "ARCHIVED"

    id = CustomShortUUIDField(primary_key=True, prefix="art_")
    title = CustomCharField(
        max_length=200,
        rules=[RequiredRule("title")],
    )
    slug = CustomCharField(
        max_length=220,
        rules=[RequiredRule("slug"), UniqueRule("slug")],
    )
    summary = CustomTextField(nullable=True)
    content = models.TextField(help_text="Markdown or rich text article body")
    category = models.ForeignKey(
        KnowledgeCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="articles",
    )
    author = models.ForeignKey(
        USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="authored_articles",
    )
    status = models.CharField(
        max_length=20,
        choices=ARTICLE_STATUS_VALUESET.as_django_choices(),
        default="PUBLISHED",
    )
    is_internal_only = models.BooleanField(
        default=False,
        help_text="If true, restricted to staff/cashier/procurement roles",
    )
    tags = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    permission_prefix = "kb:article"

    class Meta(BaseModel.Meta):
        db_table = "kb_articles"
        ordering = ["-created_at"]
        verbose_name = "Knowledge Article"
        verbose_name_plural = "Knowledge Articles"

    def __str__(self):
        return self.title


class ProductKnowledgeLink(BaseModel):
    """
    Product, Variant, Inventory, & Category Knowledgebase Linkage.
    Supports foreign key references and direct ID or Slug/SKU string lookups.
    Empowers POS Cashiers (sales pitch, troubleshooting) and Procurement Managers (quality, compliance certs).

    `link_type` is data-driven from the extensible `LINK_TYPE_VALUESET` registry
    (not a hardcoded enum), so product teams can add new knowledge categories
    without redeploying code.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="pkl_")
    article = models.ForeignKey(
        KnowledgeArticle,
        on_delete=models.CASCADE,
        related_name="product_links",
    )

    # Foreign Key References
    product = models.ForeignKey(
        "shop.Product",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="knowledge_links",
    )
    variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="knowledge_links",
    )
    inventory = models.ForeignKey(
        "shop.Inventory",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="knowledge_links",
    )
    shop_category = models.ForeignKey(
        "shop.Category",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="knowledge_links",
    )
    facility = models.ForeignKey(
        "shop.Facility",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="knowledge_links",
        help_text="Facility SOPs, Operating Hours, Access Protocols",
    )
    storage_location = models.ForeignKey(
        "shop.StorageLocation",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="knowledge_links",
        help_text="Storage Bin Hazmat, Max Load Weight, Safety Rules",
    )
    facility_inventory = models.ForeignKey(
        "shop.FacilityInventory",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="knowledge_links",
        help_text="Item-specific Handling Guides, Assembly Docs",
    )

    # Polymorphic GenericForeignKey (GFK) Linkage
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Polymorphic target model e.g. Product, Facility, StorageLocation, FacilityInventory",
    )
    object_id = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        db_index=True,
        help_text="Polymorphic target object primary key ID",
    )
    target_object = GenericForeignKey("content_type", "object_id")

    # String Linkage by ID or Slug/SKU
    target_identifier = models.CharField(
        max_length=150,
        null=True,
        blank=True,
        db_index=True,
        help_text="Direct lookup identifier e.g. Product ID/Slug, Facility Code, Bin Code",
    )

    link_type = models.CharField(
        max_length=40,
        choices=LINK_TYPE_VALUESET.as_django_choices(),
        default="SPEC_SHEET",
    )
    is_active = models.BooleanField(default=True)
    notes = models.CharField(max_length=255, blank=True, null=True)

    class Meta(BaseModel.Meta):
        db_table = "kb_product_knowledge_links"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["target_identifier", "link_type"]),
            models.Index(fields=["content_type", "object_id"]),
        ]
        verbose_name = "Product & Entity Knowledge Link"
        verbose_name_plural = "Product & Entity Knowledge Links"

    def set_target_entity(self, entity):
        """
        Polymorphically attaches any model instance (Product, Facility, StorageLocation, FacilityInventory).
        """
        if entity:
            self.content_type = ContentType.objects.get_for_model(entity)
            self.object_id = str(entity.pk)
            self.target_identifier = str(getattr(entity, "facility_code", getattr(entity, "location_code", getattr(entity, "sku", getattr(entity, "name", entity.pk)))))

    def __str__(self):
        target = self.target_object or self.target_identifier or (
            self.variant.sku if self.variant else (self.product.name if self.product else "Entity/Inventory")
        )
        return f"{self.link_type} for {target} -> {self.article.title}"
