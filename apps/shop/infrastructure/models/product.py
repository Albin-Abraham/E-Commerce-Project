from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.scoping_models import TenantModelMixin
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.numeric_fields import CustomDecimalField
from core.base_models.fields.boolean_fields import CustomBooleanField
from core.base_models.validators.rules import RequiredRule, UniqueRule, MinRule


from core.base_models.fields.party_mixin import PartyReferenceMixin
from apps.shop.valuesets import PRODUCT_STATUS_VALUESET


class Product(BaseModel, TenantModelMixin, PartyReferenceMixin):
    """
    Core Product Domain Entity.
    Clean relational model preserving strict domain identity.
    Inherits PartyReferenceMixin to link products to vendors/sellers polymorphically.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="prod_")

    sku = CustomCharField(
        max_length=50,
        rules=[
            RequiredRule("sku"),
            UniqueRule("sku"),
        ],
    )
    name = CustomCharField(
        max_length=200,
        rules=[
            RequiredRule("name"),
            MinRule("name", 2),
        ],
    )
    slug = CustomCharField(
        max_length=220,
        rules=[RequiredRule("slug"), UniqueRule("slug")],
    )
    brand = models.ForeignKey(
        "shop.Brand",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    category = models.ForeignKey(
        "shop.Category",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    price = CustomDecimalField(
        max_digits=12,
        decimal_places=2,
        rules=[RequiredRule("price"), MinRule("price", 0)],
    )
    item_tax_template = models.ForeignKey(
        "accounting.ItemTaxTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
        help_text="Product-specific tax rate template overrides",
    )
    status = models.CharField(
        max_length=20,
        choices=PRODUCT_STATUS_VALUESET.as_django_choices(),
        default="ACTIVE",
    )

    is_active = CustomBooleanField(default=True)

    # Dynamic JSONB Layers for Custom System Attributes & Extensions
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Custom runtime attributes and tags",
    )
    extensions = models.JSONField(
        default=dict,
        blank=True,
        help_text="System extensions e.g., {'seo': {...}, 'marketplace': {...}, 'shipping': {...}}",
    )

    permission_prefix = "shop:product"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "shop_products"
        ordering = ["name"]
        verbose_name = "Product"
        verbose_name_plural = "Products"

    def __str__(self):
        return f"{self.name} ({self.sku})"
