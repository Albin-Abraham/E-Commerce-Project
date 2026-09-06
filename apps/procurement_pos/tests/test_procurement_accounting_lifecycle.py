"""End-to-end lifecycle test: product knowledge -> PR -> PO -> GRN -> batch ->
inventory -> Purchase Invoice (3-way match) -> Payment Entry -> GL Ledger."""

from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase

from core.admin.models.company import Company
from apps.accounting.models.chart_of_accounts import Account
from apps.accounting.models.currency import Currency
from apps.accounting.models.journal_entry import GLEntry, JournalEntry, JournalEntryLine
from apps.accounting.models.payment_entry import PaymentEntry, PaymentEntryReference
from apps.accounting.models.tax import ItemTaxDetail, ItemTaxTemplate
from apps.accounting.workflows.posting_service import GLPostingService
from apps.customers.models.party_ledger import PartyLedgerEntry
from apps.procurement_pos.models.procurement import (
    GoodsReceivedNote,
    PurchaseInvoice,
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseRequest,
    RequestForQuotation,
    Supplier,
    VendorQuotation,
)
from apps.shop.infrastructure.models.inventory import Batch, Inventory
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant
from apps.shop.infrastructure.models.warehouse import Warehouse


class ProcurementAccountingLifecycleTestCase(TestCase):
    """Product knowledge -> procurement -> receipt (batches) -> accounting -> GL ledger."""

    def _seq(self):
        seq = getattr(self, "_seq_counter", 0) + 1
        self._seq_counter = seq
        return seq

    def _company(self, name):
        return Company.objects.create(name=name, code=name.upper().replace(" ", "-")[:20])

    def _currency(self, code="USD"):
        return Currency.objects.create(code=code, name=code)

    def _account(self, code, company, root_type="ASSET"):
        return Account.objects.create(
            account_code=f"{code}-{self._seq()}",
            account_name=f"{code} Account",
            company=company,
            root_type=root_type,
        )

    def _user(self, username):
        from django.contrib.auth import get_user_model
        return get_user_model().objects.create_user(
            username=username, email=f"{username}@example.com", password="password123"
        )

    def _warehouse(self, company):
        seq = self._seq()
        return Warehouse.objects.create(
            name=f"Main Warehouse {seq}",
            code=f"WH-{seq:03}",
            company=company,
        )

    def _supplier(self, name):
        seq = self._seq()
        return Supplier.objects.create(name=name, code=f"SUP-{seq:03}")

    def _item_tax(self, company, account, rate=5):
        template = ItemTaxTemplate.objects.create(
            title=f"Item Tax {self._seq()}%",
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

    def _product(self, company, item_tax=None):
        seq = self._seq()
        product = Product.objects.create(
            name=f"Vitamin C Tablets {seq}",
            sku=f"VITC-{seq:04}",
            price=Decimal("100.00"),
            company=company,
            item_tax_template=item_tax,
        )
        variant = ProductVariant.objects.create(
            product=product,
            sku=f"VITC-{seq:04}-250MG",
            price=Decimal("100.00"),
        )
        return product, variant

    # --------------------------------------------------- product knowledge

    def test_product_knowledge_master_data(self):
        company = self._company("MedSupply Co")
        tax_account = self._account("2100-VAT", company)
        item_tax = self._item_tax(company, tax_account, rate=5)

        product, variant = self._product(company, item_tax)

        self.assertTrue(product.sku.startswith("VITC-"))
        self.assertEqual(product.price, Decimal("100.00"))
        self.assertEqual(product.status, "ACTIVE")
        self.assertTrue(product.is_active)
        self.assertEqual(product.item_tax_template_id, item_tax.id, "product knowledge links its item tax template")

        self.assertEqual(variant.product_id, product.id)
        self.assertEqual(product.variants.count(), 1)
        self.assertEqual(variant.price, Decimal("100.00"))
        self.assertIn(variant, list(product.variants.all()))

    # --------------------------------------------------------------- request

    def test_purchase_request_auto_generates_number(self):
        user = self._user("requester_flow")
        pr = PurchaseRequest.objects.create(requested_by=user)
        pr.refresh_from_db()
        self.assertTrue(pr.request_number.startswith("PR-"), "PR number auto-generated")
        self.assertEqual(pr.status, "DRAFT")

    # ---------------------------------------------------------------- order

    def test_purchase_order_with_items_totals(self):
        company = self._company("PurchaseFlow Co")
        warehouse = self._warehouse(company)
        supplier = self._supplier("Chem Distributors")
        _, variant = self._product(company)
        user = self._user("po_maker")

        po = PurchaseOrder.objects.create(
            supplier=supplier,
            total_amount=Decimal("250.00"),
            expected_delivery_date=date.today() + timedelta(days=21),
            created_by=user,
        )
        item = PurchaseOrderItem.objects.create(
            purchase_order=po,
            variant=variant,
            quantity_ordered=10,
            unit_cost=Decimal("25.00"),
        )

        po.refresh_from_db()
        item.refresh_from_db()
        self.assertTrue(po.po_number.startswith("PO-"))
        self.assertEqual(po.status, "DRAFT")
        self.assertEqual(item.quantity_received, 0)
        self.assertEqual(item.total_cost, Decimal("250.00"), "qty x unit cost")
        self.assertEqual(po.total_amount, Decimal("250.00"))

    # ------------------------------------------------------------------ grn

    def test_grn_receipt_updates_inventory_and_completes_po(self):
        company = self._company("GrnFlow Co")
        warehouse = self._warehouse(company)
        supplier = self._supplier("Warehouse Goods Co")
        _, variant = self._product(company)

        po = PurchaseOrder.objects.create(supplier=supplier, total_amount=Decimal("250.00"))
        PurchaseOrderItem.objects.create(
            purchase_order=po, variant=variant, quantity_ordered=10, unit_cost=Decimal("25.00"),
        )

        grn = GoodsReceivedNote.objects.create(purchase_order=po, warehouse=warehouse)
        GoodsReceivedNote.process_grn_receipt(grn.id)

        grn.refresh_from_db()
        po.refresh_from_db()
        self.assertTrue(grn.grn_number.startswith("GRN-"))
        self.assertEqual(grn.status, "COMPLETED")
        self.assertEqual(po.status, "COMPLETED")

        item = po.items.get()
        self.assertEqual(item.quantity_received, 10)

        inv = Inventory.objects.get(variant=variant, warehouse=warehouse, batch__isnull=True)
        self.assertEqual(inv.quantity, 10, "GRN receipt adds ordered quantity to stock")

    # ---------------------------------------------------------------- batch

    def test_batch_management_on_received_lot(self):
        company = self._company("BatchFlow Co")
        warehouse = self._warehouse(company)
        supplier = self._supplier("Vita Labs")
        _, variant = self._product(company)

        po = PurchaseOrder.objects.create(supplier=supplier, total_amount=Decimal("250.00"))
        PurchaseOrderItem.objects.create(
            purchase_order=po, variant=variant, quantity_ordered=10, unit_cost=Decimal("25.00"),
        )
        grn = GoodsReceivedNote.objects.create(purchase_order=po, warehouse=warehouse)
        GoodsReceivedNote.process_grn_receipt(grn.id)
        inv = Inventory.objects.get(variant=variant, warehouse=warehouse, batch__isnull=True)

        batch = Batch.objects.create(
            batch_number=f"LOT-2026-{self._seq():03}",
            variant=variant,
            manufacturing_date=date.today() - timedelta(days=10),
            expiry_date=date.today() + timedelta(days=365),
            supplier=supplier,
        )
        inv.batch = batch
        inv.unit_cost = Decimal("25.0000")
        inv.valuation_currency = self._currency()
        inv.save()

        batch.refresh_from_db()
        inv.refresh_from_db()
        self.assertEqual(inv.batch_id, batch.id, "received lot is tracked against its batch")
        self.assertFalse(batch.is_expired)
        self.assertEqual(batch.supplier_id, supplier.id)
        self.assertEqual(inv.available_quantity, 10)

        Inventory.reserve_stock(inv.id, 4)
        inv.refresh_from_db()
        self.assertEqual(inv.available_quantity, 6, "reservation reduces available qty")

        Inventory.commit_stock(inv.id, 2)
        inv.refresh_from_db()
        self.assertEqual(inv.quantity, 8, "commit consumes sold stock")
        self.assertEqual(inv.reserved_quantity, 2)
        self.assertEqual(inv.available_quantity, 6)

        duplicate = Batch(batch_number=batch.batch_number, variant=variant)
        rule = next(r for r in duplicate._rules.get("batch_number", []) if r.__class__.__name__ == "UniqueRule")
        self.assertFalse(rule.check(duplicate), "batch numbers must be unique")

    # --------------------------------------------------------------- invoice

    def test_purchase_invoice_three_way_match(self):
        company = self._company("MatchCo")
        warehouse = self._warehouse(company)
        supplier = self._supplier("Invoice Goods Co")
        _, variant = self._product(company)

        po = PurchaseOrder.objects.create(supplier=supplier, total_amount=Decimal("250.00"))
        PurchaseOrderItem.objects.create(
            purchase_order=po, variant=variant, quantity_ordered=10, unit_cost=Decimal("25.00"),
        )
        grn = GoodsReceivedNote.objects.create(purchase_order=po, warehouse=warehouse)
        GoodsReceivedNote.process_grn_receipt(grn.id)

        pi = PurchaseInvoice.objects.create(
            purchase_order=po,
            goods_received_note=grn,
            supplier=supplier,
            billed_amount=Decimal("250.00"),
        )
        matched = PurchaseInvoice.execute_three_way_match(pi.id)

        pi.refresh_from_db()
        self.assertTrue(matched)
        self.assertTrue(pi.invoice_number.startswith("PI-"))
        self.assertEqual(pi.status, "MATCHED", "PO total == GRN received == invoice amount")

        mismatch = PurchaseInvoice.objects.create(
            purchase_order=po,
            goods_received_note=grn,
            supplier=supplier,
            billed_amount=Decimal("999.00"),
        )
        succeeded = PurchaseInvoice.execute_three_way_match(mismatch.id)
        mismatch.refresh_from_db()
        self.assertFalse(succeeded)
        self.assertEqual(mismatch.status, "MISMATCH", "billed amount drift is flagged")

    # ----------------------------------------------------------- accounting

    def test_payment_entry_posted_to_gl_ledger(self):
        company = self._company("PaymentFlow Co")
        cash = self._account("1000-CASH", company)
        ap = self._account("2000-AP", company, root_type="LIABILITY")
        supplier = self._supplier("Payable Supplier Co")
        user = self._user("paymaster")

        pe = PaymentEntry.objects.create(
            company=company,
            payment_type="PAY",
            posting_date=date.today(),
            paid_from_account=cash,
            paid_to_account=ap,
            paid_amount=Decimal("250.00"),
            received_amount=Decimal("250.00"),
            reference_number=f"CHQ-{self._seq():05}",
        )
        pe.set_party(supplier)
        pe.save()

        PaymentEntryReference.objects.create(
            payment_entry=pe,
            voucher_type="Purchase Invoice",
            voucher_no="PI-TEST-0001",
            voucher_id="piv_test_1",
            total_amount=Decimal("250.00"),
            outstanding_amount=Decimal("250.00"),
            allocated_amount=Decimal("250.00"),
        )

        posted = GLPostingService.post_payment_entry(pe.id)
        pe.refresh_from_db()
        self.assertTrue(pe.payment_number.startswith("PE-"))
        self.assertTrue(posted.is_submitted)

        entries = list(
            GLEntry.objects.filter(voucher_type="Payment Entry", voucher_id=str(pe.id))
        )
        self.assertEqual(len(entries), 2, "payment posts one debit and one credit")
        dr = next(e for e in entries if e.debit)
        cr = next(e for e in entries if e.credit)
        self.assertEqual(dr.account_id, ap.id, "Dr AP on a vendor payment")
        self.assertEqual(dr.debit, Decimal("250.00"))
        self.assertEqual(cr.account_id, cash.id, "Cr Cash/Bank")
        self.assertEqual(cr.credit, Decimal("250.00"))
        self.assertEqual(sum(e.debit for e in entries), sum(e.credit for e in entries), "GL stays balanced")
        self.assertEqual(dr.voucher_no, pe.payment_number)

        ple = PartyLedgerEntry.objects.filter(voucher_type="PAYMENT_ENTRY", voucher_id=str(pe.id)).get()
        self.assertEqual(ple.party_id, str(supplier.pk), "party ledger tracks the vendor")
        self.assertEqual(ple.credit, Decimal("250.00"))

    def test_journal_entry_posted_to_gl_ledger(self):
        company = self._company("JournalFlow Co")
        stock = self._account("1400-STOCK", company)
        ap = self._account("2000-AP", company, root_type="LIABILITY")
        supplier = self._supplier("Accrual Supplier Co")
        user = self._user("journaler")

        jv = JournalEntry.objects.create(company=company, posting_date=date.today())
        stock_line = JournalEntryLine.objects.create(
            journal_entry=jv, account=stock, debit=Decimal("250.00"), credit=Decimal("0.00"),
            user_remark="Goods received"
        )
        ap_line = JournalEntryLine.objects.create(
            journal_entry=jv, account=ap, debit=Decimal("0.00"), credit=Decimal("250.00"),
            user_remark="Vendor accrual"
        )
        ap_line.set_party(supplier)
        ap_line.save()

        jv.total_debit = Decimal("250.00")
        jv.total_credit = Decimal("250.00")
        jv.save()

        posted = GLPostingService.post_journal_entry(jv.id)
        jv.refresh_from_db()
        self.assertTrue(posted.is_posted)
        self.assertTrue(jv.entry_number.startswith("JV-"))

        entries = list(
            GLEntry.objects.filter(voucher_type="Journal Entry", voucher_id=str(jv.id))
        )
        self.assertEqual(len(entries), 2)
        dr = next(e for e in entries if e.debit)
        cr = next(e for e in entries if e.credit)
        self.assertEqual(dr.account_id, stock.id)
        self.assertEqual(cr.account_id, ap.id)
        self.assertEqual(sum(e.debit for e in entries), sum(e.credit for e in entries))

        ple = PartyLedgerEntry.objects.filter(voucher_type="JOURNAL_ENTRY", voucher_id=str(jv.id)).get()
        self.assertEqual(ple.party_id, str(supplier.pk))
        self.assertEqual(ple.credit, Decimal("250.00"), "AP accrual credits the vendor ledger")

    # ----------------------------------------------------------- full chain

    def test_full_purchase_to_payment_lifecycle(self):
        company = self._company("Lifecycle Co")
        warehouse = self._warehouse(company)
        supplier = self._supplier("Lifecycle Goods Co")
        cash = self._account("1000-CASH", company)
        ap = self._account("2000-AP", company, root_type="LIABILITY")
        user = self._user("lifecycle_ops")

        product, variant = self._product(company)

        # 1. Requisition
        pr = PurchaseRequest.objects.create(requested_by=user)
        pr.refresh_from_db()
        self.assertTrue(pr.request_number.startswith("PR-"))

        # 2. Purchase Order (traced back to the requisition)
        po = PurchaseOrder.objects.create(
            supplier=supplier, total_amount=Decimal("250.00"), purchase_request=pr,
        )
        pr.mark_po_created()
        pr.refresh_from_db()
        self.assertEqual(pr.status, "PO_CREATED")
        self.assertEqual(po.purchase_request_id, pr.pk)
        PurchaseOrderItem.objects.create(
            purchase_order=po, variant=variant, quantity_ordered=10, unit_cost=Decimal("25.00"),
        )
        po.refresh_from_db()
        self.assertTrue(po.po_number.startswith("PO-"))

        # 3. Goods Received Note -> stock in + batch
        grn = GoodsReceivedNote.objects.create(purchase_order=po, warehouse=warehouse)
        GoodsReceivedNote.process_grn_receipt(grn.id)
        batch = Batch.objects.create(
            batch_number=f"LOT-RCV-{self._seq():03}",
            variant=variant,
            expiry_date=date.today() + timedelta(days=180),
            supplier=supplier,
        )
        inv = Inventory.objects.get(variant=variant, warehouse=warehouse, batch__isnull=True)
        inv.batch = batch
        inv.save()

        self.assertEqual(inv.quantity, 10)
        self.assertEqual(inv.batch_id, batch.id)
        po.refresh_from_db()
        self.assertEqual(po.status, "COMPLETED")

        # 4. Invoice + 3-way match
        pi = PurchaseInvoice.objects.create(
            purchase_order=po, goods_received_note=grn, supplier=supplier,
            billed_amount=Decimal("250.00"),
        )
        self.assertTrue(PurchaseInvoice.execute_three_way_match(pi.id))
        pi.refresh_from_db()
        self.assertEqual(pi.status, "MATCHED")

        # 5. Payment settles the invoice -> GL ledger
        pe = PaymentEntry.objects.create(
            company=company,
            payment_type="PAY",
            posting_date=date.today(),
            paid_from_account=cash,
            paid_to_account=ap,
            paid_amount=Decimal("250.00"),
            received_amount=Decimal("250.00"),
        )
        pe.set_party(supplier)
        pe.save()
        PaymentEntryReference.objects.create(
            payment_entry=pe,
            voucher_type="Purchase Invoice",
            voucher_no=pi.invoice_number,
            voucher_id=str(pi.id),
            total_amount=Decimal("250.00"),
            outstanding_amount=Decimal("250.00"),
            allocated_amount=Decimal("250.00"),
        )
        GLPostingService.post_payment_entry(pe.id)

        entries = GLPostingService.post_payment_entry(pe.id)
        pe_gl = GLEntry.objects.filter(voucher_type="Payment Entry", voucher_id=str(pe.id))
        self.assertEqual(pe_gl.count(), 2)
        self.assertEqual(sum(e.debit for e in pe_gl), sum(e.credit for e in pe_gl))

        # Ledger lives on: account-level GL records + party-level AR/AP trail
        self.assertEqual(GLEntry.objects.filter(company=company, account=ap, debit__gt=0).count(), 1)
        self.assertEqual(PartyLedgerEntry.objects.filter(company=company, party_id=str(supplier.pk)).count(), 1)

    # ------------------------------------------- workflow-gap regressions

    def test_pr_rfq_vendor_quotation_to_po_traceability(self):
        company = self._company("Traceable Co")
        supplier = self._supplier("Trace Supplier Co")
        user = self._user("trace_requester")

        pr = PurchaseRequest.objects.create(requested_by=user)
        self.assertEqual(pr.submit().status, "SUBMITTED")
        self.assertEqual(pr.approve().status, "APPROVED")

        rfq = RequestForQuotation.objects.create(purchase_request=pr)
        rfq.refresh_from_db()
        self.assertTrue(rfq.rfq_number.startswith("RFQ-"))

        vq = VendorQuotation.objects.create(
            rfq=rfq, supplier=supplier,
            quotation_number=f"QUO-{self._seq():05}",
            total_quoted_price=Decimal("250.00"),
            is_selected=True,
        )
        po = PurchaseOrder.objects.create(
            supplier=supplier,
            total_amount=Decimal("250.00"),
            purchase_request=pr,
            vendor_quotation=vq,
        )
        self.assertEqual(pr.mark_po_created().status, "PO_CREATED")

        self.assertEqual(po.purchase_request_id, pr.pk, "PO traces to requisition")
        self.assertEqual(po.vendor_quotation_id, vq.pk, "PO traces to selected quote")
        self.assertEqual(vq.rfq_id, rfq.pk, "quote traces to its RFQ")
        self.assertEqual(rfq.purchase_request_id, pr.pk, "RFQ traces to its requisition")

    def test_journal_posting_rejects_unbalanced_lines(self):
        company = self._company("BalancedCo")
        stock = self._account("1400-STOCK", company)
        ap = self._account("2000-AP", company, root_type="LIABILITY")

        jv = JournalEntry.objects.create(company=company, posting_date=date.today())
        JournalEntryLine.objects.create(journal_entry=jv, account=stock, debit=Decimal("250.00"))
        JournalEntryLine.objects.create(journal_entry=jv, account=ap, credit=Decimal("200.00"))
        jv.total_debit = Decimal("250.00")
        jv.total_credit = Decimal("200.00")
        jv.save()

        with self.assertRaises(ValueError):
            GLPostingService.post_journal_entry(jv.id)
        self.assertFalse(GLEntry.objects.filter(voucher_id=str(jv.id)).exists())

    def test_journal_posting_rejects_stale_header_totals(self):
        company = self._company("HeaderCo")
        stock = self._account("1400-STOCK", company)
        ap = self._account("2000-AP", company, root_type="LIABILITY")

        jv = JournalEntry.objects.create(company=company, posting_date=date.today())
        JournalEntryLine.objects.create(journal_entry=jv, account=stock, debit=Decimal("250.00"))
        JournalEntryLine.objects.create(journal_entry=jv, account=ap, credit=Decimal("250.00"))
        jv.total_debit = Decimal("300.00")
        jv.total_credit = Decimal("300.00")
        jv.save()

        with self.assertRaises(ValueError):
            GLPostingService.post_journal_entry(jv.id)

    def test_payment_entry_settles_reference_and_marks_invoice_paid(self):
        company = self._company("SettleCo")
        warehouse = self._warehouse(company)
        supplier = self._supplier("Settle Supplier Co")
        cash = self._account("1000-CASH", company)
        ap = self._account("2000-AP", company, root_type="LIABILITY")
        _, variant = self._product(company)

        po, item = self._buy(company, warehouse, variant, supplier)
        pi = self._matched_invoice(company, warehouse, po, supplier, Decimal("250.00"))

        pe = PaymentEntry.objects.create(
            company=company, payment_type="PAY", posting_date=date.today(),
            paid_from_account=cash, paid_to_account=ap,
            paid_amount=Decimal("250.00"), received_amount=Decimal("250.00"),
        )
        pe.set_party(supplier)
        pe.save()
        ref = PaymentEntryReference.objects.create(
            payment_entry=pe, voucher_type="Purchase Invoice",
            voucher_no=pi.invoice_number, voucher_id=str(pi.id),
            total_amount=Decimal("250.00"), outstanding_amount=Decimal("250.00"),
            allocated_amount=Decimal("0.00"),
        )
        GLPostingService.post_payment_entry(pe.id)

        ref.refresh_from_db()
        pi.refresh_from_db()
        self.assertEqual(ref.outstanding_amount, 0, "invoice fully settled")
        self.assertEqual(ref.allocated_amount, Decimal("250.00"))
        self.assertEqual(pi.status, "PAID", "3-way matched invoice flips to PAID on settlement")

    def test_partial_payment_keeps_invoice_open_until_settled(self):
        company = self._company("InstallmentCo")
        warehouse = self._warehouse(company)
        supplier = self._supplier("Installment Supplier Co")
        cash = self._account("1000-CASH", company)
        ap = self._account("2000-AP", company, root_type="LIABILITY")
        _, variant = self._product(company)

        po, item = self._buy(company, warehouse, variant, supplier)
        pi = self._matched_invoice(company, warehouse, po, supplier, Decimal("250.00"))

        def pay(amount, outstanding):
            pe = PaymentEntry.objects.create(
                company=company, payment_type="PAY", posting_date=date.today(),
                paid_from_account=cash, paid_to_account=ap,
                paid_amount=amount, received_amount=amount,
            )
            pe.set_party(supplier)
            pe.save()
            return PaymentEntryReference.objects.create(
                payment_entry=pe, voucher_type="Purchase Invoice",
                voucher_no=pi.invoice_number, voucher_id=str(pi.id),
                total_amount=Decimal("250.00"), outstanding_amount=outstanding,
                allocated_amount=Decimal("0.00"),
            )

        ref1 = pay(Decimal("100.00"), Decimal("250.00"))
        GLPostingService.post_payment_entry(ref1.payment_entry_id)
        ref1.refresh_from_db()
        pi.refresh_from_db()
        self.assertEqual(ref1.outstanding_amount, Decimal("150.00"))
        self.assertEqual(pi.status, "MATCHED", "not yet fully paid")

        ref2 = pay(Decimal("150.00"), ref1.outstanding_amount)
        GLPostingService.post_payment_entry(ref2.payment_entry_id)
        ref2.refresh_from_db()
        pi.refresh_from_db()
        self.assertEqual(ref2.outstanding_amount, 0)
        self.assertEqual(pi.status, "PAID")

    def test_payment_posting_rejects_zero_settle_amount(self):
        company = self._company("ZeroCo")
        cash = self._account("1000-CASH", company)
        ap = self._account("2000-AP", company, root_type="LIABILITY")
        supplier = self._supplier("Zero Supplier Co")

        pe = PaymentEntry.objects.create(
            company=company, payment_type="PAY", posting_date=date.today(),
            paid_from_account=cash, paid_to_account=ap,
            paid_amount=Decimal("0.00"), received_amount=Decimal("0.00"),
        )
        pe.set_party(supplier)
        pe.save()
        with self.assertRaises(ValueError):
            GLPostingService.post_payment_entry(pe.id)

    def _buy(self, company, warehouse, variant, supplier):
        po = PurchaseOrder.objects.create(supplier=supplier, total_amount=Decimal("250.00"))
        item = PurchaseOrderItem.objects.create(
            purchase_order=po, variant=variant, quantity_ordered=10, unit_cost=Decimal("25.00"),
        )
        grn = GoodsReceivedNote.objects.create(purchase_order=po, warehouse=warehouse)
        GoodsReceivedNote.process_grn_receipt(grn.id)
        return po, item

    def _matched_invoice(self, company, warehouse, po, supplier, billed_amount):
        pi = PurchaseInvoice.objects.create(
            purchase_order=po,
            goods_received_note=po.grns.first(),
            supplier=supplier,
            billed_amount=billed_amount,
        )
        self.assertTrue(PurchaseInvoice.execute_three_way_match(pi.id))
        pi.refresh_from_db()
        self.assertEqual(pi.status, "MATCHED")
        return pi