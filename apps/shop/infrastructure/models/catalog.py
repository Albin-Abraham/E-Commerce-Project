from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from core.base_models.fields.boolean_fields import CustomBooleanField
from core.base_models.fields.char_fields import CustomCharField, CustomTextField
from core.base_models.fields.numeric_fields import CustomDecimalField
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.scoping_models import TenantModelMixin
from core.base_models.validator_model import BaseModel
from core.base_models.validators.rules import RequiredRule, UniqueRule


class Catalog(BaseModel, TenantModelMixin):
    """
    Catalog Domain Entity.
    Represents a contextual published catalog (e.g. Primary Web Storefront, B2B Portal, Seasonal Promo Catalog).
    """

    id = CustomShortUUIDField(primary_key=True, prefix="catg_")
    name = CustomCharField(
        max_length=150,
        rules=[RequiredRule("name")],
    )
    code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("code"), UniqueRule("code")],
    )
    slug = CustomCharField(
        max_length=180,
        blank=True,
        default="",
        rules=[UniqueRule("slug")],
    )
    description = CustomTextField(nullable=True)
    is_active = CustomBooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    permission_prefix = "shop:catalog"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "shop_catalogs"
        ordering = ["name"]
        verbose_name = "Catalog"
        verbose_name_plural = "Catalogs"

    def _override_pre_save(self, is_creating: bool):
        if not self.slug and self.name:
            self.slug = slugify(self.name)

    def __str__(self):
        return f"{self.name} ({self.code})"


class CatalogItem(BaseModel, TenantModelMixin):
    """
    CatalogItem Domain Entity.
    Binds a canonical Master Product/Variant to a Catalog context.
    Allows presentation overrides, price channel rules, and special curation badges (New Arrivals, Budget Friendly).
    """

    id = CustomShortUUIDField(primary_key=True, prefix="cli_")
    catalog = models.ForeignKey(
        Catalog,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "shop.Product",
        on_delete=models.CASCADE,
        related_name="catalog_items",
    )
    variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="catalog_items",
    )

    # Contextual presentation overrides
    override_name = CustomCharField(max_length=200, blank=True, default="")
    override_price = CustomDecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # Badges and Curation Flags
    is_new_arrival = CustomBooleanField(default=False)
    is_budget_friendly = CustomBooleanField(default=False)
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Dynamic curation tags e.g. ['NEW_ARRIVALS', 'BUDGET_FRIENDLY', 'TRENDING']",
    )
    is_published = CustomBooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)

    permission_prefix = "shop:catalog_item"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "shop_catalog_items"
        ordering = ["sort_order", "-created_at"]
        verbose_name = "Catalog Item"
        verbose_name_plural = "Catalog Items"
        unique_together = [["catalog", "product", "variant"]]

    @property
    def display_name(self) -> str:
        if self.override_name:
            return self.override_name
        return self.product.name if self.product else ""

    @property
    def effective_price(self):
        if self.override_price is not None:
            return self.override_price
        if self.variant and self.variant.price is not None:
            return self.variant.price
        return self.product.price if self.product else 0

    def __str__(self):
        return f"{self.display_name} [{self.catalog.code}]"


class CatalogCollection(BaseModel, TenantModelMixin):
    """
    CatalogCollection Domain Entity.
    Curated or auto-filtered collection of CatalogItems (e.g. New Arrivals, Budget Friendly, Featured, Seasonal).
    """

    class CollectionType(models.TextChoices):
        NEW_ARRIVALS = "NEW_ARRIVALS", "New Arrivals"
        BUDGET_FRIENDLY = "BUDGET_FRIENDLY", "Budget Friendly"
        FEATURED = "FEATURED", "Featured"
        SEASONAL = "SEASONAL", "Seasonal"
        CLEARANCE = "CLEARANCE", "Clearance"
        CUSTOM = "CUSTOM", "Custom"

    id = CustomShortUUIDField(primary_key=True, prefix="col_")
    catalog = models.ForeignKey(
        Catalog,
        on_delete=models.CASCADE,
        related_name="collections",
    )
    name = CustomCharField(
        max_length=150,
        rules=[RequiredRule("name")],
    )
    slug = CustomCharField(
        max_length=180,
        blank=True,
        default="",
        rules=[UniqueRule("slug")],
    )
    collection_type = CustomCharField(
        max_length=50,
        choices=CollectionType.choices,
        default=CollectionType.CUSTOM,
    )
    max_budget_price = CustomDecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Upper price limit threshold for BUDGET_FRIENDLY collections",
    )
    items = models.ManyToManyField(
        CatalogItem,
        blank=True,
        related_name="collections",
    )
    is_active = CustomBooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    permission_prefix = "shop:catalog_collection"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "shop_catalog_collections"
        ordering = ["name"]
        verbose_name = "Catalog Collection"
        verbose_name_plural = "Catalog Collections"

    def _override_pre_save(self, is_creating: bool):
        if not self.slug and self.name:
            self.slug = slugify(self.name)

    def get_effective_items(self):
        """
        Returns queryset of CatalogItems matching collection criteria (manual + dynamic rules + GFK EntityTags).
        """
        qs = CatalogItem.objects.filter(catalog=self.catalog, is_published=True)
        ct = ContentType.objects.get_for_model(CatalogItem)
        gfk_tagged_ids = EntityTag.objects.filter(
            content_type=ct,
            tag_definition__code__iexact=self.collection_type,
        ).values_list("object_id", flat=True)

        if self.collection_type == self.CollectionType.NEW_ARRIVALS:
            return qs.filter(
                models.Q(is_new_arrival=True)
                | models.Q(tags__icontains="NEW_ARRIVALS")
                | models.Q(id__in=list(gfk_tagged_ids))
            )
        elif self.collection_type == self.CollectionType.BUDGET_FRIENDLY:
            filter_qs = qs.filter(
                models.Q(is_budget_friendly=True)
                | models.Q(tags__icontains="BUDGET_FRIENDLY")
                | models.Q(id__in=list(gfk_tagged_ids))
            )
            if self.max_budget_price is not None:
                filter_qs = filter_qs.filter(
                    models.Q(override_price__lte=self.max_budget_price)
                    | models.Q(
                        override_price__isnull=True, product__price__lte=self.max_budget_price
                    )
                )
            return filter_qs
        return self.items.filter(is_published=True)

    def __str__(self):
        return f"{self.name} ({self.get_collection_type_display()})"


