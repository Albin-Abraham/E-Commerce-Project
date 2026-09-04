from __future__ import annotations

import re
from typing import Final

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.base_models.validator_model import BaseModel


class ResetPolicy(models.TextChoices):
    NEVER = "NEVER", _("Never")
    YEARLY = "YEARLY", _("Yearly")
    MONTHLY = "MONTHLY", _("Monthly")
    DAILY = "DAILY", _("Daily")


class RuleResetPolicy(models.TextChoices):
    INHERIT = "inherit", _("Inherit")
    NEVER = ResetPolicy.NEVER, _("Never")
    YEARLY = ResetPolicy.YEARLY, _("Yearly")
    MONTHLY = ResetPolicy.MONTHLY, _("Monthly")
    DAILY = ResetPolicy.DAILY, _("Daily")


class SequenceSource(models.TextChoices):
    DB = "db", _("Database")
    REDIS = "redis", _("Redis")


class NumberSeriesBase(BaseModel):
    document_type = models.CharField(
        max_length=100,
        db_index=True,
        help_text=_("Logical type identifier, e.g. 'vendor', 'purchase_order'."),
    )

    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="%(class)s_set",
    )

    business_unit = models.ForeignKey(
        "core_admin.BusinessUnit",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="%(class)s_set",
    )

    branch = models.ForeignKey(
        "core_admin.Branch",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="%(class)s_set",
    )

    class Meta:
        abstract = True

    @property
    def scope_specificity(self) -> int:
        return sum(
            1
            for value in (self.company_id, self.business_unit_id, self.branch_id)
            if value
        )

    def clean_scope(self) -> None:
        errors: dict[str, str] = {}

        if self.branch_id and not self.business_unit_id:
            errors["business_unit"] = _(
                "Business unit is required when branch scope is configured."
            )

        if self.business_unit_id and not self.company_id:
            errors["company"] = _(
                "Company is required when business unit scope is configured."
            )

        if self.business_unit_id and self.company_id:
            bu_company_id = getattr(self.business_unit, "company_id", None)
            if bu_company_id and str(bu_company_id) != str(self.company_id):
                errors["business_unit"] = _(
                    "Business unit must belong to the selected company."
                )

        if self.branch_id:
            branch_bu_id = getattr(self.branch, "business_unit_id", None)
            branch_company_id = getattr(
                getattr(self.branch, "business_unit", None), "company_id", None
            )
            if (
                branch_bu_id
                and self.business_unit_id
                and str(branch_bu_id) != str(self.business_unit_id)
            ):
                errors["branch"] = _(
                    "Branch must belong to the selected business unit."
                )
            if (
                branch_company_id
                and self.company_id
                and str(branch_company_id) != str(self.company_id)
            ):
                errors["branch"] = _("Branch must belong to the selected company.")

        if errors:
            raise ValidationError(errors)


