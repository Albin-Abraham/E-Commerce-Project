"""Tax packs: branch/country-scoped structures that compose tax codes.

Different branches ship from different countries, and different countries apply
different taxes. A ``TaxRatePack`` is a *structure*: its ``TaxPackCode`` links
bundle the chargeable ``TaxCode`` atoms (federal / state / municipal) under a
branch + country, so callers resolve the right tax set by passing their branch:

    TaxRatePack.resolve(company=company, branch=branch, direction="SALES")

The pack remains interface-compatible with the sales/purchase tax templates read
by ``TaxEngineService``: it exposes ``title``, ``is_inclusive`` and a
``tax_lines`` related manager whose rows carry ``tax_name``, ``rate`` and
``account`` (denormalized from the code at linking time, overridable per pack so
the same code can bill differently across branches). ``display()`` renders the
structured group-by-jurisdiction breakdown for documents/invoices.
"""

from collections import OrderedDict
from decimal import Decimal

from django.db import models

from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.validator_model import BaseModel
from core.base_models.validators.rules import RequiredRule, UniqueRule

from apps.accounting.models.tax import TAX_CATEGORY_VALUESET
from apps.accounting.valuesets import (
    TAX_PACK_DIRECTION_VALUESET,
    TAX_PACK_GROUP_VALUESET,
)


class TaxRatePack(BaseModel):
    """Named bundle of tax codes scoped to a company (and optionally branch/country)."""

    id = CustomShortUUIDField(primary_key=True, prefix="tpk_")
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="tax_rate_packs",
    )
    branch = models.ForeignKey(
        "core_admin.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tax_rate_packs",
        help_text="Branch the pack applies to; literal `None` = company-wide fallback",
    )
    country_code = models.CharField(
        max_length=2,
        blank=True,
        default="",
        help_text="ISO-3166 alpha-2 country the branch ships from, e.g. AE / US / IN",
    )
    code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("code"), UniqueRule("code", extra_filters={"company": "company"})],
        help_text="Unique tax pack code per company, e.g. AE_VAT_18, US_SF_SALES_TAX",
    )
    title = CustomCharField(
        max_length=150,
        rules=[RequiredRule("title")],
        help_text="e.g. UAE Standard VAT 18%, California Sales Tax 7.25%",
    )
    direction = models.CharField(
        max_length=30,
        choices=TAX_PACK_DIRECTION_VALUESET.as_django_choices(),
        default="BOTH",
    )
    tax_category = models.CharField(
        max_length=30,
        choices=TAX_CATEGORY_VALUESET.as_django_choices(),
        default="VAT",
    )
    is_inclusive = models.BooleanField(
        default=False,
        help_text="If true, item prices already include this pack's tax amounts",
    )
    is_default = models.BooleanField(
        default=False,
        help_text="Preferred pack for this company when none matches the branch",
    )
    currency = models.ForeignKey(
        "accounting.Currency",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tax_rate_packs",
    )
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)

    permission_prefix = "accounting:tax_pack"

    class Meta(BaseModel.Meta):
        db_table = "accounting_tax_rate_packs"
        ordering = ["country_code", "code"]
        verbose_name = "Tax Rate Pack"
        verbose_name_plural = "Tax Rate Packs"

    def __str__(self):
        location = self.country_code or (self.branch.code if self.branch_id else "ALL")
        return f"{self.title} [{location}]"

    # ------------------------------------------------------------ selection

    @classmethod
    def resolve(cls, company, branch=None, direction=None, active_only=True):
        """
        Resolves the tax pack that applies to ``company`` under the given
        ``branch`` (different branches/countries differ). Branch-specific packs
        win; packs with no branch act as a company-level fallback; ``is_default``
        breaks ties.
        """
        qs = cls.objects.filter(company=company)
        if direction:
            qs = qs.filter(direction__in=[direction, "BOTH"])
        if active_only:
            qs = qs.filter(is_active=True)
        ordered = qs.order_by("-is_default", "-created_at")

        if branch is not None:
            pack = ordered.filter(branch=branch).first()
            if pack is None:
                pack = ordered.filter(branch__isnull=True).first()
            if pack is None:
                pack = ordered.first()
            return pack
        return ordered.first()

    @classmethod
    def resolve_for_country(cls, company, country_code=None, direction=None):
        """Resolves a pack by ISO country code, falling back to a branch-less default."""
        if not country_code:
            return cls.resolve(company=company, direction=direction)
        qs = cls.objects.filter(company=company, country_code=country_code)
        if direction:
            qs = qs.filter(direction__in=[direction, "BOTH"])
        pack = qs.filter(is_active=True).order_by("-is_default", "-created_at").first()
        if pack is not None:
            return pack
        return cls.resolve(company=company, direction=direction)

    # -------------------------------------------------------- composition

    @classmethod
    def from_codes(
        cls,
        company,
        code,
        title,
        codes,
        branch=None,
        country_code="",
        direction="BOTH",
        **overrides,
    ):
        """
        Builds a tax pack by composing chargeable tax codes (easy structuring):

            [
                {"tax_code": federal_vat, "group": "FEDERAL", "position": 0},
                {"tax_code": state_tax,   "group": "STATE",   "position": 1,
                 "rate": 4.750, "is_inclusive": True},        # per-pack override
            ]

        Each ``TaxPackCode`` denormalizes the code's name, rate and account; the
        snapshots make later code edits not silently change historical packs
        unless the pack is rebuilt.
        """
        if not codes:
            from django.core.exceptions import ValidationError
            raise ValidationError("A tax pack requires at least one tax code")

        pack = cls.objects.create(
            company=company,
            code=code,
            title=title,
            branch=branch,
            country_code=country_code,
            direction=direction,
            **overrides,
        )
        for index, entry in enumerate(codes):
            options = dict(entry) if isinstance(entry, dict) else {}
            tax_code = options.pop("tax_code", entry)
            TaxPackCode.objects.create(
                pack=pack,
                code=tax_code,
                tax_name=options.pop("tax_name", tax_code.title),
                rate=options.pop("rate", tax_code.rate),
                account=options.pop("account", tax_code.account),
                group=options.pop("group", "OTHER"),
                position=options.pop("position", index),
                is_inclusive=options.pop("is_inclusive", tax_code.is_inclusive),
                is_active=options.pop("is_active", True),
            )
        return pack

    # -------------------------------------------------------------- display

    def display(self) -> dict:
        """
        Structured tax breakdown for documents and invoices: the pack's lines
        grouped by jurisdiction (FEDERAL / STATE / LOCAL / ...) with a per-group
        rate and the effective total rate.
        """
        lines = list(
            self.tax_lines.filter(is_active=True)
            .select_related("account", "code")
            .order_by("position")
        )
        grouped: "OrderedDict[str, list]" = OrderedDict()
        for line in lines:
            grouped.setdefault(line.group, []).append(line)

        groups = []
        for group, group_lines in grouped.items():
            groups.append(
                {
                    "group": group,
                    "lines": [
                        {
                            "tax_name": line.tax_name,
                            "rate": line.rate,
                            "account_code": line.account.account_code,
                            "is_inclusive": line.is_inclusive,
                            "tax_code": line.code.code,
                        }
                        for line in group_lines
                    ],
                    "group_rate": sum((line.rate for line in group_lines), Decimal("0")),
                }
            )

        return {
            "code": self.code,
            "title": self.title,
            "country_code": self.country_code,
            "direction": self.direction,
            "is_inclusive": self.is_inclusive,
            "total_rate": sum(line.rate for line in lines),
            "groups": groups,
        }


