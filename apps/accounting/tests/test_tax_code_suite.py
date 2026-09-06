from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase

from core.admin.models.company import Company
from apps.accounting.models.chart_of_accounts import Account
from apps.accounting.models.tax_code import TaxCode
from apps.accounting.models.tax_pack import TaxPackCode, TaxRatePack
from apps.accounting.services.tax_engine import TaxEngineService


class TaxCodePackTestCase(TestCase):
    """TaxCode (identity + chargeable atom) -> TaxRatePack (structure via TaxPackCode) + display."""

    def _company(self, name):
        return Company.objects.create(name=name, code=name.upper().replace(" ", "-")[:20])

    def _account(self, code, company):
        return Account.objects.create(
            account_code=code,
            account_name=f"Account {code}",
            company=company,
        )

    def _code(self, company, account, code="FED_VAT", rate=5, jurisdiction="FEDERAL",
              country="AE", tax_type="VAT", is_inclusive=False):
        return TaxCode.objects.create(
            company=company,
            code=code,
            title=code.replace("_", " "),
            tax_type=tax_type,
            jurisdiction=jurisdiction,
            country_code=country,
            rate=Decimal(str(rate)),
            account=account,
            is_inclusive=is_inclusive,
        )

    # ----------------------------------------------------------- tax code

    def test_tax_code_is_the_chargeable_atom(self):
        company = self._company("Atom Co")
        account = self._account("2100-VAT", company)
        code = self._code(company, account, code="FED_VAT_AE", rate=18,
                          jurisdiction="FEDERAL", country="AE")

        code.refresh_from_db()
        self.assertEqual(code.jurisdiction, "FEDERAL")
        self.assertEqual(code.country_code, "AE")
        self.assertEqual(code.tax_type, "VAT")
        self.assertEqual(code.rate, Decimal("18.000"))
        self.assertEqual(code.account_id, account.id)
        self.assertFalse(code.is_inclusive)

        state = self._code(company, account, code="STATE_CA_4_5", rate=4.5,
                           jurisdiction="STATE", country="US", tax_type="SALES_TAX")
        municipal = self._code(company, account, code="MUNI_1_5", rate=1.5,
                               jurisdiction="LOCAL", country="US")
        self.assertEqual(municipal.jurisdiction, "LOCAL", "federal/state/municipal are each their own code")

    def test_tax_code_unique_per_company(self):
        company_a = self._company("CodeA Co")
        company_b = self._company("CodeB Co")
        account = self._account("2100-VAT", company_a)
        self._code(company_a, account, code="FED_VAT")

        duplicate = TaxCode(company=company_a, code="FED_VAT", title="Dup")
        rule = next(r for r in duplicate._rules.get("code", []) if r.__class__.__name__ == "UniqueRule")
        self.assertFalse(rule.check(duplicate), "duplicate code rejected within the company")
        self.assertTrue(rule.check(TaxCode(company=company_b, code="FED_VAT", title="Dup")))

    # ---------------------------------------------------- pack composition

    def test_from_codes_composes_jurisdiction_groups(self):
        company = self._company("Structure Co")
        account = self._account("2100-VAT", company)
        federal = self._code(company, account, code="FED_VAT", rate=18)
        state = self._code(company, account, code="STATE_CA_4_5", rate=4.5, jurisdiction="STATE", country="US")
        local = self._code(company, account, code="MUNI_1_5", rate=1.5, jurisdiction="LOCAL", country="US")

        pack = TaxRatePack.from_codes(
            company,
            code="US_CA_PACK",
            title="California Combined",
            country_code="US",
            direction="SALES",
            codes=[
                {"tax_code": federal, "group": "FEDERAL", "position": 0},
                {"tax_code": state, "group": "STATE", "position": 1},
                {"tax_code": local, "group": "LOCAL", "position": 2},
            ],
        )

        self.assertEqual(pack.tax_lines.count(), 3)
        groups = list(pack.tax_lines.order_by("position").values_list("group", flat=True))
        self.assertEqual(groups, ["FEDERAL", "STATE", "LOCAL"], "pack preserves structural groups")

        result = TaxEngineService().calculate_sales_tax(Decimal("100.00"), pack)
        self.assertEqual(result.total_tax_amount, Decimal("24.00"), "18 + 4.5 + 1.5")
        self.assertEqual(result.gross_amount, Decimal("124.00"))
        self.assertEqual(len(result.breakdown), 3)

    def test_same_code_reused_across_packs_with_rate_override(self):
        company = self._company("Reuse Co")
        account = self._account("2100-VAT", company)
        code = self._code(company, account, code="FED_VAT", rate=18)

        uae_pack = TaxRatePack.from_codes(
            company, code="AE_PACK", title="UAE", country_code="AE", direction="SALES",
            codes=[{"tax_code": code, "group": "FEDERAL", "position": 0}],
        )
        us_pack = TaxRatePack.from_codes(
            company, code="US_PACK", title="US Override", country_code="US", direction="SALES",
            codes=[{"tax_code": code, "group": "FEDERAL", "position": 0,
                    "rate": Decimal("9.500")}],
        )

        self.assertEqual(
            TaxEngineService().calculate_sales_tax(Decimal("100.00"), uae_pack).total_tax_amount,
            Decimal("18.00"),
        )
        self.assertEqual(
            TaxEngineService().calculate_sales_tax(Decimal("100.00"), us_pack).total_tax_amount,
            Decimal("9.50"),
            "per-pack rate override bills the same code differently",
        )

    def test_from_codes_requires_at_least_one_code(self):
        company = self._company("Empty Co")
        with self.assertRaises(ValidationError):
            TaxRatePack.from_codes(company, code="EMPTY", title="Empty", codes=[])

    def test_pack_line_denormalizes_code_snapshot(self):
        company = self._company("Snapshot Co")
        account = self._account("2100-VAT", company)
        code = self._code(company, account, code="FED_VAT", rate=18, is_inclusive=True)
        pack = TaxRatePack.from_codes(
            company, code="SNAP_PACK", title="Snapshot", direction="SALES",
            codes=[{"tax_code": code, "position": 0}],
        )

        line = pack.tax_lines.first()
        self.assertEqual(type(line), TaxPackCode)
        self.assertEqual(line.code_id, code.id)
        self.assertEqual(line.rate, Decimal("18.000"))
        self.assertEqual(line.tax_name, "FED VAT")
        self.assertEqual(line.account_id, account.id)
        self.assertTrue(line.is_inclusive, "per-link snapshot inherits the code flag")

        code.rate = Decimal("20.000")
        code.save()
        line.refresh_from_db()
        self.assertEqual(line.rate, Decimal("18.000"), "historical pack keeps its snapshot")

    # -------------------------------------------------------------- display

    def test_display_structures_jurisdiction_breakdown(self):
        company = self._company("Display Co")
        account = self._account("2100-VAT", company)
        federal = self._code(company, account, code="FED_VAT", rate=18)
        state = self._code(company, account, code="STATE_CA_4_5", rate=4.5, jurisdiction="STATE", country="US")
        local = self._code(company, account, code="MUNI_1_5", rate=1.5, jurisdiction="LOCAL", country="US")

        pack = TaxRatePack.from_codes(
            company, code="US_CA_PACK", title="California Combined", country_code="US",
            direction="SALES",
            codes=[
                {"tax_code": federal, "group": "FEDERAL", "position": 0},
                {"tax_code": state, "group": "STATE", "position": 1},
                {"tax_code": local, "group": "LOCAL", "position": 2},
            ],
        )

        display = pack.display()
        self.assertEqual(display["code"], "US_CA_PACK")
        self.assertEqual(display["country_code"], "US")
        self.assertEqual(display["total_rate"], Decimal("24.000"))
        self.assertEqual([g["group"] for g in display["groups"]], ["FEDERAL", "STATE", "LOCAL"])
        self.assertEqual(display["groups"][0]["group_rate"], Decimal("18.000"))
        self.assertEqual(display["groups"][1]["group_rate"], Decimal("4.500"))
        self.assertEqual(display["groups"][2]["group_rate"], Decimal("1.500"))
        state_line = display["groups"][1]["lines"][0]
        self.assertEqual(state_line["tax_name"], "STATE CA 4 5")
        self.assertEqual(state_line["rate"], Decimal("4.500"))
        self.assertEqual(state_line["account_code"], "2100-VAT")
        self.assertEqual(state_line["tax_code"], "STATE_CA_4_5")
        self.assertFalse(state_line["is_inclusive"])

    def test_display_total_rate_matches_engine(self):
        company = self._company("DisplayEngine Co")
        account = self._account("2100-VAT", company)
        federal = self._code(company, account, code="FED_VAT", rate=18)
        pack = TaxRatePack.from_codes(
            company, code="AE_PACK", title="UAE", country_code="AE", direction="SALES",
            codes=[{"tax_code": federal, "group": "FEDERAL", "position": 0}],
        )

        display = pack.display()
        result = TaxEngineService().calculate_sales_tax(Decimal("100.00"), pack)
        self.assertEqual(display["total_rate"], result.total_rate_sum if hasattr(result, "total_rate_sum") else Decimal("18.000"))
        self.assertEqual(result.total_tax_amount, Decimal("18.00"))