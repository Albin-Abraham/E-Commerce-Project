# core/admin/models/branch.py
from django.db import models
from django.core.exceptions import ValidationError
from core.base_models.validator_model import BaseModel
from core.base_models.scoping_models import BusinessUnitModelMixin
from core.base_models.validators.rules import RequiredRule, MinRule, UniqueRule, RelationKeyRule
from core.base_models.fields import CustomCharField, CustomDateField, CustomShortUUIDField

class Branch(BaseModel, BusinessUnitModelMixin):
    """
    Industrialized Branch Model.
    Represents an operational unit within a Business Unit (which is within a Company).
    
    Scoped to a Business Unit via BusinessUnitModelMixin.
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
        UniqueRule("name", extra_filters={"business_unit": "business_unit"})
    ])
    code = CustomCharField(
        max_length=20,
        rules=[
            RequiredRule("code"),
            UniqueRule("code", extra_filters={"business_unit": "business_unit"})
        ]
    )
    
    validation_rules = [
        RequiredRule("business_unit"),
        RelationKeyRule("business_unit", {"company": "company"}, error_message="Business Unit must belong to the selected Company")
    ]
    location = CustomCharField()
    opened_date = CustomDateField(rules=[RequiredRule("opened_date")])
    is_all_branch = models.BooleanField(default=False, editable=False, help_text="System flag for the global all-encompassing Branch.")
    
    catalog = models.ForeignKey(
        'users.BranchCatalog',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applied_branches',
        help_text="The subscription tier/catalog applied to this branch"
    )
    
    class Meta: # type: ignore
        db_table = "company_branches"
        ordering = ["company", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "name"],
                name="unique_branch_per_company",
            )
        ]
        verbose_name = "Branch"
        verbose_name_plural = "Branches"

    def clean(self):
        from core.admin.models import Company
        errors = {}

        if not self.business_unit_id:
            errors["business_unit"] = "This field is required."
        elif self.company_id and self.business_unit.company_id != self.company_id:
            errors["business_unit"] = "Business Unit must belong to the selected Company."

        # Validate catalog modules against company subscription
        if self.catalog_id and self.company_id:
            try:
                company = Company.objects.get(id=self.company_id)
                if company.subscription_id:
                    from core.admin.models.subscriptions import Subscription
                    subscription = Subscription.objects.get(id=company.subscription_id)
                    allowed_modules = set(subscription.modules or [])
                    catalog_modules = set(self.catalog.module_keys or [])
                    if catalog_modules and allowed_modules:
                        extra_modules = catalog_modules - allowed_modules
                        if extra_modules:
                            errors["catalog"] = (
                                f"Catalog modules {sorted(extra_modules)} are not "
                                f"covered by the company subscription."
                            )
            except (Company.DoesNotExist, Subscription.DoesNotExist):
                pass

        if errors:
            raise ValidationError(errors)

    def _override_pre_save(self, is_creating: bool):
        self.full_clean()

    def __str__(self):
        return f"{self.name} ({self.code})"

class BranchExtension(BaseModel):
    branch = models.OneToOneField(
        "core_admin.Branch",
        on_delete=models.CASCADE,
        related_name="extensions",
    )
    extra_attributes = models.JSONField(default=dict, blank=True)

    class Meta: # type: ignore
        db_table = "branch_extensions"

    def __str__(self):
        return f"Extensions for {self.branch.name}"
