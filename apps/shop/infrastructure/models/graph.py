from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField


from apps.shop.valuesets import HARD_RELATION_VALUESET, SOFT_RELATION_VALUESET


class EntityEdge(BaseModel):
    """
    Knowledge Graph Ontology Edge Model.
    Supports hard structural relations and soft behavioral/recommendation relations.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="edg_")

    # Source Entity (Product, Category, Supplier, Customer, Seller)
    source_content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, related_name="source_graph_edges"
    )
    source_object_id = models.CharField(max_length=50)
    source_object = GenericForeignKey("source_content_type", "source_object_id")

    # Target Entity (Product, Category, Supplier, Customer, Seller)
    target_content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, related_name="target_graph_edges"
    )
    target_object_id = models.CharField(max_length=50)
    target_object = GenericForeignKey("target_content_type", "target_object_id")

    relation_type = models.CharField(
        max_length=60,
        help_text="Controlled relation type e.g., 'bought_with', 'compatible_with', 'supplied_by'"
    )
    weight = models.FloatField(default=1.0, help_text="Relation strength score between 0.0 and 1.0+")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "shop_entity_edges"
        indexes = [
            models.Index(fields=["source_content_type", "source_object_id"]),
            models.Index(fields=["target_content_type", "target_object_id"]),
            models.Index(fields=["relation_type"]),
        ]
        verbose_name = "Entity Graph Edge"
        verbose_name_plural = "Entity Graph Edges"

    def __str__(self):
        return f"{self.source_object} --[{self.relation_type}]--> {self.target_object}"


class BOMEdge(BaseModel):
    """
    Bill of Materials (BOM) DAG Graph Model.
    Allows reusable product components (e.g. SSD inside Laptop, PC, and Server).
    """
    id = CustomShortUUIDField(primary_key=True, prefix="bom_")

    parent_variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.CASCADE,
        related_name="bom_children",
        help_text="Assembly product variant",
    )
    child_variant = models.ForeignKey(
        "shop.ProductVariant",
        on_delete=models.CASCADE,
        related_name="bom_parents",
        help_text="Component product variant",
    )
    quantity = models.DecimalField(
        max_digits=10, decimal_places=3, default=1.0, help_text="Quantity of child required per parent"
    )
    unit = models.CharField(max_length=30, default="pcs", help_text="Unit of measurement, e.g. pcs, kg, ml")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "shop_bom_edges"
        unique_together = ["parent_variant", "child_variant"]
        verbose_name = "BOM Edge"
        verbose_name_plural = "BOM Edges"

    def __str__(self):
        return f"{self.parent_variant.sku} contains {self.quantity} {self.unit} of {self.child_variant.sku}"
