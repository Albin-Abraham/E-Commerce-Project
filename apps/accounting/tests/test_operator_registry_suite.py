from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase

from core.admin.models.company import Company
from apps.accounting.models.discounts import (
    DiscountConditionItem,
    DiscountConfiguration,
)
from apps.accounting.services.operator_registry import (
    GREATER_THAN,
    OperatorRegistry,
    synced_operator_choices,
)
from apps.accounting.valuesets import DISCOUNT_OPERATOR_VALUESET


class OperatorRegistryTestCase(TestCase):
    """Operator registry: linkage of operator codes to comparator objects + operand validations."""

    def setUp(self):
        self.company = Company.objects.create(name="Operator Co", code="OP-CO")
        self.configuration = DiscountConfiguration.objects.create(
            company=self.company,
            code="OP_CFG",
            title="Operator Config",
            is_global=True,
        )

    def _condition(self, operator="EQUAL_TO", value="", value_to=""):
        return DiscountConditionItem(
            configuration=self.configuration,
            field_key="age",
            operator=operator,
            value=value,
            value_to=value_to,
            percentage=Decimal("5.00"),
        )

    def test_registry_covers_every_valueset_operator(self):
        codes = {item.code for item in DISCOUNT_OPERATOR_VALUESET}
        self.assertTrue(
            codes <= OperatorRegistry.enabled_operators(),
            "every valueset operator must have a registered comparator",
        )
        self.assertTrue(synced_operator_choices())

    def test_each_operator_links_to_a_comparator_object(self):
        for code in OperatorRegistry.enabled_operators():
            entry = OperatorRegistry.resolve(code)
            self.assertIn("comparator", entry, f"{code} must link to a comparator object")
            self.assertTrue(callable(entry["comparator"]), f"{code} comparator must be callable")
            self.assertIn("args", entry, f"{code} must declare its linkage objects (value / value_to)")

    def test_resolve_unknown_operator_returns_none(self):
        self.assertIsNone(OperatorRegistry.resolve("MAYBE"))
        self.assertIsNone(OperatorRegistry.comparator("MAYBE"))
        with self.assertRaises(ValidationError):
            OperatorRegistry.validate_operator("MAYBE")

    def test_custom_operator_registered_modularly(self):
        def startswith_comparator(raw, value, value_to):
            return str(raw).startswith(str(value))

        OperatorRegistry.register(
            "STARTS_WITH",
            "Starts With",
            startswith_comparator,
            args=("value",),
        )
        self.assertIn("STARTS_WITH", OperatorRegistry.enabled_operators())

        condition = self._condition(operator="STARTS_WITH", value="AE")
        condition.save()
        self.assertTrue(condition.matches({"age": "AED-42"}))
        self.assertFalse(condition.matches({"age": "USD-42"}))

        OperatorRegistry._registry.pop("STARTS_WITH", None)

    def test_equal_to_and_not_equal_compare_by_value(self):
        equal = DiscountConditionItem(
            configuration=self.configuration,
            field_key="gender",
            operator="EQUAL_TO",
            value="Female",
            percentage=Decimal("5.00"),
        )
        equal.save()
        self.assertTrue(equal.matches({"gender": "Female"}))
        self.assertFalse(equal.matches({"gender": "Male"}))

        not_equal = DiscountConditionItem(
            configuration=self.configuration,
            field_key="gender",
            operator="NOT_EQUAL_TO",
            value="Male",
            percentage=Decimal("3.00"),
        )
        not_equal.save()
        self.assertTrue(not_equal.matches({"gender": "Female"}))
        self.assertFalse(not_equal.matches({"gender": "Male"}))

    def test_numeric_range_operators_link_value_and_value_to(self):
        cases = [
            (GREATER_THAN, "60", None, {"age": 65}, True),
            (GREATER_THAN, "60", None, {"age": 60}, False),
            ("LESS_THAN", "18", None, {"age": 12}, True),
            ("LESS_THAN", "18", None, {"age": 21}, False),
            ("LESS_THAN_OR_EQUAL", "18", None, {"age": 18}, True),
            ("GREATER_THAN_OR_EQUAL", "18", None, {"age": 18}, True),
            ("BETWEEN", "21", "30", {"age": 25}, True),
            ("BETWEEN", "21", "30", {"age": 30}, False),
            ("BETWEEN", "21", "30", {"age": 21}, False),
        ]
        for operator, value, value_to, attributes, expected in cases:
            condition = self._condition(operator=operator, value=value, value_to=value_to or "")
            condition.save()
            self.assertEqual(condition.matches(attributes), expected, f"{operator} {value}..{value_to}")

    def test_string_values_fall_back_to_string_comparison(self):
        condition = self._condition(operator=GREATER_THAN, value="50")
        condition.save()
        self.assertFalse(condition.matches({"age": "Female"}), "non-numeric raw never matches numeric operators")

    # -------------------------------------------------------- validations

    def test_equal_to_requires_its_value(self):
        with self.assertRaises(ValidationError):
            self._condition(operator="EQUAL_TO", value="").save()

    def test_between_requires_both_value_and_value_to(self):
        with self.assertRaises(ValidationError):
            self._condition(operator="BETWEEN", value="21", value_to="").save()
        with self.assertRaises(ValidationError):
            self._condition(operator="BETWEEN", value="", value_to="30").save()

    def test_unknown_operator_rejected_on_save(self):
        with self.assertRaises(ValidationError):
            self._condition(operator="MAYBE", value="21", value_to="30").save()

    def test_valid_between_condition_round_trips(self):
        condition = self._condition(operator="BETWEEN", value="21", value_to="30")
        condition.save()
        condition.refresh_from_db()
        self.assertEqual(condition.operator, "BETWEEN")
        self.assertEqual(condition.value, "21")
        self.assertEqual(condition.value_to, "30")
        self.assertEqual(condition.percentage, Decimal("5.00"))