class TaxPackCode(BaseModel):
    """Link between a tax pack and one tax code (engine-compatible tax line)."""

    id = CustomShortUUIDField(primary_key=True, prefix="tpkl_")
    pack = models.ForeignKey(
        TaxRatePack,
        on_delete=models.CASCADE,
        related_name="tax_lines",
    )
    code = models.ForeignKey(
        "accounting.TaxCode",
        on_delete=models.PROTECT,
        related_name="pack_lines",
        help_text="Chargeable tax code structured into this pack",
    )
    tax_name = CustomCharField(max_length=100, rules=[RequiredRule("tax_name")])
    rate = models.DecimalField(
        max_digits=6,
        decimal_places=3,
        help_text="Tax percentage rate charged by this pack line, e.g. 18.000",
    )
    account = models.ForeignKey(
        "accounting.Account",
        on_delete=models.PROTECT,
        related_name="tax_pack_lines",
        help_text="GL Tax Payable account credited for this line",
    )
    group = models.CharField(
        max_length=30,
        choices=TAX_PACK_GROUP_VALUESET.as_django_choices(),
        default="OTHER",
        help_text="Structural group (FEDERAL / STATE / LOCAL / EXEMPT / FEE) for breakdowns",
    )
    is_inclusive = models.BooleanField(
        default=False,
        help_text="Per-pack: whether this code's tax is embedded in prices here",
    )
    position = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    permission_prefix = "accounting:tax_pack"

    class Meta(BaseModel.Meta):
        db_table = "accounting_tax_pack_lines"
        ordering = ["position", "created_at"]
        verbose_name = "Tax Pack Line"
        verbose_name_plural = "Tax Pack Lines"

    def __str__(self):
        return f"{self.tax_name} ({self.rate}%) in {self.pack.code} [{self.group}]"