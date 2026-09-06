from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase

from core.admin.models.company import Company
from apps.accounting.models.charges import ChargeDefinition, ChargeItem
from apps.accounting.models.chart_of_accounts import Account
from apps.accounting.models.discounts import (
    DiscountConditionItem,
    DiscountConfiguration,
    DiscountTaxItem,
)
from apps.accounting.models.tax import ItemTaxDetail, ItemTaxTemplate
from apps.procurement_pos.models.selling import SalesOrder
from apps.shop.infrastructure.models.brand import Brand


class DiscountsTestCase(TestCase):
    """DiscountConfiguration + condition array + tax item keys across global/manual modes."""

    def _company(self, name):
        return Company.objects.create(name=name, code=name.upper().replace(" ", "-"))

    def _item_tax(self, company, account, rate=5):
        template = ItemTaxTemplate.objects.create(
            title=f"Discount Tax {rate}%",
            company=company,
            tax_category="VAT",
        )
        ItemTaxDetail.objects.create(
            template=template,
            tax_name=f"VAT {rate}%",
            rate=Decimal(str(rate)),
            account=account,
        )
        return template

    def _account(self, company):
        seq = getattr(self, "_seq", 0) + 1
        self._seq = seq
        return Account.objects.create(
            account_code=f"7100-DISC-{seq}",
            account_name=f"Discount Account {seq}",
            company=company,
        )

    # ------------------------------------------------------------- manual

    def test_manual_configure_materializes_condition_and_tax_arrays(self):
        company = self._company("Manual Discount Co")
        account = self._account(company)
        tax_5 = self._item_tax(company, account, rate=5)
        tax_28 = self._item_tax(company, account, rate=28)

        config = DiscountConfiguration.manual_configure(
            company=company,
            code="LADIES_10",
            title="Ladies 10% Weekday",
            conditions=[
                {"field_key": "gender", "operator": "EQUAL_TO", "value": "Female", "percentage": 10},
                {"field_key": "age", "operator": "GREATER_THAN", "value": "60", "percentage": 15},
                {"field_key": "age", "operator": "BETWEEN", "value": "21", "value_to": "30", "percentage": 5},
            ],
            taxes=[str(tax_5.pk), str(tax_28.pk)],
        )

        config.refresh_from_db()
        self.assertFalse(config.is_global)
        self.assertEqual(config.conditions.count(), 3)
        self.assertEqual(config.taxes.count(), 2)

        conditions = list(config.conditions.order_by("position"))
        self.assertEqual(conditions[0].field_key, "gender")
        self.assertEqual(conditions[0].operator, "EQUAL_TO")
        self.assertEqual(conditions[0].value, "Female")
        self.assertEqual(conditions[0].percentage, Decimal("10.00"))
        self.assertEqual(conditions[1].operator, "GREATER_THAN")
        self.assertEqual(conditions[2].value_to, "30")
        self.assertEqual(conditions[2].percentage, Decimal("5.00"))

        tax_keys = list(config.taxes.values_list("item_tax_template_id", flat=True))
        self.assertEqual(set(tax_keys), {tax_5.pk, tax_28.pk}, "tax array item keys materialized")
        self.assertEqual(len(config.conditions_payload), 3, "raw conditions array snapshotted")
        self.assertEqual(len(config.taxes_payload), 2, "raw tax keys array snapshotted")

    def test_manual_configure_requires_explicit_arrays(self):
        company = self._company("Required Arrays Co")
        with self.assertRaises(ValidationError):
            DiscountConfiguration.manual_configure(
                company=company,
                code="MISSING",
                title="Missing arrays",
                conditions=[],
                taxes=[],
            )
        global_config = DiscountConfiguration.create_global(
            company=company,
            code="GLOBAL_OK",
            title="Global fine without arrays",
        )
        self.assertTrue(global_config.is_global)

    def test_manual_condition_supports_gfk_target_entity(self):
        company = self._company("GFK Target Co")
        brand = Brand.objects.create(name="Nike", slug="nike")

        config = DiscountConfiguration.manual_configure(
            company=company,
            code="BRAND_DISC",
            title="Brand Discount",
            conditions=[
                {
                    "field_key": "gender",
                    "operator": "EQUAL_TO",
                    "value": "Female",
                    "percentage": 8,
                    "target": brand,
                },
            ],
            taxes=[str(self._item_tax(company, self._account(company)).pk)],
        )

        condition = DiscountConditionItem.objects.get(configuration=config)
        self.assertEqual(condition.target_document, brand, "condition carries GFK to its source entity")
        self.assertIsNotNone(condition.content_type)
        self.assertEqual(condition.object_id, str(brand.pk))

    def test_code_unique_per_company_rule(self):
        company_a = self._company("Scope A Co")
        company_b = self._company("Scope B Co")
        tax = self._item_tax(company_a, self._account(company_a))
        DiscountConfiguration.manual_configure(
            company=company_a, code="SAME", title="A", conditions=[{"field_key": "age", "value": "21", "percentage": 5}],
            taxes=[str(tax.pk)],
        )
        rules = DiscountConfiguration(company=company_a, code="SAME")._rules.get("code", [])
        unique = [r for r in rules if r.__class__.__name__ == "UniqueRule"]
        self.assertTrue(unique)
        self.assertFalse(unique[0].check(DiscountConfiguration(company=company_a, code="SAME")))
        self.assertTrue(unique[0].check(DiscountConfiguration(company=company_b, code="SAME")))

    # ----------------------------------------------------------- operators

    def test_equality_and_relational_operators(self):
        company = self._company("Operators Co")
        config = DiscountConfiguration.manual_configure(
            company=company,
            code="OPS",
            title="Operators",
            conditions=[
                {"field_key": "gender", "operator": "EQUAL_TO", "value": "Female", "percentage": 5},
                {"field_key": "gender", "operator": "NOT_EQUAL_TO", "value": "Male", "percentage": 3},
                {"field_key": "age", "operator": "GREATER_THAN", "value": "60", "percentage": 15},
                {"field_key": "age", "operator": "LESS_THAN", "value": "18", "percentage": 20},
                {"field_key": "age", "operator": "BETWEEN", "value": "21", "value_to": "30", "percentage": 7},
            ],
            taxes=[str(self._item_tax(company, self._account(company)).pk)],
        )

        result = config.evaluate({"gender": "Female", "age": 25})
        self.assertTrue(result["matched"])
        self.assertEqual(result["percentage"], Decimal("7.00"), "highest matching wins (5 < 7)")

        result = config.evaluate({"gender": "Male", "age": 70})
        self.assertEqual(result["percentage"], Decimal("15.00"), "gt-60 wins over NOT_EQUAL Male")

        result = config.evaluate({"age": 12})
        self.assertEqual(result["percentage"], Decimal("20.00"), "lt-18 wins")

        result = config.evaluate({"gender": "Female", "age": 35})
        self.assertEqual(result["percentage"], Decimal("5.00"), "only equal-to matches")

        result = config.evaluate({"age": 45})
        self.assertFalse(result["matched"], "no condition applies without a qualifying attribute")
        self.assertEqual(result["percentage"], Decimal("0.00"))

    def test_discount_amount_for_percentage_and_fixed(self):
        company = self._company("Amount Co")
        config = DiscountConfiguration.manual_configure(
            company=company,
            code="AMT",
            title="Amount",
            conditions=[
                {"field_key": "age", "operator": "GREATER_THAN", "value": "60", "percentage": 10},
                {"field_key": "membership", "operator": "EQUAL_TO", "value": "VIP", "percentage": 25},
            ],
            taxes=[str(self._item_tax(company, self._account(company)).pk)],
        )

        amount = config.discount_amount_for(Decimal("500.00"), {"age": 70})
        self.assertEqual(amount, Decimal("50.00"), "10% of 500")

        amount = config.discount_amount_for(Decimal("500.00"), {"membership": "VIP", "age": 70})
        self.assertEqual(amount, Decimal("125.00"), "highest percentage 25% of 500")

        amount = config.discount_amount_for(Decimal("500.00"), {"membership": "BASIC"})
        self.assertEqual(amount, Decimal("0.00"), "no matching condition, no discount")

        fixed = DiscountConfiguration.manual_configure(
            company=company,
            code="FIXED",
            title="Fixed amount",
            discount_type="FIXED_AMOUNT",
            conditions=[
                {"field_key": "gender", "operator": "EQUAL_TO", "value": "Female", "fixed_amount": 15},
            ],
            taxes=[str(self._item_tax(company, self._account(company)).pk)],
        )
        amount = fixed.discount_amount_for(Decimal("500.00"), {"gender": "Female"})
        self.assertEqual(amount, Decimal("15.00"))

    # -------------------------------------------------------------- global

    def test_global_config_and_inactive_condition_skipped(self):
        company = self._company("Global Co")
        config = DiscountConfiguration.create_global(
            company=company,
            code="GLOBAL",
            title="Global promo",
        )
        self.assertTrue(config.is_global)
        self.assertEqual(config.conditions_payload, [])
        self.assertEqual(config.taxes_payload, [])

        config.manual_conditions = None
        DiscountConditionItem.objects.create(
            configuration=config,
            field_key="age",
            operator="GREATER_THAN",
            value="50",
            percentage=12,
            is_active=False,
        )
        result = config.evaluate({"age": 80})
        self.assertFalse(result["matched"], "inactive conditions must not apply")
        self.assertEqual(result["percentage"], Decimal("0.00"))

    # --------------------------------------------------------- integration

    def test_discount_configuration_links_to_charge_definition_and_evaluates(self):
        company = self._company("Integration Co")
        account = self._account(company)
        tax = self._item_tax(company, account, rate=18)

        config = DiscountConfiguration.manual_configure(
            company=company,
            code="INTEG_SENIOR",
            title="Senior Discount",
            conditions=[
                {"field_key": "age", "operator": "GREATER_THAN", "value": "60", "percentage": 15},
                {"field_key": "gender", "operator": "EQUAL_TO", "value": "Female", "percentage": 10},
            ],
            taxes=[str(tax.pk)],
        )

        charge_definition = ChargeDefinition.objects.create(
            company=company,
            code="CHG_SENIOR",
            title="Senior Discount Charge",
            charge_type="DISCOUNT",
            based_on="PERCENTAGE",
            discount_configuration=config,
        )
        charge_definition.refresh_from_db()
        self.assertEqual(charge_definition.discount_configuration_id, config.id)

        so = SalesOrder.objects.create(total_amount=Decimal("1000.00"), company=company)
        ChargeItem.attach_to(so, charge_definition)

        self.assertEqual(so.charges.count(), 1)
        result = config.evaluate({"age": 65, "gender": "Female"})
        self.assertTrue(result["matched"])
        self.assertEqual(result["percentage"], Decimal("15.00"), "age gt-60 beats gender equal-to")
        self.assertIn(tax.pk, result["tax_template_ids"], "evaluation surfaces the linked item tax keys")

        charge_definition.refresh_from_db()
        self.assertEqual(charge_definition.discount_configuration_id, config.id)