class NumberSeries(NumberSeriesBase):
    """
    Stateful DB-backed counter definition for a document scope.
    """

    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="number_series",
    )

    business_unit = models.ForeignKey(
        "core_admin.BusinessUnit",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="number_series",
    )

    branch = models.ForeignKey(
        "core_admin.Branch",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="number_series",
    )

    pattern = models.CharField(
        max_length=255,
        help_text=_(
            "Pattern for generated codes, e.g. 'VEN-{YYYY}{MM}-{SEQ:5}'. "
            "Supported tokens: {YYYY}, {YY}, {MM}, {DD}, {COMPANY_CODE}, {BU_CODE}, {BRANCH_CODE}, {SEQ}, {SEQ:n}."
        ),
    )

    current_number = models.BigIntegerField(
        default=0,
        help_text=_("Last used sequence number for this series."),
    )

    number_length = models.PositiveIntegerField(
        default=5,
        help_text=_(
            "Default zero-padding length for {SEQ} when no explicit length is given."
        ),
    )

    reset_policy = models.CharField(
        max_length=16,
        choices=ResetPolicy.choices,
        default=ResetPolicy.NEVER,
        help_text=_("When to reset the sequence counter."),
    )

    last_reset_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_("Last time the sequence was reset (stored in UTC)."),
    )

    prefix = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text=_("Static string to prepend to the generated number."),
    )

    suffix = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text=_("Static string to append to the generated number."),
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text=_("Whether this number series is currently active."),
    )

    TOKEN_PATTERN: Final[re.Pattern] = re.compile(r"\{([^{}]+)\}")
    VARIABLE_DEFINITIONS: Final[dict[str, str]] = {
        "{YYYY}": _("Current year in 4-digit format (e.g., 2024)."),
        "{YY}": _("Current year in 2-digit format (e.g., 24)."),
        "{MM}": _("Current month in 2-digit format (01-12)."),
        "{DD}": _("Current day in 2-digit format (01-31)."),
        "{SEQ}": _(
            "The sequence number. Will be padded based on the 'Number Length' setting."
        ),
        "{SEQ:n}": _(
            "Sequence number with specific padding of length 'n' (e.g., {SEQ:3} for 001)."
        ),
        "{COMPANY_CODE}": _("The unique code of the current company."),
        "{BU_CODE}": _("The unique code of the current business unit."),
        "{BRANCH_CODE}": _("The unique code of the current branch."),
    }

    ALLOWED_SIMPLE_TOKENS: Final[set[str]] = {
        "YYYY",
        "YY",
        "MM",
        "DD",
        "COMPANY_CODE",
        "BU_CODE",
        "BRANCH_CODE",
    }

    class Meta(BaseModel.Meta):
        db_table = "core_number_series"
        verbose_name = _("Number Series")
        verbose_name_plural = _("Number Series")
        indexes = [
            models.Index(fields=["document_type"]),
            models.Index(fields=["document_type", "company"]),
            models.Index(fields=["document_type", "company", "business_unit"]),
            models.Index(
                fields=["document_type", "company", "business_unit", "branch"]
            ),
        ]

    def __str__(self) -> str:
        scope = "global"
        if self.branch_id:
            scope = f"branch={self.branch_id}"
        elif self.business_unit_id:
            scope = f"business_unit={self.business_unit_id}"
        elif self.company_id:
            scope = f"company={self.company_id}"
        return f"{self.document_type} ({scope})"

    def clean_pattern_logic(self) -> None:
        """Validates that the pattern is valid and sufficient for the reset policy."""
        if not self.pattern:
            raise ValidationError(
                {"pattern": _("Pattern is required for number series.")}
            )

        for match in self.TOKEN_PATTERN.finditer(self.pattern):
            token = match.group(1)
            if token.startswith("SEQ:"):
                length_part = token.split(":", 1)[1]
                if length_part.isdigit():
                    pattern_length = int(length_part)
                    if self.number_length != pattern_length:
                        raise ValidationError(
                            {
                                "number_length": _(
                                    "Number length ({field_val}) must match the sequence length defined in the pattern ({pattern_val})."
                                ).format(
                                    field_val=self.number_length,
                                    pattern_val=pattern_length,
                                )
                            }
                        )
                break

        if "{SEQ" not in self.pattern:
            raise ValidationError(
                {
                    "pattern": _(
                        "Pattern must contain at least one sequence token such as '{SEQ}' or '{SEQ:n}'."
                    )
                }
            )

        for match in self.TOKEN_PATTERN.finditer(self.pattern):
            token = match.group(1)

            if token == "SEQ":
                continue

            if token.startswith("SEQ:"):
                length_part = token.split(":", 1)[1]
                if not length_part.isdigit() or int(length_part) <= 0:
                    raise ValidationError(
                        {
                            "pattern": _(
                                "Invalid sequence token '{token}'. Length must be a positive integer."
                            ).format(token=match.group(0))
                        }
                    )
                continue

            if token not in self.ALLOWED_SIMPLE_TOKENS:
                raise ValidationError(
                    {
                        "pattern": _(
                            "Unsupported token '{token}' in pattern. "
                            "Allowed tokens are {YYYY}, {YY}, {MM}, {DD}, {SEQ}, {SEQ:n}."
                        ).format(token=match.group(0))
                    }
                )

        has_year = "{YYYY}" in self.pattern or "{YY}" in self.pattern
        has_month = "{MM}" in self.pattern
        has_day = "{DD}" in self.pattern

        if self.reset_policy == ResetPolicy.YEARLY and not has_year:
            raise ValidationError(
                {
                    "pattern": _(
                        "Yearly reset policy requires at least a year token ({YYYY} or {YY}) to ensure uniqueness."
                    )
                }
            )
        elif self.reset_policy == ResetPolicy.MONTHLY and not (has_year and has_month):
            raise ValidationError(
                {
                    "pattern": _(
                        "Monthly reset policy requires both year and month tokens to ensure uniqueness."
                    )
                }
            )
        elif self.reset_policy == ResetPolicy.DAILY and not (
            has_year and has_month and has_day
        ):
            raise ValidationError(
                {
                    "pattern": _(
                        "Daily reset policy requires year, month, and day tokens to ensure uniqueness."
                    )
                }
            )

    def clean(self) -> None:
        super().clean()
        self.clean_scope()
        self.clean_pattern_logic()

        duplicate_qs = type(self).objects.filter(
            document_type=self.document_type,
            company_id=self.company_id,
            business_unit_id=self.business_unit_id,
            branch_id=self.branch_id,
        )
        if self.pk:
            duplicate_qs = duplicate_qs.exclude(pk=self.pk)
        if duplicate_qs.exists():
            raise ValidationError(
                {
                    "document_type": _(
                        "A number series already exists for this document type and scope."
                    )
                }
            )

    def _override_pre_save(self, is_creating: bool):
        self.full_clean()