class CatalogPublication(BaseModel, TenantModelMixin):
    """
    CatalogPublication Domain Entity.
    Defines target sales publication channels (Website, Mobile App, WhatsApp, Marketplace, B2B Portal).
    """

    class Channel(models.TextChoices):
        WEBSITE = "WEBSITE", "Website Storefront"
        MOBILE_APP = "MOBILE_APP", "Mobile App"
        WHATSAPP = "WHATSAPP", "WhatsApp Commerce"
        MARKETPLACE = "MARKETPLACE", "External Marketplace"
        B2B_PORTAL = "B2B_PORTAL", "B2B Portal"

    id = CustomShortUUIDField(primary_key=True, prefix="pub_")
    catalog = models.ForeignKey(
        Catalog,
        on_delete=models.CASCADE,
        related_name="publications",
    )
    channel = CustomCharField(
        max_length=50,
        choices=Channel.choices,
        default=Channel.WEBSITE,
    )
    published_at = models.DateTimeField(null=True, blank=True)
    is_active = CustomBooleanField(default=True)

    permission_prefix = "shop:catalog_publication"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "shop_catalog_publications"
        ordering = ["-published_at"]
        verbose_name = "Catalog Publication"
        verbose_name_plural = "Catalog Publications"
        unique_together = [["catalog", "channel"]]

    def publish(self):
        self.published_at = timezone.now()
        self.is_active = True
        self.save()

    def __str__(self):
        return f"{self.catalog.name} -> {self.get_channel_display()}"


class TagDefinition(BaseModel, TenantModelMixin):
    """
    Catalog & Master Tag Definition Entity.
    Centralized definition of commercial and presentation tags (New Arrivals, Budget Friendly, Trending, etc.).
    """

    id = CustomShortUUIDField(primary_key=True, prefix="tagdef_")
    code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("code"), UniqueRule("code")],
    )
    name = CustomCharField(
        max_length=100,
        rules=[RequiredRule("name")],
    )
    badge_label = CustomCharField(max_length=50, blank=True, default="")
    badge_color = CustomCharField(max_length=20, default="#000000")
    icon_url = models.URLField(blank=True, null=True)
    is_active = CustomBooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    permission_prefix = "shop:tag_definition"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "shop_tag_definitions"
        ordering = ["name"]
        verbose_name = "Tag Definition"
        verbose_name_plural = "Tag Definitions"

    def __str__(self):
        return f"{self.name} [{self.code}]"


class EntityTag(BaseModel, TenantModelMixin):
    """
    Polymorphic Tag Assignment.
    Attaches a TagDefinition to any domain entity (CatalogItem, Product, Category, Brand) using GenericForeignKey.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="etag_")
    tag_definition = models.ForeignKey(
        TagDefinition,
        on_delete=models.CASCADE,
        related_name="assignments",
    )

    # Generic Foreign Key to target object
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = CustomCharField(max_length=50)
    content_object = GenericForeignKey("content_type", "object_id")

    # Temporal visibility windows
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)

    permission_prefix = "shop:entity_tag"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "shop_entity_tags"
        verbose_name = "Entity Tag"
        verbose_name_plural = "Entity Tags"
        unique_together = [["tag_definition", "content_type", "object_id"]]

    def is_currently_active(self) -> bool:
        now = timezone.now()
        if self.start_date and now < self.start_date:
            return False
        if self.end_date and now > self.end_date:
            return False
        return self.tag_definition.is_active

    def __str__(self):
        return f"{self.tag_definition.code} -> {self.content_type.model}:{self.object_id}"
