from decimal import Decimal
from django.db.models import Sum
from django.utils import timezone
from apps.accounting.models.chart_of_accounts import Account
from apps.accounting.models.journal_entry import GLEntry
from apps.customers.models.party_ledger import PartyLedgerEntry


class FinancialReportService:
    """
    Financial Reporting Service generating Trial Balance, Profit & Loss (P&L),
    Balance Sheet Statements, and AR/AP Aging Reports.
    """

    @classmethod
    def get_trial_balance(
        cls,
        company,
        start_date=None,
        end_date=None,
    ) -> list[dict]:
        """
        Generates Trial Balance per account showing Opening, Debit, Credit, and Closing balances.
        """
        company_id = getattr(company, "pk", company)
        accounts = Account.objects.filter(company_id=company_id, is_active=True).order_by("account_code")

        report = []
        for acc in accounts:
            qs = GLEntry.objects.filter(company_id=company_id, account=acc, is_cancelled=False)

            opening_debit = Decimal("0.00")
            opening_credit = Decimal("0.00")

            if start_date:
                op_sums = qs.filter(posting_date__lt=start_date).aggregate(
                    d=Sum("debit"), c=Sum("credit")
                )
                opening_debit = op_sums["d"] or Decimal("0.00")
                opening_credit = op_sums["c"] or Decimal("0.00")

            period_qs = qs
            if start_date:
                period_qs = period_qs.filter(posting_date__gte=start_date)
            if end_date:
                period_qs = period_qs.filter(posting_date__lte=end_date)

            period_sums = period_qs.aggregate(d=Sum("debit"), c=Sum("credit"))
            period_debit = period_sums["d"] or Decimal("0.00")
            period_credit = period_sums["c"] or Decimal("0.00")

            total_debit = opening_debit + period_debit
            total_credit = opening_credit + period_credit

            if acc.root_type in ["ASSET", "EXPENSE"]:
                closing_balance = total_debit - total_credit
            else:
                closing_balance = total_credit - total_debit

            if period_debit != 0 or period_credit != 0 or closing_balance != 0:
                report.append({
                    "account_id": str(acc.id),
                    "account_code": acc.account_code,
                    "account_name": acc.account_name,
                    "root_type": acc.root_type,
                    "account_type": acc.account_type,
                    "period_debit": period_debit,
                    "period_credit": period_credit,
                    "closing_balance": closing_balance,
                })

        return report

    @classmethod
    def get_profit_and_loss(
        cls,
        company,
        start_date=None,
        end_date=None,
    ) -> dict:
        """
        Generates Profit & Loss Statement (Income vs Expenses = Net Profit/Loss).
        """
        company_id = getattr(company, "pk", company)
        qs = GLEntry.objects.filter(company_id=company_id, is_cancelled=False)

        if start_date:
            qs = qs.filter(posting_date__gte=start_date)
        if end_date:
            qs = qs.filter(posting_date__lte=end_date)

        income_entries = qs.filter(account__root_type="INCOME")
        expense_entries = qs.filter(account__root_type="EXPENSE")

        total_income_sums = income_entries.aggregate(d=Sum("debit"), c=Sum("credit"))
        total_income = (total_income_sums["c"] or Decimal("0.00")) - (total_income_sums["d"] or Decimal("0.00"))

        total_expense_sums = expense_entries.aggregate(d=Sum("debit"), c=Sum("credit"))
        total_expense = (total_expense_sums["d"] or Decimal("0.00")) - (total_expense_sums["c"] or Decimal("0.00"))

        net_profit = total_income - total_expense

        return {
            "company_id": str(company_id),
            "start_date": str(start_date) if start_date else None,
            "end_date": str(end_date) if end_date else None,
            "total_income": total_income,
            "total_expense": total_expense,
            "net_profit": net_profit,
            "is_profitable": net_profit >= 0,
        }

    @classmethod
    def get_balance_sheet(
        cls,
        company,
        as_of_date=None,
    ) -> dict:
        """
        Generates Balance Sheet Statement (Assets = Liabilities + Equity).
        """
        company_id = getattr(company, "pk", company)
        if not as_of_date:
            as_of_date = timezone.now().date()

        qs = GLEntry.objects.filter(
            company_id=company_id,
            posting_date__lte=as_of_date,
            is_cancelled=False,
        )

        assets_sums = qs.filter(account__root_type="ASSET").aggregate(d=Sum("debit"), c=Sum("credit"))
        total_assets = (assets_sums["d"] or Decimal("0.00")) - (assets_sums["c"] or Decimal("0.00"))

        liabilities_sums = qs.filter(account__root_type="LIABILITY").aggregate(d=Sum("debit"), c=Sum("credit"))
        total_liabilities = (liabilities_sums["c"] or Decimal("0.00")) - (liabilities_sums["d"] or Decimal("0.00"))

        equity_sums = qs.filter(account__root_type="EQUITY").aggregate(d=Sum("debit"), c=Sum("credit"))
        total_equity = (equity_sums["c"] or Decimal("0.00")) - (equity_sums["d"] or Decimal("0.00"))

        pnl = cls.get_profit_and_loss(company, end_date=as_of_date)
        retained_earnings = pnl["net_profit"]
        total_equity_with_earnings = total_equity + retained_earnings

        total_liabilities_and_equity = total_liabilities + total_equity_with_earnings
        is_balanced = abs(total_assets - total_liabilities_and_equity) < Decimal("0.01")

        return {
            "company_id": str(company_id),
            "as_of_date": str(as_of_date),
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "total_equity": total_equity,
            "retained_earnings": retained_earnings,
            "total_liabilities_and_equity": total_liabilities_and_equity,
            "is_balanced": is_balanced,
        }

    @classmethod
    def get_aging_report(
        cls,
        company,
        party_type=None,
        as_of_date=None,
    ) -> list[dict]:
        """
        Generates AR/AP Party Aging Report with buckets:
        0-30 days, 31-60 days, 61-90 days, and 90+ days overdue.
        """
        company_id = getattr(company, "pk", company)
        if not as_of_date:
            as_of_date = timezone.now().date()

        qs = PartyLedgerEntry.objects.filter(
            company_id=company_id,
            posting_date__lte=as_of_date,
            is_reconciled=False,
        )
        if party_type:
            qs = qs.filter(party_type=party_type)

        aging_map = {}
        for ple in qs:
            key = f"{ple.party_type}:{ple.party_id}"
            if key not in aging_map:
                aging_map[key] = {
                    "party_type": ple.party_type,
                    "party_id": ple.party_id,
                    "current_0_30": Decimal("0.00"),
                    "overdue_31_60": Decimal("0.00"),
                    "overdue_61_90": Decimal("0.00"),
                    "overdue_90_plus": Decimal("0.00"),
                    "total_outstanding": Decimal("0.00"),
                }

            due_ref = ple.due_date or ple.posting_date
            days_overdue = (as_of_date - due_ref).days
            outstanding = (ple.debit - ple.credit) if ple.debit > 0 else (ple.credit - ple.debit)

            if days_overdue <= 30:
                aging_map[key]["current_0_30"] += outstanding
            elif 31 <= days_overdue <= 60:
                aging_map[key]["overdue_31_60"] += outstanding
            elif 61 <= days_overdue <= 90:
                aging_map[key]["overdue_61_90"] += outstanding
            else:
                aging_map[key]["overdue_90_plus"] += outstanding

            aging_map[key]["total_outstanding"] += outstanding

        return list(aging_map.values())
