"""
Comprehensive End-to-End Test Suite for ZenOS Unified Commerce:
Product Master Catalog -> KB Pitch Enrichment -> Procurement GRN -> POS Edge -> Inventory Ledger -> Accounting GL.
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounting.models.chart_of_accounts import Account
from apps.accounting.models.currency import Currency
from apps.accounting.models.journal_entry import GLEntry, JournalEntry
from apps.knowledgebase.models.kb import KnowledgeArticle, KnowledgeCategory, ProductKnowledgeLink
from apps.procurement_pos.models.pos import POSRegister, POSSession
from apps.procurement_pos.models.procurement import (
    GoodsReceivedNote,
    PurchaseOrder,
    PurchaseOrderItem,
    Supplier,
)
from apps.procurement_pos.workflows.pos_checkout_workflow import POSCheckoutWorkflow
from apps.shop.infrastructure.models.events import DomainEventOutbox
from apps.shop.infrastructure.models.inventory import Inventory, StockMovement
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant
from apps.shop.infrastructure.models.warehouse import Warehouse
from core.admin.models.branch import Branch
from core.admin.models.business_unit import BusinessUnit
from core.admin.models.company import Company


class POSInventoryAccountingLifecycleTestCase(TestCase):
    """
    Tests the 12 critical production requirements across the Unified Commerce pipeline:
    1. Product & Variant Registration with Barcode
    2. KB Article Linkage (CASHIER_PITCH)
    3. Inbound Procurement via GRN (creating StockMovement)
    4. POS Barcode Lookup Endpoint (Price, Warehouse Stock, Pitch)
    5. POS Barcode Lookup Graceful Degradation
    6. Atomic POS Checkout & Stock Decrement (StockMovement audit)
    7. Overselling Prevention (Invariant enforcement)
    8. Idempotent Checkout Submissions (Zero double deductions)
    9. Outbox Event Generation
    10. Balanced GL Posting (Revenue, Tax, COGS, Stock in Hand)
    11. Multi-Location Warehouse Isolation
    12. Session State Validation (Closed session rejection)
    """

    def setUp(self):
        self.client = APIClient()
        self.seq = 0

        # Company, Business Unit & Branch
        self.company = Company.objects.create(name="ZenOS Retail Corp", code="ZEN-RET")
        self.bu = BusinessUnit.objects.create(name="Retail Division", company=self.company)
        self.branch = Branch.objects.create(
            name="Downtown Store",
            code="BR-DT-01",
            company=self.company,
            business_unit=self.bu,
            location="US",
            opened_date="2024-01-01",
        )

        # Currency
        self.currency = Currency.objects.create(code="USD", name="US Dollar")

        # Warehouses (Multi-location)
        self.warehouse_a = Warehouse.objects.create(
            name="Downtown Store Shelf",
            code="WH-DT-01",
            company=self.company,
        )
        self.warehouse_b = Warehouse.objects.create(
            name="Suburban Hub",
            code="WH-SUB-01",
            company=self.company,
        )

        # Users
        User = get_user_model()
        self.cashier = User.objects.create_user(
            username="cashier_jane", email="jane@zenos.io", password="password123"
        )
        self.client.force_authenticate(user=self.cashier)

        # Chart of Accounts for Financial Posting
        self.cash_account = Account.objects.create(
            account_code="1000-CASH",
            account_name="Cash on Hand",
            root_type="ASSET",
            account_type="CASH",
            company=self.company,
        )
        self.revenue_account = Account.objects.create(
            account_code="4000-SALES",
            account_name="Sales Revenue",
            root_type="INCOME",
            company=self.company,
        )
        self.tax_account = Account.objects.create(
            account_code="2100-VAT",
            account_name="Output VAT Payable",
            root_type="LIABILITY",
            account_type="TAX",
            company=self.company,
        )
        self.cogs_account = Account.objects.create(
            account_code="5000-COGS",
            account_name="Cost of Goods Sold",
            root_type="EXPENSE",
            account_type="COST_OF_GOODS_SOLD",
            company=self.company,
        )
        self.stock_account = Account.objects.create(
            account_code="1400-STOCK",
            account_name="Stock in Hand",
            root_type="ASSET",
            account_type="STOCK_IN_HAND",
            company=self.company,
        )

        # POS Register & Session
        self.register = POSRegister.objects.create(
            name="Register 01",
            code="REG-01",
            warehouse=self.warehouse_a,
            branch=self.branch,
        )
        self.session = POSSession.objects.create(
            register=self.register,
            cashier=self.cashier,
            status="OPEN",
            opening_balance=Decimal("200.00"),
        )

    def _next_seq(self):
        self.seq += 1
        return self.seq

    def _create_catalog_item(self, barcode="8901234567890", price="100.00"):
        s = self._next_seq()
        product = Product.objects.create(
            name=f"Organic Immunity Vitamin C {s}",
            sku=f"VITC-{s:04}",
            price=Decimal(price),
            company=self.company,
        )
        variant = ProductVariant.objects.create(
            product=product,
            sku=f"VITC-{s:04}-250MG",
            barcode=barcode,
            price=Decimal(price),
        )
        return product, variant

    # 1. Product Master & Variant Identity
    def test_product_and_variant_registration_with_barcode(self):
        _, variant = self._create_catalog_item(barcode="8909990001", price="85.00")
        self.assertEqual(variant.barcode, "8909990001")
        self.assertEqual(variant.price, Decimal("85.00"))
        # Verify catalog creation does NOT create physical stock
        self.assertEqual(Inventory.objects.filter(variant=variant).count(), 0)

    # 2. Knowledge Base Pitch Enrichment
    def test_kb_article_linkage_cashier_pitch(self):
        product, variant = self._create_catalog_item(barcode="8909990002")
        category = KnowledgeCategory.objects.create(name="POS Sales Guides")
        article = KnowledgeArticle.objects.create(
            title="Immunity Booster Upsell Pitch",
            category=category,
            content="Suggest 2 bottles for 15% discount. Emphasize organic citrus source.",
            status="PUBLISHED",
        )
        link = ProductKnowledgeLink.objects.create(
            article=article,
            variant=variant,
            link_type="CASHIER_PITCH",
        )
        self.assertEqual(link.link_type, "CASHIER_PITCH")
        self.assertEqual(link.article.status, "PUBLISHED")

    # 3. Inbound Procurement via GRN & StockMovement Ledger
    def test_inbound_procurement_grn_creates_inventory_and_stock_movement(self):
        _, variant = self._create_catalog_item(barcode="8909990003")
        supplier = Supplier.objects.create(name="Pharma Supply Co", code="SUP-PHARMA")

        po = PurchaseOrder.objects.create(
            supplier=supplier,
            total_amount=Decimal("1000.00"),
            currency=self.currency,
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po,
            variant=variant,
            quantity_ordered=50,
            unit_cost=Decimal("20.00"),
        )

        grn = GoodsReceivedNote.objects.create(purchase_order=po, warehouse=self.warehouse_a)
        GoodsReceivedNote.process_grn_receipt(grn.id)

        # Assert inventory updated
        inv = Inventory.objects.get(variant=variant, warehouse=self.warehouse_a)
        self.assertEqual(inv.quantity, 50)
        self.assertEqual(inv.unit_cost, Decimal("20.00"))

        # Assert immutable StockMovement created
        movements = StockMovement.objects.filter(variant=variant, warehouse=self.warehouse_a)
        self.assertEqual(movements.count(), 1)
        sm = movements.first()
        self.assertEqual(sm.movement_type, StockMovement.MovementType.PURCHASE_RECEIPT)
        self.assertEqual(sm.quantity_delta, 50)
        self.assertEqual(sm.balance_after, 50)
        self.assertEqual(sm.unit_cost, Decimal("20.00"))
        self.assertEqual(sm.reference_type, "GoodsReceivedNote")

    # 4. POS Barcode Lookup Endpoint with Knowledge Pitch
    def test_pos_product_lookup_endpoint_returns_price_stock_and_pitch(self):
        product, variant = self._create_catalog_item(barcode="8909990004", price="120.00")
        # Ingest stock
        Inventory.objects.create(
            variant=variant,
            warehouse=self.warehouse_a,
            quantity=35,
            unit_cost=Decimal("60.00"),
        )
        # Attach pitch
        category = KnowledgeCategory.objects.create(name="Cashier Pitches")
        article = KnowledgeArticle.objects.create(
            title="Winter Promo",
            category=category,
            content="Pitch complimentary Vitamin D3 bundle.",
            status="PUBLISHED",
        )
        ProductKnowledgeLink.objects.create(
            article=article,
            variant=variant,
            link_type="CASHIER_PITCH",
        )

        url = f"/api/v1/pos/registers/{self.register.id}/product-lookup/?barcode=8909990004"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["variant_id"], str(variant.id))
        self.assertEqual(data["sku"], variant.sku)
        self.assertEqual(data["unit_price"], "120.00")
        self.assertEqual(data["warehouse_stock"]["available_quantity"], 35)
        self.assertTrue(len(data["cashier_pitches"]) >= 1)
        self.assertIn("Pitch complimentary Vitamin D3 bundle.", data["cashier_pitches"][0])

    # 5. POS Barcode Lookup Graceful Degradation Without KB Link
    def test_pos_product_lookup_graceful_degradation_without_kb(self):
        _, variant = self._create_catalog_item(barcode="8909990005", price="45.00")
        Inventory.objects.create(variant=variant, warehouse=self.warehouse_a, quantity=10)

        url = f"/api/v1/pos/registers/{self.register.id}/product-lookup/?barcode=8909990005"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["warehouse_stock"]["available_quantity"], 10)
        self.assertEqual(data["cashier_pitches"], [])

    # 6. Atomic POS Checkout, Stock Decrement & StockMovement Audit
    def test_atomic_pos_checkout_stock_decrement_and_stock_movement(self):
        _, variant = self._create_catalog_item(barcode="8909990006", price="50.00")
        Inventory.objects.create(
            variant=variant,
            warehouse=self.warehouse_a,
            quantity=30,
            unit_cost=Decimal("25.00"),
        )

        trx = POSCheckoutWorkflow.process_checkout(
            session=self.session,
            items_data=[{"variant_id": str(variant.id), "quantity": 4}],
            payment_method="CASH",
        )

        self.assertEqual(trx.status, "COMPLETED")
        self.assertEqual(trx.items.count(), 1)
        self.assertEqual(trx.total_amount, Decimal("200.00"))

        # Verify physical inventory decremented
        inv = Inventory.objects.get(variant=variant, warehouse=self.warehouse_a)
        self.assertEqual(inv.quantity, 26)

        # Verify StockMovement ledger entry
        sm = StockMovement.objects.filter(variant=variant, warehouse=self.warehouse_a).first()
        self.assertIsNotNone(sm)
        self.assertEqual(sm.movement_type, StockMovement.MovementType.POS_SALE)
        self.assertEqual(sm.quantity_delta, -4)
        self.assertEqual(sm.balance_after, 26)
        self.assertEqual(sm.reference_type, "POSTransaction")
        self.assertEqual(sm.reference_id, str(trx.id))

    # 7. Overselling Prevention (Invariant Enforcement)
    def test_pos_checkout_overselling_prevention(self):
        _, variant = self._create_catalog_item(barcode="8909990007", price="50.00")
        Inventory.objects.create(variant=variant, warehouse=self.warehouse_a, quantity=5)

        with self.assertRaises(ValidationError) as ctx:
            POSCheckoutWorkflow.process_checkout(
                session=self.session,
                items_data=[{"variant_id": str(variant.id), "quantity": 10}],
            )
        self.assertIn("Insufficient stock", str(ctx.exception))

        # Assert stock was untouched
        inv = Inventory.objects.get(variant=variant, warehouse=self.warehouse_a)
        self.assertEqual(inv.quantity, 5)

    # 8. Idempotent Checkout Submissions (Zero Double Deductions)
    def test_idempotent_checkout_submissions(self):
        _, variant = self._create_catalog_item(barcode="8909990008", price="50.00")
        Inventory.objects.create(variant=variant, warehouse=self.warehouse_a, quantity=20)

        idempotency_key = "idemp_unique_key_001"

        # First request
        trx1 = POSCheckoutWorkflow.process_checkout(
            session=self.session,
            items_data=[{"variant_id": str(variant.id), "quantity": 3}],
            idempotency_key=idempotency_key,
        )
        inv = Inventory.objects.get(variant=variant, warehouse=self.warehouse_a)
        self.assertEqual(inv.quantity, 17)

        # Second request with identical key
        trx2 = POSCheckoutWorkflow.process_checkout(
            session=self.session,
            items_data=[{"variant_id": str(variant.id), "quantity": 3}],
            idempotency_key=idempotency_key,
        )
        self.assertEqual(trx1.id, trx2.id)

        # Assert quantity was NOT decremented a second time
        inv.refresh_from_db()
        self.assertEqual(inv.quantity, 17)
        self.assertEqual(StockMovement.objects.filter(variant=variant).count(), 1)

    # 9. Outbox Event Generation
    def test_outbox_event_generation(self):
        _, variant = self._create_catalog_item(barcode="8909990009", price="60.00")
        Inventory.objects.create(variant=variant, warehouse=self.warehouse_a, quantity=15)

        trx = POSCheckoutWorkflow.process_checkout(
            session=self.session,
            items_data=[{"variant_id": str(variant.id), "quantity": 2}],
        )

        outbox_event = DomainEventOutbox.objects.filter(
            event_type="POS_TRANSACTION_COMPLETED",
            entity_id=str(trx.id),
        ).first()
        self.assertIsNotNone(outbox_event)
        self.assertEqual(outbox_event.status, DomainEventOutbox.EventStatus.PENDING)
        self.assertEqual(outbox_event.payload["transaction_number"], trx.transaction_number)

    # 10. Balanced General Ledger Financial Posting
    def test_balanced_gl_posting_revenue_tax_cogs(self):
        _, variant = self._create_catalog_item(barcode="8909990010", price="100.00")
        Inventory.objects.create(
            variant=variant,
            warehouse=self.warehouse_a,
            quantity=10,
            unit_cost=Decimal("40.00"),
        )

        trx = POSCheckoutWorkflow.process_checkout(
            session=self.session,
            items_data=[{"variant_id": str(variant.id), "quantity": 2}],
            payment_method="CASH",
            tax_amount=Decimal("10.00"),
        )

        # Total amount: 200.00, Tax: 10.00, Net revenue: 190.00
        # Total COGS: 2 * 40.00 = 80.00
        # Expected Header Total Dr/Cr = 200.00 + 80.00 = 280.00

        jv = JournalEntry.objects.filter(
            user_remark__contains=f"POS Transaction #{trx.transaction_number}"
        ).first()
        self.assertIsNotNone(jv, "JournalEntry should be automatically created for POS transaction")
        self.assertTrue(jv.is_posted, "JournalEntry should be posted to GL")
        self.assertEqual(jv.total_debit, Decimal("280.00"))
        self.assertEqual(jv.total_credit, Decimal("280.00"))

        gl_entries = list(GLEntry.objects.filter(voucher_id=str(jv.id)))
        self.assertTrue(len(gl_entries) >= 4)
        total_dr = sum(e.debit for e in gl_entries)
        total_cr = sum(e.credit for e in gl_entries)
        self.assertEqual(total_dr, Decimal("280.00"))
        self.assertEqual(total_cr, Decimal("280.00"))
        self.assertEqual(total_dr, total_cr, "GL debit must strictly equal credit")

    # 11. Multi-Location Warehouse Isolation
    def test_multi_location_warehouse_isolation(self):
        _, variant = self._create_catalog_item(barcode="8909990011", price="30.00")
        Inventory.objects.create(variant=variant, warehouse=self.warehouse_a, quantity=25)
        Inventory.objects.create(variant=variant, warehouse=self.warehouse_b, quantity=40)

        # Checkout at Register 01 (tied to Warehouse A)
        POSCheckoutWorkflow.process_checkout(
            session=self.session,
            items_data=[{"variant_id": str(variant.id), "quantity": 5}],
        )

        inv_a = Inventory.objects.get(variant=variant, warehouse=self.warehouse_a)
        inv_b = Inventory.objects.get(variant=variant, warehouse=self.warehouse_b)

        self.assertEqual(inv_a.quantity, 20, "Warehouse A decremented")
        self.assertEqual(inv_b.quantity, 40, "Warehouse B remained completely untouched")

    # 12. Session State Validation (Closed Session Rejection)
    def test_checkout_fails_on_closed_pos_session(self):
        closed_session = POSSession.objects.create(
            register=self.register,
            cashier=self.cashier,
            status="CLOSED",
        )
        _, variant = self._create_catalog_item(barcode="8909990012")
        Inventory.objects.create(variant=variant, warehouse=self.warehouse_a, quantity=10)

        with self.assertRaises(ValidationError) as ctx:
            POSCheckoutWorkflow.process_checkout(
                session=closed_session,
                items_data=[{"variant_id": str(variant.id), "quantity": 1}],
            )
        self.assertIn("must be OPEN", str(ctx.exception))
