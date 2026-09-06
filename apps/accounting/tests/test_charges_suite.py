from decimal import Decimal

from django.test import TestCase

from core.admin.models.company import Company
from core.admin.models.number_series import NumberSeries
from apps.accounting.models.charges import ChargeDefinition, ChargeItem
from apps.accounting.models.chart_of_accounts import Account
from apps.accounting.models.currency import Currency
from apps.accounting.models.tax import (
    ItemTaxDetail,
    ItemTaxTemplate,
    PurchaseTaxDetail,
    PurchaseTaxTemplate,
    SalesTaxDetail,
    SalesTaxTemplate,
)
from apps.procurement_pos.models.procurement import (
    PurchaseInvoice,
    PurchaseOrder,
    Supplier,
)
from apps.procurement_pos.models.selling import SalesInvoice, SalesOrder


class ChargesTestCase(TestCase):
    """ChargeDefinition / ChargeItem suite across Shop, POS, Procurement, and Invoices."""

    def _company(self, name):
        code = name.upper().replace(" ", "-").replace("'", "")[:20]
        return Company.objects.create(name=name, code=code)

    def _currency(self, code="USD"):
        return Currency.objects.create(code=code, name=code)

    def _account(self, code, company):
        return Account.objects.create(
            account_code=code,
            account_name=f"Account {code}",
            company=company,
        )

    def _user(self, username):
        from django.contrib.auth import get_user_model
        return get_user_model().objects.create_user(
            username=username, email=f"{username}@example.com", password="password123"
        )

    def _sales_tax(self, company, account, rate=18, is_inclusive=False):
        template = SalesTaxTemplate.objects.create(
            title=f"Sales Tax {rate}%",
            company=company,
            tax_category="VAT",
            is_inclusive=is_inclusive,
        )
        SalesTaxDetail.objects.create(
            template=template,
            tax_name=f"VAT {rate}%",
            rate=Decimal(str(rate)),
            account=account,
        )
        return template

    def _purchase_tax(self, company, account, rate=12):
        template = PurchaseTaxTemplate.objects.create(
            title=f"Purchase Tax {rate}%",
            company=company,
            tax_category="VAT",
        )
        PurchaseTaxDetail.objects.create(
            template=template,
            tax_name=f"Input VAT {rate}%",
            rate=Decimal(str(rate)),
            account=account,
        )
        return template

    def _item_tax(self, company, account, rate=5):
        template = ItemTaxTemplate.objects.create(
            title=f"Item Tax {rate}%",
            company=company,
            tax_category="VAT",
        )
        ItemTaxDetail.objects.create(
            template=template,
            tax_name=f"Item VAT {rate}%",
            rate=Decimal(str(rate)),
            account=account,
        )
        return template

    def _supplier(self):
        return Supplier.objects.create(name=f"Supplier {self._seq()}")

    def _seq(self):
        seq = getattr(self, "_seq_counter", 0) + 1
        self._seq_counter = seq
        return seq

    # ------------------------------------------------------------------ defs

    def test_charge_definition_scoped_unique_code_rule(self):
        company_a = self._company("Rules Co A")
        company_b = self._company("Rules Co B")

        ChargeDefinition.objects.create(company=company_a, code="SHIP", title="Flat Shipping")

        duplicate = ChargeDefinition(company=company_a, code="SHIP", title="Duplicate")
        rules = duplicate._rules.get("code", [])
        unique_rules = [r for r in rules if r.__class__.__name__ == "UniqueRule"]
        self.assertTrue(unique_rules, "code field should declare a UniqueRule")
        self.assertFalse(unique_rules[0].check(duplicate), "same company duplicate code must be rejected")

        other_company = ChargeDefinition(company=company_b, code="SHIP", title="Other Company Shipping")
        self.assertTrue(unique_rules[0].check(other_company), "same code in a different company must be allowed")

    def test_charge_definition_snapshots_tax_template_linkage(self):
        company = self._company("Linkage Co")
        account = self._account("6000-SHIP", company)
        sales_tax = self._sales_tax(company, account, rate=18)
        purchase_tax = self._purchase_tax(company, account, rate=12)
        item_tax = self._item_tax(company, account, rate=5)

        definition = ChargeDefinition.objects.create(
            company=company,
            code="MULTI_TAX",
            title="Multi Tax Charge",
            charge_type="ADDITIONAL",
            based_on="FIXED_AMOUNT",
            amount=Decimal("10.00"),
            account=account,
            sales_tax_template=sales_tax,
            purchase_tax_template=purchase_tax,
            item_tax_template=item_tax,
        )
        definition.refresh_from_db()
        self.assertEqual(definition.sales_tax_template_id, sales_tax.id)
        self.assertEqual(definition.purchase_tax_template_id, purchase_tax.id)
        self.assertEqual(definition.item_tax_template_id, item_tax.id)
        self.assertEqual(definition.account_id, account.id)

    # --------------------------------------------------------------- sales

    def test_fixed_charge_on_sales_order_uses_sales_tax_template(self):
        company = self._company("SalesOrder Co")
        account = self._account("6000-SHIPPING", company)
        sales_tax = self._sales_tax(company, account, rate=18)

        definition = ChargeDefinition.objects.create(
            company=company,
            code="FLAT_SHIP",
            title="Flat Rate Shipping",
            charge_type="ADDITIONAL",
            based_on="FIXED_AMOUNT",
            amount=Decimal("10.00"),
            sales_tax_template=sales_tax,
        )

        so = SalesOrder.objects.create(total_amount=Decimal("100.00"), company=company)
        charge = ChargeItem.attach_to(so, definition)

        self.assertEqual(charge.charge_type, "ADDITIONAL")
        self.assertEqual(charge.net_amount, Decimal("10.00"))
        self.assertEqual(charge.tax_rate, Decimal("18.000"))
        self.assertEqual(charge.tax_amount, Decimal("1.80"))
        self.assertEqual(charge.total_amount, Decimal("11.80"))
        self.assertFalse(charge.is_inclusive)
        self.assertEqual(charge.description, "Flat Rate Shipping")

        self.assertIn(charge, list(so.charges), "sales_order.charges must expose applied charges")
        self.assertIn(charge, list(ChargeItem.for_document(so)))

    def test_percentage_discount_charge_on_sales_invoice_uses_item_tax(self):
        company = self._company("SalesInvoice Co")
        account = self._account("7000-DISCOUNT", company)
        item_tax = self._item_tax(company, account, rate=5)

        definition = ChargeDefinition.objects.create(
            company=company,
            code="PRM10",
            title="Promo Discount 10%",
            charge_type="DISCOUNT",
            based_on="PERCENTAGE",
            rate=Decimal("10.00"),
            item_tax_template=item_tax,
        )

        sinv = SalesInvoice.objects.create(
            company=company,
            net_total=Decimal("200.00"),
            invoice_number="INV-CHG-0001",
        )
        charge = ChargeItem.attach_to(sinv, definition)

        self.assertEqual(charge.net_amount, Decimal("20.00"))
        self.assertEqual(charge.tax_amount, Decimal("1.00"))
        self.assertEqual(charge.total_amount, Decimal("21.00"))

        summary = ChargeItem.summary(sinv)
        self.assertEqual(summary["count"], 1)
        self.assertEqual(summary["net_total"], Decimal("-20.00"), "discounts reduce net")
        self.assertEqual(summary["tax_total"], Decimal("-1.00"))
        self.assertEqual(summary["grand_total"], Decimal("-21.00"))

        self.assertIn(charge, list(sinv.charges))

    # ------------------------------------------------------------ purchase

    def test_purchase_charge_on_purchase_order_uses_purchase_tax_template(self):
        company = self._company("PurchaseOrder Co")
        account = self._account("5000-FREIGHT", company)
        purchase_tax = self._purchase_tax(company, account, rate=12)

        definition = ChargeDefinition.objects.create(
            company=company,
            code="FREIGHT",
            title="Freight Charge",
            charge_type="ADDITIONAL",
            based_on="FIXED_AMOUNT",
            amount=Decimal("50.00"),
            purchase_tax_template=purchase_tax,
        )

        supplier = self._supplier()
        user = self._user("po_charger")
        po = PurchaseOrder.objects.create(
            supplier=supplier,
            created_by=user,
            total_amount=Decimal("500.00"),
        )
        charge = ChargeItem.attach_to(po, definition)

        self.assertEqual(charge.net_amount, Decimal("50.00"))
        self.assertEqual(charge.tax_rate, Decimal("12.000"))
        self.assertEqual(charge.tax_amount, Decimal("6.00"))
        self.assertEqual(charge.total_amount, Decimal("56.00"))

        self.assertIn(charge, list(po.charges), "purchase_order.charges must expose applied charges")

    def test_attach_charge_to_purchase_invoice(self):
        company = self._company("PurchaseInvoice Co")
        account = self._account("5000-CUSTOMS", company)
        purchase_tax = self._purchase_tax(company, account, rate=12)

        definition = ChargeDefinition.objects.create(
            company=company,
            code="CUS2",
            title="Customs 2%",
            charge_type="ADDITIONAL",
            based_on="PERCENTAGE",
            rate=Decimal("2.00"),
            purchase_tax_template=purchase_tax,
        )

        supplier = self._supplier()
        user = self._user("pi_charger")
        po = PurchaseOrder.objects.create(supplier=supplier, created_by=user, total_amount=Decimal("1000.00"))
        pi = PurchaseInvoice.objects.create(
            purchase_order=po,
            supplier=supplier,
            billed_amount=Decimal("1000.00"),
        )
        charge = ChargeItem.attach_to(pi, definition)

        self.assertEqual(charge.net_amount, Decimal("20.00"))
        self.assertEqual(charge.tax_amount, Decimal("2.40"))
        self.assertEqual(charge.total_amount, Decimal("22.40"))

        self.assertIn(charge, list(pi.charges), "purchase_invoice.charges must expose applied charges")

    # ------------------------------------------------------------- compute

    def test_inclusive_charge_tax_embedded_in_total(self):
        company = self._company("Inclusive Co")
        account = self._account("6000-INCLUSIVE", company)
        sales_tax = self._sales_tax(company, account, rate=18, is_inclusive=True)

        definition = ChargeDefinition.objects.create(
            company=company,
            code="INC_SVC",
            title="Inclusive Service Charge",
            charge_type="ADDITIONAL",
            based_on="FIXED_AMOUNT",
            amount=Decimal("100.00"),
            sales_tax_template=sales_tax,
            is_inclusive=True,
        )

        so = SalesOrder.objects.create(total_amount=Decimal("1000.00"), company=company)
        charge = ChargeItem.attach_to(so, definition)

        self.assertTrue(charge.is_inclusive)
        self.assertEqual(charge.net_amount, Decimal("84.75"))
        self.assertEqual(charge.tax_amount, Decimal("15.25"))
        self.assertEqual(charge.total_amount, Decimal("100.00"))

    def test_charge_snapshot_survives_later_tax_template_change(self):
        company = self._company("Snapshot Co")
        account = self._account("6000-SNAPSHOT", company)
        sales_tax = self._sales_tax(company, account, rate=18)

        definition = ChargeDefinition.objects.create(
            company=company,
            code="SNAP",
            title="Snapshotted Charge",
            charge_type="ADDITIONAL",
            based_on="FIXED_AMOUNT",
            amount=Decimal("10.00"),
            sales_tax_template=sales_tax,
        )
        so = SalesOrder.objects.create(total_amount=Decimal("100.00"), company=company)
        charge = ChargeItem.attach_to(so, definition)
        self.assertEqual(charge.tax_rate, Decimal("18.000"))
        self.assertEqual(charge.tax_amount, Decimal("1.80"))

        tax_line = sales_tax.tax_lines.first()
        tax_line.rate = Decimal("20.000")
        tax_line.save()

        reloaded = ChargeItem.objects.get(pk=charge.pk)
        self.assertEqual(reloaded.tax_rate, Decimal("18.000"), "historical charge must keep its tax snapshot")
        self.assertEqual(reloaded.tax_amount, Decimal("1.80"))

        reloaded.recompute()
        reloaded.save()
        reloaded.refresh_from_db()
        self.assertEqual(reloaded.tax_rate, Decimal("20.000"), "explicit recompute must apply new tax rate")
        self.assertEqual(reloaded.tax_amount, Decimal("2.00"))

    def test_summary_aggregates_additional_and_discount_charges(self):
        company = self._company("Summary Co")
        account = self._account("6000-SUMMARY", company)
        sales_tax = self._sales_tax(company, account, rate=18)

        shipping = ChargeDefinition.objects.create(
            company=company,
            code="SUM_SHIP",
            title="Shipping",
            charge_type="ADDITIONAL",
            based_on="FIXED_AMOUNT",
            amount=Decimal("10.00"),
            sales_tax_template=sales_tax,
        )
        rebate = ChargeDefinition.objects.create(
            company=company,
            code="SUM_REB",
            title="Rebate 5%",
            charge_type="DISCOUNT",
            based_on="PERCENTAGE",
            rate=Decimal("5.00"),
        )

        so = SalesOrder.objects.create(total_amount=Decimal("1000.00"), company=company)
        ChargeItem.attach_to(so, shipping)
        ChargeItem.attach_to(so, rebate)

        summary = ChargeItem.summary(so)
        self.assertEqual(summary["count"], 2)
        self.assertEqual(summary["net_total"], Decimal("-40.00"), "10 shipping - 50 rebate")
        self.assertEqual(summary["tax_total"], Decimal("1.80"), "only shipping carries 18% tax")
        self.assertEqual(summary["grand_total"], Decimal("-38.20"))