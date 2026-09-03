from dataclasses import dataclass, field
from decimal import Decimal
from apps.accounting.models.tax import PurchaseTaxTemplate, SalesTaxTemplate


@dataclass
class TaxBreakdownLine:
    tax_name: str
    rate: Decimal
    account_id: str
    tax_amount: Decimal


@dataclass
class TaxCalculationResult:
    net_amount: Decimal
    total_tax_amount: Decimal
    gross_amount: Decimal
    is_inclusive: bool
    breakdown: list[TaxBreakdownLine] = field(default_factory=list)


class TaxEngineService:
    """
    Automated Transaction Tax Engine for Sales Orders, Purchase Orders, and Invoices.
    Handles inclusive vs exclusive tax calculations and itemized tax breakdowns.
    """

    @classmethod
    def calculate_sales_tax(cls, net_amount: Decimal, template: SalesTaxTemplate) -> TaxCalculationResult:
        """
        Calculates output sales tax for commercial sales transactions.
        """
        if not template:
            return TaxCalculationResult(
                net_amount=net_amount,
                total_tax_amount=Decimal("0.00"),
                gross_amount=net_amount,
                is_inclusive=False,
                breakdown=[],
            )

        tax_lines = template.tax_lines.select_related("account").all()
        total_rate = sum(line.rate for line in tax_lines)

        breakdown = []
        total_tax = Decimal("0.00")

        if template.is_inclusive:
            # Net = Gross / (1 + Rate / 100)
            calculated_net = net_amount / (Decimal("1.00") + (total_rate / Decimal("100.00")))
            total_tax = net_amount - calculated_net
            gross_amount = net_amount
            base_for_line = calculated_net
        else:
            calculated_net = net_amount
            gross_amount = net_amount

        for line in tax_lines:
            if template.is_inclusive:
                line_tax = (calculated_net * line.rate) / Decimal("100.00")
            else:
                line_tax = (net_amount * line.rate) / Decimal("100.00")

            line_tax = round(line_tax, 2)
            total_tax += line_tax
            breakdown.append(
                TaxBreakdownLine(
                    tax_name=line.tax_name,
                    rate=line.rate,
                    account_id=str(line.account.id),
                    tax_amount=line_tax,
                )
            )

        if not template.is_inclusive:
            gross_amount = net_amount + total_tax

        return TaxCalculationResult(
            net_amount=round(calculated_net, 2),
            total_tax_amount=round(total_tax, 2),
            gross_amount=round(gross_amount, 2),
            is_inclusive=template.is_inclusive,
            breakdown=breakdown,
        )

    @classmethod
    def calculate_purchase_tax(cls, net_amount: Decimal, template: PurchaseTaxTemplate) -> TaxCalculationResult:
        """
        Calculates input purchase tax (Input Tax Credit) for procurement transactions.
        """
        if not template:
            return TaxCalculationResult(
                net_amount=net_amount,
                total_tax_amount=Decimal("0.00"),
                gross_amount=net_amount,
                is_inclusive=False,
                breakdown=[],
            )

        tax_lines = template.tax_lines.select_related("account").all()
        total_rate = sum(line.rate for line in tax_lines)

        breakdown = []
        total_tax = Decimal("0.00")

        if template.is_inclusive:
            calculated_net = net_amount / (Decimal("1.00") + (total_rate / Decimal("100.00")))
            total_tax = net_amount - calculated_net
            gross_amount = net_amount
        else:
            calculated_net = net_amount
            gross_amount = net_amount

        for line in tax_lines:
            if template.is_inclusive:
                line_tax = (calculated_net * line.rate) / Decimal("100.00")
            else:
                line_tax = (net_amount * line.rate) / Decimal("100.00")

            line_tax = round(line_tax, 2)
            total_tax += line_tax
            breakdown.append(
                TaxBreakdownLine(
                    tax_name=line.tax_name,
                    rate=line.rate,
                    account_id=str(line.account.id),
                    tax_amount=line_tax,
                )
            )

        if not template.is_inclusive:
            gross_amount = net_amount + total_tax

        return TaxCalculationResult(
            net_amount=round(calculated_net, 2),
            total_tax_amount=round(total_tax, 2),
            gross_amount=round(gross_amount, 2),
            is_inclusive=template.is_inclusive,
            breakdown=breakdown,
        )
