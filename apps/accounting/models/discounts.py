from decimal import Decimal

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models

from core.base_models.fields.char_fields import CustomCharField
from core.base_models.fields.numeric_fields import CustomDecimalField
from core.base_models.fields.short_ui_fields import CustomShortUUIDField
from core.base_models.validator_model import BaseModel
from core.base_models.validators.rules import RequiredRule, UniqueRule

from apps.accounting.services.operator_registry import OperatorRegistry
from apps.accounting.valuesets import (
    DISCOUNT_OPERATOR_VALUESET,
    DISCOUNT_TYPE_VALUESET,
)


class DiscountConditionItem(BaseModel):
    """
    One condition inside a DiscountConfiguration.

    Each condition references an attribute source through a GenericForeignKey
    (e.g. a Gender, Customer Segment, Product, or Category master record),
    names the runtime attribute via ``field_key`` (e.g. "gender" or "age"),
    and declares the operator -> value/value_to -> percentage mapping:

        gender EQUAL_TO "Female"        -> 10%
        age    GREATER_THAN "60"        -> 15%
        age    BETWEEN "21" and "30"    ->  5%
    """

    id = CustomShortUUIDField(primary_key=True, prefix="dcond_")
    configuration = models.ForeignKey(
        "accounting.DiscountConfiguration",
        on_delete=models.CASCADE,
        related_name="conditions",
    )
    field_key = CustomCharField(
        max_length=100,
        rules=[RequiredRule("field_key")],
        help_text="Runtime attribute name evaluated on the target, e.g. gender, age, loyalty_tier",
    )
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Generic FK to the attribute source entity (Gender, Segment, Category, Product)",
    )
    object_id = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    target_document = GenericForeignKey("content_type", "object_id")

    operator = models.CharField(
        max_length=30,
        choices=DISCOUNT_OPERATOR_VALUESET.as_django_choices(),
        default="EQUAL_TO",
    )
    value = models.CharField(
        max_length=120,
        blank=True,
        default="",
        help_text="Comparison value 1 (e.g. \"Female\", 21, \"Gold\")",
    )
    value_to = models.CharField(
        max_length=120,
        blank=True,
        default="",
        help_text="Comparison value 2 for BETWEEN / range operators (e.g. greater than 1, less than 2)",
    )
    percentage = CustomDecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Discount percentage awarded when the condition matches",
    )
    fixed_amount = CustomDecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Fixed discount amount awarded when the condition matches (FIXED_AMOUNT configs)",
    )
    position = models.PositiveIntegerField(default=0, help_text="Order of the condition inside its array")
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "accounting_discount_conditions"
        ordering = ["position", "created_at"]
        indexes = [
            models.Index(fields=["configuration", "field_key"], name="disc_cond_key_idx"),
            models.Index(fields=["content_type", "object_id"], name="disc_cond_target_idx"),
        ]
        verbose_name = "Discount Condition"
        verbose_name_plural = "Discount Conditions"

    def __str__(self):
        return f"{self.field_key} {self.operator} {self.value}{'..' + self.value_to if self.value_to else ''} -> {self.percentage}%"

    def _override_pre_save(self, is_creating: bool):
        """
        Validates the operand contract for the linked operator before saving:
        the operator must be registered and it must receive the linkage objects
        its comparator consumes (equal-to value, and value 1 / value 2 ranges).
        """
        OperatorRegistry.validate_operator(self.operator)
        OperatorRegistry.validate_operands(self.operator, self.value, self.value_to)

    def matches(self, attributes: dict) -> bool:
        """
        Evaluates the runtime ``attributes`` dict against this condition by
        delegating to the comparator object its operator links to in the
        OperatorRegistry. Numeric values compare numerically; otherwise string.
        """
        if not self.is_active:
            return False
        if self.field_key not in attributes:
            return False
        comparator = OperatorRegistry.comparator(self.operator)
        if comparator is None:
            return False
        return comparator(attributes[self.field_key], self.value, self.value_to)


