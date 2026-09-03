from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.validators.rules import RequiredRule, MinRule, UniqueRule


class Category(BaseModel):
    """
    Category Domain Entity.
    Clean relational model for hierarchy & navigation. Rich descriptions & specs are resolved via Knowledgebase.
    """
    id = CustomShortUUIDField(primary_key=True, prefix="cat_")

    name = CustomCharField(
        max_length=100,
        rules=[
            RequiredRule("name"),
            MinRule("name", 2),
        ],
    )
    slug = CustomCharField(
        max_length=120,
        rules=[RequiredRule("slug"), UniqueRule("slug")],
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )

    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    permission_prefix = "shop:category"
    permission_map = {
        "list": "view",
        "retrieve": "view",
        "create": "create",
        "update": "edit",
        "destroy": "delete",
    }

    class Meta(BaseModel.Meta):
        db_table = "shop_categories"
        ordering = ["name"]
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


from apps.shop.valuesets import CATEGORY_RELATION_TYPE_VALUESET


class CategoryEdge(BaseModel):
    """
    Graph Relationship between Categories.
    Allows DAG & hybrid graph navigation (e.g. cross-sell, seasonal links, related categories).
    """

    from_category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="outgoing_edges",
    )
    to_category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="incoming_edges",
    )
    relation_type = models.CharField(
        max_length=50,
        choices=CATEGORY_RELATION_TYPE_VALUESET.as_django_choices(),
        default="belongs_to",
    )
    weight = models.FloatField(default=1.0)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "shop_category_edges"
        unique_together = ["from_category", "to_category", "relation_type"]
        verbose_name = "Category Edge"
        verbose_name_plural = "Category Edges"

    def __str__(self):
        return f"{self.from_category.name} --[{self.relation_type}]--> {self.to_category.name}"
