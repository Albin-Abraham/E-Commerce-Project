import logging
from django.db import transaction
from django.utils import timezone
from apps.accounting.models.journal_entry import GLEntry, JournalEntry
from apps.accounting.models.payment_entry import PaymentEntry
from apps.customers.models.party_ledger import PartyLedgerEntry

logger = logging.getLogger(__name__)


class GLPostingService:
    """
    Transactional General Ledger & Party Ledger Posting Engine.
    Ensures balanced debit/credit posting and creates audit trails.
    """

    @classmethod
    @transaction.atomic
    def post_journal_entry(cls, journal_entry_id: str, user=None) -> JournalEntry:
        jv = JournalEntry.objects.select_for_update().get(pk=journal_entry_id)
        if jv.is_posted:
            return jv

        lines = list(jv.lines.select_related("account", "cost_center"))
        debit_total = sum((line.debit or 0) for line in lines)
        credit_total = sum((line.credit or 0) for line in lines)

        if abs(debit_total - credit_total) > 0.001:
            raise ValueError(
                f"Journal Entry #{jv.entry_number} lines are unbalanced! "
                f"Debit ({debit_total}) != Credit ({credit_total})"
            )
        if abs(jv.total_debit - debit_total) > 0.001 or abs(jv.total_credit - credit_total) > 0.001:
            raise ValueError(
                f"Journal Entry #{jv.entry_number} header totals do not match its lines. "
                f"Header Dr/Cr {jv.total_debit}/{jv.total_credit} != Lines Dr/Cr {debit_total}/{credit_total}"
            )

        for line in lines:
            # Create GL Entry
            gl_entry = GLEntry.objects.create(
                company=jv.company,
                branch=jv.branch,
                account=line.account,
                cost_center=line.cost_center,
                posting_date=jv.posting_date,
                voucher_type="Journal Entry",
                voucher_no=jv.entry_number,
                voucher_id=str(jv.id),
                debit=line.debit,
                credit=line.credit,
            )
            gl_entry.set_party(line.party)
            gl_entry.save()

            # Create Party Ledger Entry if line has party reference
            if line.party_id:
                ple = PartyLedgerEntry.objects.create(
                    company=jv.company,
                    branch=jv.branch,
                    voucher_type="JOURNAL_ENTRY",
                    voucher_id=str(jv.id),
                    voucher_no=jv.entry_number,
                    posting_date=jv.posting_date,
                    debit=line.debit,
                    credit=line.credit,
                )
                ple.set_party(line.party)
                ple.save()

        jv.is_posted = True
        jv.save(update_fields=["is_posted", "updated_at"])
        logger.info(f"Journal Entry #{jv.entry_number} successfully posted to General Ledger.")
        return jv

    @classmethod
    @transaction.atomic
    def post_payment_entry(cls, payment_entry_id: str, user=None) -> PaymentEntry:
        from apps.procurement_pos.models.procurement import PurchaseInvoice

        pe = PaymentEntry.objects.select_for_update().get(pk=payment_entry_id)
        if pe.is_submitted:
            return pe

        if pe.paid_amount < 0 or pe.received_amount < 0:
            raise ValueError(f"Payment Entry #{pe.payment_number} cannot have negative amounts.")
        settle_amount = pe.paid_amount if pe.payment_type == "PAY" else pe.received_amount
        if settle_amount <= 0:
            raise ValueError(f"Payment Entry #{pe.payment_number} has no amount to settle.")

        # Debit Received/Settled Account / Credit Paid From Account
        gl_dr = GLEntry.objects.create(
            company=pe.company,
            branch=pe.branch,
            account=pe.paid_to_account,
            posting_date=pe.posting_date,
            voucher_type="Payment Entry",
            voucher_no=pe.payment_number,
            voucher_id=str(pe.id),
            debit=settle_amount,
            credit=0.0,
        )
        gl_dr.set_party(pe.party)
        gl_dr.save()

        gl_cr = GLEntry.objects.create(
            company=pe.company,
            branch=pe.branch,
            account=pe.paid_from_account,
            posting_date=pe.posting_date,
            voucher_type="Payment Entry",
            voucher_no=pe.payment_number,
            voucher_id=str(pe.id),
            debit=0.0,
            credit=settle_amount,
        )
        gl_cr.set_party(pe.party)
        gl_cr.save()

        if pe.party_id:
            ple = PartyLedgerEntry.objects.create(
                company=pe.company,
                branch=pe.branch,
                voucher_type="PAYMENT_ENTRY",
                voucher_id=str(pe.id),
                voucher_no=pe.payment_number,
                posting_date=pe.posting_date,
                debit=settle_amount if pe.payment_type == "RECEIVE" else 0.0,
                credit=settle_amount if pe.payment_type == "PAY" else 0.0,
                paid_amount=pe.paid_amount,
            )
            ple.set_party(pe.party)
            ple.save()

        # Settle referenced invoices (reduce outstanding, close fully-paid bills)
        remaining = settle_amount
        for ref in pe.references.select_for_update():
            if remaining <= 0:
                break
            settle = min(remaining, ref.outstanding_amount)
            if settle <= 0:
                continue
            remaining -= settle
            ref.outstanding_amount -= settle
            ref.allocated_amount += settle
            ref.save(update_fields=["outstanding_amount", "allocated_amount", "updated_at"])

            if ref.outstanding_amount <= 0 and ref.voucher_id:
                invoice = PurchaseInvoice.objects.filter(pk=ref.voucher_id).first()
                if invoice is not None and invoice.status != "PAID":
                    invoice.status = "PAID"
                    invoice.save(update_fields=["status", "updated_at"])

        pe.is_submitted = True
        pe.save(update_fields=["is_submitted", "updated_at"])
        logger.info(f"Payment Entry #{pe.payment_number} successfully posted.")
        return pe
