from decimal import Decimal

from django.test import TestCase

from core.admin.models.business_unit import BusinessUnit
from core.admin.models.company import Company
from core.admin.models.branch import Branch
from apps.accounting.models.charges import ChargeDefinition, ChargeItem
from apps.accounting.models.chart_of_accounts import Account
from apps.accounting.models.tax_code import TaxCode
from apps.accounting.models.tax_pack import TaxPackCode, TaxRatePack
from apps.accounting.services.tax_engine import TaxEngineService
from apps.procurement_pos.models.selling import SalesOrder


class TaxPackTestCase(TestCase):
    """Tax packs: branch/country-scoped bundles of tax lines driving the tax engine."""

    def _company(self, name):
        return Company.objects.create(name=name, code=name.upper().replace(" ", "-")[:20])

    def _account(self, code, company):
        return Account.objects.create(
            account_code=code,
            account_name=f"Account {code}",
            company=company,
        )

    def _branch(self, company, name, code, country):
        bu = BusinessUnit.objects.create(name=f"BU {code}", company=company)
        return Branch.objects.create(
            name=name,
            code=code,
            company=company,
            business_unit=bu,
            location=country,
            opened_date="2024-01-01",
        )

    def _pack(self, company, branch=None, code="PK", title="Pack", country="",
              direction="BOTH", rate=18, is_inclusive=False, is_default=False,
              account=None):
        tax_code = TaxCode.objects.create(
            company=company,
            code=f"{code}_TX",
            title=f"{title} Tax Code",
            tax_type="VAT",
            jurisdiction="FEDERAL",
            country_code=country,
            rate=Decimal(str(rate)),
            account=account,
        )
        pack = TaxRatePack.objects.create(
            company=company,
            branch=branch,
            country_code=country,
            code=code,
            title=title,
            direction=direction,
            tax_category="VAT",
            is_inclusive=is_inclusive,
            is_default=is_default,
        )
        TaxPackCode.objects.create(
            pack=pack,
            code=tax_code,
            tax_name=tax_code.title,
            rate=tax_code.rate,
            account=account,
        )
        return pack

    # ------------------------------------------------------------ modeling

    def test_pack_scoped_to_branch_and_country(self):
        company = self._company("Packs Co")
        account = self._account("2100-VAT", company)
        ae_branch = self._branch(company, "Dubai Mall", "DXB", "AE")
        us_branch = self._branch(company, "San Jose", "SJC", "US")

        uae = self._pack(company, branch=ae_branch, code="AE_VAT", country="AE", rate=5, account=account)
        usa = self._pack(company, branch=us_branch, code="US_SJC", country="US", rate=8.25, account=account)

        uae.refresh_from_db()
        usa.refresh_from_db()
        self.assertEqual(uae.country_code, "AE")
        self.assertEqual(uae.branch_id, ae_branch.id)
        self.assertEqual(usa.branch_id, us_branch.id)
        self.assertEqual(usa.tax_lines.count(), 1)
        line = usa.tax_lines.first()
        self.assertEqual(line.tax_name, "Pack Tax Code")
        self.assertEqual(line.rate, Decimal("8.250"))
        self.assertEqual(line.account_id, account.id)

    # ------------------------------------------------------- resolution

    def test_resolve_picks_branch_specific_pack_when_branch_is_passed(self):
        company = self._company("Resolve Co")
        account = self._account("2100-VAT", company)
        ae_branch = self._branch(company, "Dubai Mall", "DXB", "AE")
        us_branch = self._branch(company, "San Jose", "SJC", "US")

        self._pack(company, branch=ae_branch, code="AE_VAT", country="AE", rate=5, account=account)
        self._pack(company, branch=us_branch, code="US_SJC", country="US", rate=8.25, account=account)

        resolved_ae = TaxRatePack.resolve(company, branch=ae_branch, direction="SALES")
        resolved_us = TaxRatePack.resolve(company, branch=us_branch, direction="SALES")

        self.assertEqual(resolved_ae.code, "AE_VAT", "passing the branch resolves that country's taxes")
        self.assertEqual(resolved_us.code, "US_SJC")
        self.assertNotEqual(resolved_ae.pk, resolved_us.pk, "different branches/countries differ")

    def test_resolve_falls_back_to_branch_agnostic_default(self):
        company = self._company("Fallback Co")
        account = self._account("2100-VAT", company)
        branch_a = self._branch(company, "Branch A", "BRA", "AE")
        branch_b = self._branch(company, "Branch B", "BRB", "IQ")

        company_default = self._pack(
            company, branch=None, code="CO_DEFAULT", country="AE", rate=18,
            is_default=True, account=account,
        )
        branch_a_pack = self._pack(company, branch=branch_a, code="BR_A", country="AE", rate=10, account=account)

        resolved_a = TaxRatePack.resolve(company, branch=branch_a, direction="SALES")
        resolved_b = TaxRatePack.resolve(company, branch=branch_b, direction="SALES")

        self.assertEqual(resolved_a.code, "BR_A", "explicit branch pack wins")
        self.assertEqual(resolved_b.code, "CO_DEFAULT", "branch without a pack falls back to company default")

    def test_resolve_filters_by_direction(self):
        company = self._company("Direction Co")
        account = self._account("2100-VAT", company)
        sales_pack = self._pack(company, code="SALES_ONLY", direction="SALES", rate=18, account=account)

        self.assertEqual(TaxRatePack.resolve(company, direction="SALES").pk, sales_pack.pk)
        self.assertIsNone(TaxRatePack.resolve(company, direction="PURCHASE"), "purchase direction must not resolve sales pack")

    def test_resolve_for_country(self):
        company = self._company("Country Co")
        account = self._account("2100-VAT", company)
        self._pack(company, code="US_MAIN", country="US", rate=7, account=account)
        self._pack(company, code="CO_FALLBACK", country="", rate=18, is_default=True, account=account)

        self.assertEqual(TaxRatePack.resolve_for_country(company, "US").code, "US_MAIN")
        self.assertEqual(TaxRatePack.resolve_for_country(company, "FR").code, "CO_FALLBACK",
                         "unknown country falls back to default")

    # --------------------------------------------------------------- engine

    def test_pack_drives_tax_engine_like_a_template(self):
        company = self._company("Engine Co")
        account = self._account("2100-VAT", company)
        pack = self._pack(company, code="AE_VAT", country="AE", rate=18, account=account)

        result = TaxEngineService().calculate_sales_tax(Decimal("100.00"), pack)

        self.assertEqual(result.net_amount, Decimal("100.00"))
        self.assertEqual(result.total_tax_amount, Decimal("18.00"))
        self.assertEqual(result.gross_amount, Decimal("118.00"))
        self.assertFalse(result.is_inclusive)

    def test_inclusive_pack_embeds_tax_in_gross(self):
        company = self._company("EngineInclusive Co")
        account = self._account("2100-VAT", company)
        pack = self._pack(company, code="AE_VAT_INC", country="AE", rate=18,
                          is_inclusive=True, account=account)

        result = TaxEngineService().calculate_sales_tax(Decimal("100.00"), pack)

        self.assertTrue(result.is_inclusive)
        self.assertEqual(result.net_amount, Decimal("84.75"))
        self.assertEqual(result.total_tax_amount, Decimal("15.25"))
        self.assertEqual(result.gross_amount, Decimal("100.00"))

    # ------------------------------------------------------- charge linkage

    def test_charge_definition_falls_back_to_tax_pack(self):
        company = self._company("ChargePack Co")
        account = self._account("6000-SHIP", company)
        branch = self._branch(company, "Dubai Mall", "DXB", "AE")
        pack = self._pack(company, branch=branch, code="AE_VAT", country="AE", rate=18, account=account)

        definition = ChargeDefinition.objects.create(
            company=company,
            code="FLAT_SHIP_AE",
            title="Flat Shipping",
            charge_type="ADDITIONAL",
            based_on="FIXED_AMOUNT",
            amount=Decimal("10.00"),
            tax_pack=pack,
        )

        so = SalesOrder.objects.create(total_amount=Decimal("100.00"), company=company)
        charge = ChargeItem.attach_to(so, definition)

        self.assertEqual(charge.net_amount, Decimal("10.00"))
        self.assertEqual(charge.tax_rate, Decimal("18.000"))
        self.assertEqual(charge.tax_amount, Decimal("1.80"))
        self.assertEqual(charge.total_amount, Decimal("11.80"))
        self.assertFalse(charge.is_inclusive)

    def test_explicit_template_beats_tax_pack(self):
        company = self._company("Precedence Co")
        account = self._account("6000-SHIP", company)
        pack = self._pack(company, code="PK_FALLBACK", rate=5, account=account)
        from apps.accounting.models.tax import SalesTaxDetail, SalesTaxTemplate

        template = SalesTaxTemplate.objects.create(
            title="Explicit 18%", company=company, tax_category="VAT",
        )
        SalesTaxDetail.objects.create(
            template=template, tax_name="VAT 18%", rate=Decimal("18"), account=account,
        )

        definition = ChargeDefinition.objects.create(
            company=company,
            code="EXPLICIT",
            title="Explicit Template Charge",
            charge_type="ADDITIONAL",
            based_on="FIXED_AMOUNT",
            amount=Decimal("10.00"),
            tax_pack=pack,
            sales_tax_template=template,
        )

        so = SalesOrder.objects.create(total_amount=Decimal("100.00"), company=company)
        charge = ChargeItem.attach_to(so, definition)

        self.assertEqual(charge.tax_rate, Decimal("18.000"), "explicit template must win over the pack")
        self.assertEqual(charge.tax_amount, Decimal("1.80"))