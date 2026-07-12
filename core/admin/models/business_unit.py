# core/admin/models/business_unit.py
from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.scoping_models import TenantModelMixin
from core.base_models.validators.rules import RequiredRule, MinRule, UniqueRule
from core.base_models.fields import CustomCharField, CustomShortUUIDField

class BusinessUnit(BaseModel, TenantModelMixin):
    """
    Industrialized Business Unit Model.
    Represents a logical division (e.g., Healthcare, Retail, Finance) within a Company.
    
    Scoped to a Company via TenantModelMixin.
    """
    id = CustomShortUUIDField(
        prefix="",
        month=False,
        day=False,
        year=False,
        unique=True,
        primary_key=True,
        editable=False,
        auto=True
    )
    name = CustomCharField(rules=[
        RequiredRule("name"), 
        MinRule("name", 3), 
        UniqueRule("name", extra_filters={"company": "company"})
    ])
    code = CustomCharField(
        max_length=20,
        rules=[
            RequiredRule("code"),
            UniqueRule("code", extra_filters={"company": "company"})
        ]
    )
    description = models.TextField(blank=True, null=True)
    is_all_bu = models.BooleanField(default=False, editable=False, help_text="System flag for the global all-encompassing BU.")
    
    class Meta:
        db_table = "company_business_units"
        ordering = ["company", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "name"],
                name="unique_bu_per_company",
            )
        ]
        verbose_name = "Business Unit"
        verbose_name_plural = "Business Units"

    def __str__(self):
        return f"{self.name} ({self.code})"
