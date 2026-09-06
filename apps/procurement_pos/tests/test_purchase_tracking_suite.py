"""Purchase Order tracking suite: PO status timeline, PO line fulfillment
(partial/full receipt), GRN line-level quantities, and delivery tracking."""

from datetime import date, timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase

from core.base_models.validators.rules import UniqueRule
from apps.procurement_pos.models.procurement import (
    GoodsReceivedNote,
    GoodsReceivedNoteLine,
    PurchaseInvoice,
    PurchaseOrder,
    PurchaseOrderItem,
    Supplier,
)
from apps.procurement_pos.models.tracking import (
    PurchaseOrderEvent,
    PurchaseOrderLineTracking,
)
from apps.shop.infrastructure.models.inventory import Inventory
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant
from apps.shop.infrastructure.models.warehouse import Warehouse


class PurchaseOrderTrackingTestCase(TestCase):

    def _seq(self):
        seq = getattr(self, "_seq_counter", 0) + 1
        self._seq_counter = seq
        return seq

    def _user(self, username):
        from django.contrib.auth import get_user_model
        return get_user_model().objects.create_user(
            username=username, email=f"{username}@example.com", password="password123"
        )

    def _supplier(self):
        seq = self._seq()
        return Supplier.objects.create(name=f"Track Supplier {seq}", code=f"SUP-T{seq:03}")

    def _warehouse(self):
        seq = self._seq()
        return Warehouse.objects.create(name=f"Track WH {seq}", code=f"WH-T{seq:03}")

    def _variant(self):
        seq = self._seq()
        product = Product.objects.create(
            name=f"Track Product {seq}", sku=f"TRK-{seq:04}", price="100.00",
        )
        return ProductVariant.objects.create(
            product=product, sku=f"TRK-{seq:04}-A", price="100.00",
        )

    def _po_with_item(self, quantity=10, total=250.00):
        po = PurchaseOrder.objects.create(supplier=self._supplier(), total_amount=str(total))
        item = PurchaseOrderItem.objects.create(
            purchase_order=po, variant=self._variant(),
            quantity_ordered=quantity, unit_cost=Decimal("25.00"),
        )
        return po, item

    def _grn(self, po, warehouse, lines=None):
        grn = GoodsReceivedNote.objects.create(purchase_order=po, warehouse=warehouse)
        for item, qty in (lines or []):
            GoodsReceivedNoteLine.objects.create(
                goods_received_note=grn,
                purchase_order_item=item,
                variant=item.variant,
                quantity_received=qty,
                unit_cost=item.unit_cost,
            )
        return grn

    # ------------------------------------------------- status timeline

    def test_po_status_lifecycle_records_tracking_events(self):
        po, _ = self._po_with_item()
        user = self._user("track_approver")

        self.assertEqual(po.status, "DRAFT")
        self.assertEqual(po.tracking_events.count(), 0)

        po.submit(user)
        po.approve(user)
        po.reject(user)

        events = list(po.tracking_events.all().order_by("created_at"))
        self.assertEqual([e.status for e in events], ["SUBMITTED", "APPROVED", "REJECTED"])
        self.assertEqual(events[0].changed_by_id, user.pk)
        self.assertEqual(events[0].description, "PO submitted to supplier")
        self.assertTrue(events[0].event_at)

        po.reject(user)
        self.assertEqual(po.tracking_events.count(), 3, "re-applying same status is idempotent")

        po.cancel(user)
        self.assertEqual(po.status, "CANCELLED")
        self.assertEqual(po.tracking_events.count(), 4)
        self.assertIsInstance(po.tracking_events.first(), PurchaseOrderEvent)

    # ------------------------------------------- PO line fulfillment

    def test_po_item_fulfillment_state_defaults(self):
        po, item = self._po_with_item(quantity=10)
        self.assertEqual(item.status, "PENDING")
        self.assertEqual(item.remaining_quantity, 10)
        self.assertFalse(item.is_fully_received)
        self.assertFalse(item.is_partially_received)

    def test_full_receipt_marks_line_received_and_po_completed(self):
        po, item = self._po_with_item(quantity=10)
        grn = self._grn(po, self._warehouse())

        GoodsReceivedNote.process_grn_receipt(grn.id)

        item.refresh_from_db()
        po.refresh_from_db()
        self.assertEqual(item.status, "RECEIVED")
        self.assertEqual(item.quantity_received, 10)
        self.assertEqual(item.remaining_quantity, 0)
        self.assertTrue(item.is_fully_received)
        self.assertEqual(po.status, "COMPLETED")
        self.assertEqual(
            po.tracking_events.filter(status="COMPLETED").count(), 1,
            "completion is tracked on the PO timeline",
        )

    def test_partial_receipt_tracks_line_and_po_progress(self):
        po, item = self._po_with_item(quantity=10)
        warehouse = self._warehouse()

        grn1 = self._grn(po, warehouse, [(item, 4)])
        GoodsReceivedNote.process_grn_receipt(grn1.id)

        item.refresh_from_db()
        po.refresh_from_db()
        self.assertEqual(item.status, "PARTIAL")
        self.assertEqual(item.quantity_received, 4)
        self.assertEqual(item.remaining_quantity, 6)
        self.assertTrue(item.is_partially_received)
        self.assertEqual(po.status, "PARTIALLY_RECEIVED")
        self.assertEqual(Inventory.objects.filter(variant=item.variant).first().quantity, 4)
        self.assertEqual(
            po.tracking_events.filter(status="PARTIALLY_RECEIVED").count(), 1
        )

        grn2 = self._grn(po, warehouse, [(item, 6)])
        GoodsReceivedNote.process_grn_receipt(grn2.id)

        item.refresh_from_db()
        po.refresh_from_db()
        self.assertEqual(item.status, "RECEIVED")
        self.assertEqual(item.quantity_received, 10)
        self.assertEqual(item.remaining_quantity, 0)
        self.assertFalse(item.is_partially_received)
        self.assertEqual(po.status, "COMPLETED")
        self.assertEqual(Inventory.objects.filter(variant=item.variant).first().quantity, 10)

    def test_multiple_lines_track_independently(self):
        po, item_a = self._po_with_item(quantity=5, total=125.00)
        item_b = PurchaseOrderItem.objects.create(
            purchase_order=po, variant=self._variant(),
            quantity_ordered=8, unit_cost=Decimal("10.00"),
        )
        warehouse = self._warehouse()

        grn = self._grn(po, warehouse, [(item_a, 5), (item_b, 3)])
        GoodsReceivedNote.process_grn_receipt(grn.id)

        item_a.refresh_from_db()
        item_b.refresh_from_db()
        po.refresh_from_db()
        self.assertEqual(item_a.status, "RECEIVED", "line A fully received")
        self.assertEqual(item_b.status, "PARTIAL", "line B still outstanding")
        self.assertEqual(item_b.remaining_quantity, 5)
        self.assertEqual(po.status, "PARTIALLY_RECEIVED", "PO waits on open line")

        grn2 = self._grn(po, warehouse, [(item_b, 5)])
        GoodsReceivedNote.process_grn_receipt(grn2.id)
        item_b.refresh_from_db()
        po.refresh_from_db()
        self.assertEqual(item_b.status, "RECEIVED")
        self.assertEqual(po.status, "COMPLETED")

    def test_grn_line_rejects_over_receiving(self):
        po, item = self._po_with_item(quantity=2)
        grn = self._grn(po, self._warehouse())
        with self.assertRaises(ValidationError):
            GoodsReceivedNoteLine.objects.create(
                goods_received_note=grn,
                purchase_order_item=item,
                variant=item.variant,
                quantity_received=5,
                unit_cost=item.unit_cost,
            )

    def test_grn_line_total_cost(self):
        po, item = self._po_with_item(quantity=10)
        grn = self._grn(po, self._warehouse())
        line = GoodsReceivedNoteLine.objects.create(
            goods_received_note=grn,
            purchase_order_item=item,
            variant=item.variant,
            quantity_received=4,
            unit_cost=Decimal("25.00"),
        )
        self.assertEqual(line.total_cost, 100.00)

    # ------------------------------------------------- line delivery

    def test_line_delivery_tracking(self):
        po, item = self._po_with_item(quantity=10)
        tracking = PurchaseOrderLineTracking.objects.create(
            purchase_order_item=item,
            carrier_name="FedEx",
            tracking_number=f"FDX-{self._seq():08}",
            expected_delivery_date=date.today() + timedelta(days=5),
        )

        self.assertEqual(tracking.status, "PENDING")
        self.assertFalse(tracking.is_delivered)
        self.assertFalse(tracking.is_delayed, "not yet due")

        tracking.status = "IN_TRANSIT"
        tracking.shipped_at = tracking.created_at
        tracking.expected_delivery_date = date.today() - timedelta(days=1)
        tracking.save(update_fields=["status", "shipped_at", "expected_delivery_date", "updated_at"])
        tracking.refresh_from_db()

        self.assertFalse(tracking.is_delivered)
        self.assertTrue(tracking.is_delayed, "ETA passed without delivery")
        self.assertEqual(tracking.line_status, "PENDING")

        tracking.mark_delivered()
        tracking.refresh_from_db()
        self.assertTrue(tracking.is_delivered)
        self.assertFalse(tracking.is_delayed)
        self.assertIsNotNone(tracking.delivered_at)

    def test_tracking_number_must_be_unique(self):
        po, item = self._po_with_item(quantity=10)
        PurchaseOrderLineTracking.objects.create(
            purchase_order_item=item, carrier_name="DHL", tracking_number="SHIP-0001",
        )
        duplicate = PurchaseOrderLineTracking(
            purchase_order_item=item, carrier_name="DHL", tracking_number="SHIP-0001",
        )
        rules = duplicate._rules.get("tracking_number", [])
        unique = next(r for r in rules if isinstance(r, UniqueRule))
        self.assertFalse(unique.check(duplicate), "tracking numbers must be unique")

    # ------------------------------------------- workflow-gap regressions

    def test_grn_rejects_cancelled_po(self):
        po, item = self._po_with_item(quantity=10)
        po.cancel()
        grn = self._grn(po, self._warehouse())

        with self.assertRaises(ValidationError):
            GoodsReceivedNote.process_grn_receipt(grn.id)
        self.assertFalse(
            Inventory.objects.filter(variant=item.variant).exists(),
            "no stock is created for a cancelled PO",
        )
        grn.refresh_from_db()
        self.assertEqual(grn.status, "DRAFT")

    def test_grn_rejects_rejected_po(self):
        po, item = self._po_with_item(quantity=10)
        po.reject()
        grn = self._grn(po, self._warehouse())
        with self.assertRaises(ValidationError):
            GoodsReceivedNote.process_grn_receipt(grn.id)
        po.refresh_from_db()
        self.assertEqual(po.status, "REJECTED", "rejected PO stays closed")

    def test_three_way_match_requires_full_receipt(self):
        po, item = self._po_with_item(quantity=10)
        warehouse = self._warehouse()

        grn1 = self._grn(po, warehouse, [(item, 4)])
        GoodsReceivedNote.process_grn_receipt(grn1.id)
        pi = PurchaseInvoice.objects.create(
            purchase_order=po,
            goods_received_note=grn1,
            supplier=po.supplier,
            billed_amount=Decimal("250.00"),
        )

        self.assertFalse(PurchaseInvoice.execute_three_way_match(pi.id))
        pi.refresh_from_db()
        self.assertEqual(pi.status, "MISMATCH", "PO with an open line cannot match")

        grn2 = self._grn(po, warehouse, [(item, 6)])
        GoodsReceivedNote.process_grn_receipt(grn2.id)
        self.assertTrue(PurchaseInvoice.execute_three_way_match(pi.id))
        pi.refresh_from_db()
        self.assertEqual(pi.status, "MATCHED", "full receipt unlocks the 3-way match")