class DiscountTaxItem(BaseModel):
    """
    Tax item linked to a discount configuration.
    ``tax_item_key`` is a short primary key of an accounting.ItemTaxTemplate,
    materialized through the ``item_tax_template`` foreign key.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="dtax_")
    configuration = models.ForeignKey(
        "accounting.DiscountConfiguration",
        on_delete=models.CASCADE,
        related_name="taxes",
    )
    item_tax_template = models.ForeignKey(
        "accounting.ItemTaxTemplate",
        on_delete=models.PROTECT,
        related_name="discount_tax_items",
        help_text="Item tax template the discount applies through",
    )
    position = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        db_table = "accounting_discount_taxes"
        ordering = ["position", "created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["configuration", "item_tax_template"],
                name="unique_discount_tax_item",
            )
        ]
        verbose_name = "Discount Tax Item"
        verbose_name_plural = "Discount Tax Items"

    def __str__(self):
        return f"{self.item_tax_template.title} on {self.configuration.code}"


class DiscountConfiguration(BaseModel):
    """
    Reusable discount + configuration master.

    * ``is_global=True`` -> system-managed discount applied globally; conditions
      and taxes may be attached later or derive from the linked entity.
    * ``is_global=False`` -> manual discount: the caller passes the ``conditions``
      and ``taxes`` arrays explicitly (see ``manual_configure``); the raw arrays
      are snapshotted in ``conditions_payload`` / ``taxes_payload`` and each item
      is materialized as a ``DiscountConditionItem`` / ``DiscountTaxItem`` row.
    """

    id = CustomShortUUIDField(primary_key=True, prefix="dcfg_")
    company = models.ForeignKey(
        "core_admin.Company",
        on_delete=models.CASCADE,
        related_name="discount_configurations",
    )
    code = CustomCharField(
        max_length=50,
        rules=[RequiredRule("code"), UniqueRule("code", extra_filters={"company": "company"})],
        help_text="Unique discount configuration code per company e.g. LADIES_10, SENIOR_15",
    )
    title = CustomCharField(
        max_length=150,
        rules=[RequiredRule("title")],
    )
    description = models.TextField(blank=True)
    discount_type = models.CharField(
        max_length=30,
        choices=DISCOUNT_TYPE_VALUESET.as_django_choices(),
        default="PERCENTAGE",
    )
    is_global = models.BooleanField(
        default=False,
        help_text="True = global/system-managed; False = manual with explicit condition and tax arrays",
    )
    is_active = models.BooleanField(default=True)
    conditions_payload = models.JSONField(
        default=list,
        blank=True,
        help_text="Snapshot of the manually passed conditions array (manual discounts)",
    )
    taxes_payload = models.JSONField(
        default=list,
        blank=True,
        help_text="Snapshot of the manually passed tax item keys array (manual discounts)",
    )
    metadata = models.JSONField(default=dict, blank=True)

    permission_prefix = "accounting:discount"

    class Meta(BaseModel.Meta):
        db_table = "accounting_discount_configurations"
        ordering = ["-created_at"]
        verbose_name = "Discount Configuration"
        verbose_name_plural = "Discount Configurations"

    def __str__(self):
        mode = "Global" if self.is_global else "Manual"
        return f"{self.title} ({self.code}) [{mode}]"

    # ------------------------------------------------------------- factories

    @classmethod
    def create_global(cls, company, code, title, **overrides):
        """System-managed global discount configuration (no manual arrays)."""
        return cls.objects.create(
            company=company,
            code=code,
            title=title,
            is_global=True,
            **overrides,
        )

    @classmethod
    def manual_configure(
        cls,
        company,
        code,
        title,
        conditions,
        taxes,
        **overrides,
    ):
        """
        Manually sets up a discount by passing explicit ``conditions`` and
        ``taxes`` arrays of item keys. Each condition entry supports:

            {
                "field_key": "gender",                  # required, runtime attribute name
                "target": <model instance>,              # optional GFK source entity
                "operator": "GREATER_THAN",              # optional, default EQUAL_TO
                "value": "21",                           # comparison value 1
                "value_to": "30",                        # comparison value 2 (BETWEEN)
                "percentage": 5.00,                      # discount percentage
                "fixed_amount": 0.00,                    # optional fixed amount
                "position": 0,                           # optional ordering
                "is_active": True,
            }

        ``taxes`` is a list of ItemTaxTemplate keys (short PKs) or instances.
        """
        if not conditions or not taxes:
            raise ValidationError(
                "Manual discounts require explicit 'conditions' and 'taxes' arrays"
            )

        payload_entries = []
        for entry in conditions:
            snapshot = dict(entry)
            snapshot.pop("target", None)
            payload_entries.append(snapshot)

        configuration = cls.objects.create(
            company=company,
            code=code,
            title=title,
            is_global=False,
            conditions_payload=payload_entries,
            taxes_payload=taxes,
            **overrides,
        )

        for index, entry in enumerate(conditions):
            if not isinstance(entry, dict) or "field_key" not in entry:
                raise ValidationError(
                    f"Each condition entry requires a 'field_key': {entry}"
                )
            item = DiscountConditionItem(
                configuration=configuration,
                field_key=entry["field_key"],
                operator=entry.get("operator", "EQUAL_TO"),
                value=entry.get("value", ""),
                value_to=entry.get("value_to", ""),
                percentage=entry.get("percentage", 0),
                fixed_amount=entry.get("fixed_amount", 0),
                position=entry.get("position", index),
                is_active=entry.get("is_active", True),
            )
            target = entry.get("target")
            if target is not None:
                item.content_type = ContentType.objects.get_for_model(target)
                item.object_id = str(target.pk)
            item.save()

        for index, tax_key in enumerate(taxes):
            template = cls._resolve_tax_template(tax_key)
            DiscountTaxItem.objects.create(
                configuration=configuration,
                item_tax_template=template,
                position=index,
            )

        return configuration

    @staticmethod
    def _resolve_tax_template(tax_key):
        from apps.accounting.models.tax import ItemTaxTemplate

        if isinstance(tax_key, ItemTaxTemplate):
            return tax_key
        pk = tax_key
        if isinstance(tax_key, dict):
            pk = tax_key.get("key") or tax_key.get("template_key") or tax_key.get("id") or tax_key.get("pk")
        if not pk:
            raise ValidationError(f"Invalid tax item key: {tax_key}")
        try:
            return ItemTaxTemplate.objects.get(pk=pk)
        except ItemTaxTemplate.DoesNotExist:
            raise ValidationError(f"Unknown item tax template key: {tax_key}")

    # -------------------------------------------------------------- runtime

    def evaluate(self, attributes: dict) -> dict:
        """
        Evaluates all active conditions against the runtime ``attributes`` dict.

        Returns the highest matching percentage (and its fixed amount) plus the
        linked tax template keys:

            {"matched": bool, "percentage": Decimal, "fixed_amount": Decimal,
             "matched_conditions": [..ids], "tax_template_ids": [..]}
        """
        percentage = Decimal("0")
        fixed_amount = Decimal("0")
        matched = []

        for condition in self.conditions.filter(is_active=True).order_by("position"):
            if condition.matches(attributes):
                matched.append(str(condition.pk))
                if condition.percentage > percentage:
                    percentage = condition.percentage
                if condition.fixed_amount > fixed_amount:
                    fixed_amount = condition.fixed_amount

        return {
            "matched": bool(matched),
            "percentage": percentage,
            "fixed_amount": fixed_amount,
            "matched_conditions": matched,
            "tax_template_ids": list(
                self.taxes.filter(is_active=True).values_list("item_tax_template_id", flat=True)
            ),
        }

    def discount_amount_for(self, basis, attributes: dict) -> Decimal:
        """Computes the discount amount against a subtotal ``basis`` for the given attributes."""
        result = self.evaluate(attributes)
        if not result["matched"]:
            return Decimal("0.00")
        if self.discount_type == "FIXED_AMOUNT":
            return result["fixed_amount"]
        return (Decimal(str(basis)) * result["percentage"] / Decimal("100")).quantize(Decimal("0.01"))