from django.db import models
from core.base_models.validator_model import BaseModel
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.fields.char_fields import CustomCharField
from core.base_models.validators.rules import RequiredRule, UniqueRule


class FiscalYear(BaseModel):
    """
    Fiscal Year management for financial periods and year-end closing.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="fy_")
    year_name = CustomCharField(
        max_length=50,
        rules=[RequiredRule("year_name")],
        help_text="e.g. FY 2026",
    )
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="fiscal_years",
    )
    start_date = models.DateField()
    end_date = models.DateField()
    is_closed = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        db_table = "accounting_fiscal_years"
        ordering = ["-start_date"]
        verbose_name = "Fiscal Year"
        verbose_name_plural = "Fiscal Years"
        unique_together = [("company", "year_name")]

    def __str__(self):
        return f"{self.year_name} ({self.start_date} to {self.end_date})"


class CostCenter(BaseModel):
    """
    Cost Center / Profit Center for branch, department, or project financial tracking.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="cc_")
    cost_center_code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("cost_center_code")],
    )
    cost_center_name = CustomCharField(
        max_length=200,
        rules=[RequiredRule("cost_center_name")],
    )
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="cost_centers",
    )
    branch = models.ForeignKey(
        "core_admin.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cost_centers",
    )
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "accounting_cost_centers"
        ordering = ["cost_center_code"]
        verbose_name = "Cost Center"
        verbose_name_plural = "Cost Centers"
        unique_together = [("company", "cost_center_code")]

    def __str__(self):
        return f"{self.cost_center_code} - {self.cost_center_name}"
