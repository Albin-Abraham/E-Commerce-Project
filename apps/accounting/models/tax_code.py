"""Tax codes.

A ``TaxCode`` is the fiscal identity of a tax under a jurisdiction — federal,
state (or emirate/province) and municipal VAT are each their own code. The code
is also the chargeable atom: it carries the charged ``rate``, the GL ``account``,
inclusiveness and validity, so no extra component layer is needed. Tax packs
compose codes into per-branch/country structures.
"""

from django.db import models

from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.numeric_fields import CustomDecimalField
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.validator_model import BaseModel
from core.base_models.validators.rules import RequiredRule, UniqueRule

from apps.accounting.models.tax import TAX_CATEGORY_VALUESET
from apps.accounting.valuesets import TAX_JURISDICTION_VALUESET


class TaxCode(BaseModel):
    """Fiscal identity + chargeable slice of a tax under one jurisdiction."""

    id = CustomShortUUIDField(primary_key=True, prefix="tcode_")
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="tax_codes",
    )
    code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("code"), UniqueRule("code", extra_filters={"company": "company"})],
        help_text="Fiscal / internal tax code, e.g. FED_VAT_AE_5, STATE_CA_4_5, MUNI_1_5",
    )
    title = CustomCharField(
        max_length=150,
        rules=[RequiredRule("title")],
        help_text="e.g. UAE Federal VAT, California State Sales Tax, Dubai Municipality Fee",
    )
    description = models.TextField(blank=True)
    tax_type = models.CharField(
        max_length=30,
        choices=TAX_CATEGORY_VALUESET.as_django_choices(),
        default="VAT",
        help_text="Tax regime classification of this code",
    )
    jurisdiction = models.CharField(
        max_length=30,
        choices=TAX_JURISDICTION_VALUESET.as_django_choices(),
        default="FEDERAL",
        help_text="Federal / State / Local (municipal) authority that levies this tax",
    )
    country_code = models.CharField(
        max_length=2,
        blank=True,
        default="",
        help_text="ISO-3166 alpha-2 country of the levying authority, e.g. AE / US / IN",
    )
    rate = CustomDecimalField(
        max_digits=6,
        decimal_places=3,
        default=0,
        help_text="Charged percentage rate, e.g. 18.000",
    )
    account = models.ForeignKey(
        "accounting.Account",
        on_delete=models.PROTECT,
        related_name="tax_codes",
        help_text="GL tax payable account credited when this code is charged",
    )
    is_inclusive = models.BooleanField(
        default=False,
        help_text="If true, item prices already include this code's tax",
    )
    is_compound = models.BooleanField(
        default=False,
        help_text="True when this tax stacks on top of other taxes (tax on tax)",
    )
    is_recoverable = models.BooleanField(
        default=True,
        help_text="True when input tax can be reclaimed (credit eligible)",
    )
    is_active = models.BooleanField(default=True)
    valid_from = models.DateField(null=True, blank=True)
    valid_to = models.DateField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    permission_prefix = "accounting:tax_code"

    class Meta(BaseModel.Meta):
        db_table = "accounting_tax_codes"
        ordering = ["country_code", "jurisdiction", "code"]
        indexes = [
            models.Index(fields=["country_code", "jurisdiction"], name="tax_code_jur_idx"),
        ]
        verbose_name = "Tax Code"
        verbose_name_plural = "Tax Codes"

    def __str__(self):
        inclusive = " (inclusive)" if self.is_inclusive else ""
        location = f" {self.country_code}" if self.country_code else ""
        return f"{self.code} ({self.jurisdiction}{location}) {self.rate}%{inclusive}"