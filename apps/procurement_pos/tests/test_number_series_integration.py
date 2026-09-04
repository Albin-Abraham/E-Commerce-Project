import pytest
from unittest.mock import MagicMock
from django.test import TestCase

from core.base_models.services.number_series import NumberSeriesRegistry, NumberSeriesService
from apps.procurement_pos.models.procurement import (
    Supplier,
    PurchaseRequest,
    RequestForQuotation,
    PurchaseOrder,
    GoodsReceivedNote,
    PurchaseInvoice,
)
from apps.procurement_pos.models.selling import (
    SalesOrder,
    DeliveryNote,
    SalesInvoice,
)
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.inventory import SerialNumber, StockTransfer
from apps.customers.models.customer import Customer


class NumberSeriesIntegrationTestCase(TestCase):
    """
    Test suite verifying seamless integration of NumberSeriesService
    across Procurement, Selling, Inventory, and Customer entities.
    """

    def test_registry_contains_all_domain_document_types(self):
        registered_types = NumberSeriesRegistry.enabled_document_types()
        expected_types = {
            "purchase_request",
            "rfq",
            "purchase_order",
            "grn",
            "purchase_invoice",
            "sales_order",
            "delivery_note",
            "sales_invoice",
            "item",
            "serial_number",
            "stock_transfer",
            "vendor",
            "customer",
        }
        for doc_type in expected_types:
            self.assertIn(doc_type, registered_types)

    def test_number_series_service_next_sequence_generation(self):
        seq1 = NumberSeriesService.next("purchase_order")
        seq2 = NumberSeriesService.next("purchase_order")
        self.assertTrue(seq1.startswith("PO-"))
        self.assertTrue(seq2.startswith("PO-"))
        self.assertNotEqual(seq1, seq2)

    def test_procurement_models_auto_generate_numbers(self):
        # Supplier code auto-generation
        supplier = Supplier(name="Acme Industrial")
        supplier.save()
        self.assertTrue(supplier.code.startswith("VEN-"))

        # PurchaseRequest number auto-generation
        user_mock = MagicMock()
        user_mock.id = "user_1"
        user_mock.username = "procurement_officer"
        
        pr = PurchaseRequest(requested_by=user_mock)
        pr.save()
        self.assertTrue(pr.request_number.startswith("PR-"))

        # RequestForQuotation number auto-generation
        rfq = RequestForQuotation(purchase_request=pr)
        rfq.save()
        self.assertTrue(rfq.rfq_number.startswith("RFQ-"))

        # PurchaseOrder number auto-generation
        po = PurchaseOrder(supplier=supplier, created_by=user_mock)
        po.save()
        self.assertTrue(po.po_number.startswith("PO-"))

        # GoodsReceivedNote number auto-generation
        warehouse_mock = MagicMock()
        warehouse_mock.name = "Central Warehouse"
        grn = GoodsReceivedNote(purchase_order=po, warehouse=warehouse_mock)
        grn.save()
        self.assertTrue(grn.grn_number.startswith("GRN-"))

        # PurchaseInvoice number auto-generation
        pi = PurchaseInvoice(purchase_order=po, supplier=supplier, billed_amount=100.00)
        pi.save()
        self.assertTrue(pi.invoice_number.startswith("PI-"))

    def test_selling_models_auto_generate_numbers(self):
        # SalesOrder order_number auto-generation
        so = SalesOrder(total_amount=250.00)
        so.save()
        self.assertTrue(so.order_number.startswith("SO-"))

        # DeliveryNote delivery_number auto-generation
        warehouse_mock = MagicMock()
        dn = DeliveryNote(sales_order=so, warehouse=warehouse_mock)
        dn.save()
        self.assertTrue(dn.delivery_number.startswith("DN-"))

        # SalesInvoice invoice_number auto-generation
        sinv = SalesInvoice(sales_order=so, grand_total=250.00)
        sinv.save()
        self.assertTrue(sinv.invoice_number.startswith("INV-"))

    def test_inventory_models_auto_generate_numbers(self):
        # Product SKU auto-generation
        product = Product(name="Wireless Mouse", slug="wireless-mouse", price=29.99)
        product.save()
        self.assertTrue(product.sku.startswith("ITEM-"))

        # SerialNumber auto-generation
        variant_mock = MagicMock()
        variant_mock.sku = product.sku
        sn = SerialNumber(variant=variant_mock)
        sn.save()
        self.assertTrue(sn.serial_number.startswith("SN-"))

        # StockTransfer transfer_number auto-generation
        wh_a = MagicMock()
        wh_a.name = "Warehouse A"
        wh_b = MagicMock()
        wh_b.name = "Warehouse B"
        st = StockTransfer(from_warehouse=wh_a, to_warehouse=wh_b)
        st.save()
        self.assertTrue(st.transfer_number.startswith("TRF-"))

    def test_customer_model_auto_generates_code(self):
        customer = Customer(name="Global Tech Corp")
        customer.save()
        self.assertTrue(customer.customer_code.startswith("CUST-"))

    def test_manual_override_preserves_custom_number(self):
        custom_po_number = "CUSTOM-PO-9999"
        supplier = Supplier(name="Custom Vendor")
        supplier.save()
        
        user_mock = MagicMock()
        po = PurchaseOrder(po_number=custom_po_number, supplier=supplier, created_by=user_mock)
        po.save()
        self.assertEqual(po.po_number, custom_po_number)

    def test_selling_model_str_formatting_handles_currency(self):
        so = SalesOrder(order_number="SO-2026-00001", total_amount=150.00)
        self.assertIn("SO #SO-2026-00001 ($150.0)", str(so))

        sinv = SalesInvoice(invoice_number="INV-2026-00001", grand_total=500.00)
        self.assertIn("Sales Invoice #INV-2026-00001 ($500.0)", str(sinv))

    def test_base_apiview_mixins_injection(self):
        from core.base_views.mixins import NumberSeriesInjectionMixin, CurrencyInjectionMixin

        class MockView(NumberSeriesInjectionMixin, CurrencyInjectionMixin):
            document_type = "sales_order"

        view = MockView()
        request = MagicMock()
        request.session = {}

        data = view.pre_create(request, {"total_amount": 99.00})
        self.assertIn("order_number", data)
        self.assertTrue(data["order_number"].startswith("SO-"))
        self.assertIn("currency", data)
