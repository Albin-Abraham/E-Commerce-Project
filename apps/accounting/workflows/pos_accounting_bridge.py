import logging
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from apps.accounting.models.chart_of_accounts import Account
from apps.accounting.models.journal_entry import JournalEntry, JournalEntryLine
from apps.accounting.workflows.posting_service import GLPostingService

logger = logging.getLogger(__name__)


class POSAccountingBridge:
    """
    Financial Integration Bridge for Point of Sale (POS) Transactions.
    Translates completed sales and stock deductions into balanced double-entry
    General Ledger postings:
      - Line 1: Debit Cash / Card Clearing Account (Asset)
      - Line 2: Credit Sales Revenue Account (Income)
      - Line 3: Credit Output Tax Payable Account (Liability) [if tax > 0]
      - Line 4: Debit Cost of Goods Sold (Expense) [if cogs > 0]
      - Line 5: Credit Inventory / Stock in Hand Account (Asset) [if cogs > 0]
    """

    @classmethod
    @transaction.atomic
    def post_pos_sale(cls, pos_transaction) -> JournalEntry | None:
        """
        Generates and posts a balanced JournalEntry for the given POSTransaction.
        Idempotent: if a JournalEntry has already been created for this transaction, returns it.
        """
        # 1. Idempotency Check
        existing_jv = JournalEntry.objects.filter(
            entry_type="JOURNAL_ENTRY",
            user_remark__contains=f"POS Transaction #{pos_transaction.transaction_number}",
        ).first()
        if existing_jv:
            if not existing_jv.is_posted:
                GLPostingService.post_journal_entry(existing_jv.id)
            return existing_jv

        session = pos_transaction.session
        register = session.register
        warehouse = register.warehouse
        company = warehouse.company if warehouse else None
        branch = register.branch

        if not company:
            logger.warning(
                "Cannot post GL for POS Transaction #%s: No company found for register/warehouse.",
                pos_transaction.transaction_number,
            )
            return None

        # 2. Resolve Accounts with deterministic fallbacks
        cash_account = (
            Account.objects.filter(company=company, root_type="ASSET", account_type__in=["CASH", "BANK"]).first()
            or Account.objects.create(
                account_code=f"1000-CASH-{company.id[:6]}",
                account_name="Cash on Hand",
                root_type="ASSET",
                account_type="CASH",
                company=company,
            )
        )

        revenue_account = (
            Account.objects.filter(company=company, root_type="INCOME").first()
            or Account.objects.create(
                account_code=f"4000-SALES-{company.id[:6]}",
                account_name="Sales Revenue",
                root_type="INCOME",
                company=company,
            )
        )

        tax_account = None
        tax_amount = Decimal(str(pos_transaction.tax_amount or 0.0))
        if tax_amount > Decimal("0.00"):
            tax_account = (
                Account.objects.filter(company=company, root_type="LIABILITY", account_type="TAX").first()
                or Account.objects.create(
                    account_code=f"2100-VAT-{company.id[:6]}",
                    account_name="Output VAT Payable",
                    root_type="LIABILITY",
                    account_type="TAX",
                    company=company,
                )
            )

        # 3. Calculate COGS and resolve inventory asset accounts
        total_cogs = Decimal("0.00")
        for item in pos_transaction.items.select_related("variant").all():
            unit_cost = Decimal("0.00")
            inv = item.variant.inventory_records.filter(warehouse=warehouse).first()
            if inv and inv.unit_cost:
                unit_cost = Decimal(str(inv.unit_cost))
            total_cogs += unit_cost * Decimal(str(item.quantity))

        cogs_account = None
        inventory_account = None
        if total_cogs > Decimal("0.00"):
            cogs_account = (
                Account.objects.filter(company=company, root_type="EXPENSE", account_type="COST_OF_GOODS_SOLD").first()
                or Account.objects.create(
                    account_code=f"5000-COGS-{company.id[:6]}",
                    account_name="Cost of Goods Sold",
                    root_type="EXPENSE",
                    account_type="COST_OF_GOODS_SOLD",
                    company=company,
                )
            )
            inventory_account = (
                Account.objects.filter(company=company, root_type="ASSET", account_type="STOCK_IN_HAND").first()
                or Account.objects.create(
                    account_code=f"1400-STOCK-{company.id[:6]}",
                    account_name="Stock in Hand",
                    root_type="ASSET",
                    account_type="STOCK_IN_HAND",
                    company=company,
                )
            )

        # 4. Construct Journal Entry Header
        total_amount = Decimal(str(pos_transaction.total_amount))
        net_sales = total_amount - tax_amount

        total_debit = total_amount + total_cogs
        total_credit = total_amount + total_cogs

        posting_date = pos_transaction.created_at.date() if pos_transaction.created_at else timezone.now().date()

        jv = JournalEntry.objects.create(
            company=company,
            branch=branch,
            entry_type="JOURNAL_ENTRY",
            posting_date=posting_date,
            total_debit=total_debit,
            total_credit=total_credit,
            user_remark=f"POS Transaction #{pos_transaction.transaction_number} - Register {register.name}",
        )

        # 5. Create Journal Entry Lines
        # Debit Cash/Card Clearing
        JournalEntryLine.objects.create(
            journal_entry=jv,
            account=cash_account,
            debit=total_amount,
            credit=Decimal("0.00"),
            user_remark=f"Payment received via {pos_transaction.payment_method}",
        )

        # Credit Sales Revenue
        JournalEntryLine.objects.create(
            journal_entry=jv,
            account=revenue_account,
            debit=Decimal("0.00"),
            credit=net_sales,
            user_remark="Net Sales Revenue",
        )

        # Credit Output Tax (if tax > 0)
        if tax_account and tax_amount > Decimal("0.00"):
            JournalEntryLine.objects.create(
                journal_entry=jv,
                account=tax_account,
                debit=Decimal("0.00"),
                credit=tax_amount,
                user_remark="Sales Tax / VAT Payable",
            )

        # COGS & Inventory Asset lines (if total_cogs > 0)
        if cogs_account and inventory_account and total_cogs > Decimal("0.00"):
            JournalEntryLine.objects.create(
                journal_entry=jv,
                account=cogs_account,
                debit=total_cogs,
                credit=Decimal("0.00"),
                user_remark="Cost of Goods Sold (COGS)",
            )
            JournalEntryLine.objects.create(
                journal_entry=jv,
                account=inventory_account,
                debit=Decimal("0.00"),
                credit=total_cogs,
                user_remark="Inventory Asset Reduction",
            )

        # 6. Post to General Ledger
        GLPostingService.post_journal_entry(jv.id)
        logger.info(
            "POS Transaction #%s successfully posted to General Ledger (JV #%s).",
            pos_transaction.transaction_number,
            jv.entry_number,
        )
        return jv
