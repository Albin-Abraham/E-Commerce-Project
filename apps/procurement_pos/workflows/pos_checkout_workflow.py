import logging
import uuid
from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.accounting.workflows.pos_accounting_bridge import POSAccountingBridge
from apps.procurement_pos.models.pos import POSSession, POSTransaction, POSTransactionItem
from apps.shop.infrastructure.models.events import DomainEventOutbox
from apps.shop.infrastructure.models.inventory import Inventory, StockMovement
from apps.shop.infrastructure.models.variant import ProductVariant

logger = logging.getLogger(__name__)


class POSCheckoutWorkflow:
    """
    Transactional Checkout Engine for Point of Sale (POS) Terminals.
    Enforces:
      - Valid open session check
      - Client idempotency to prevent double checkout
      - Multi-item row-level locking (select_for_update) against register warehouse inventory
      - Insufficient stock rejection (zero overselling)
      - Atomic stock decrements with immutable StockMovement ledger logging
      - Transactional outbox event generation
      - Synchronous or background General Ledger accounting posting
    """

    @classmethod
    @transaction.atomic
    def process_checkout(
        cls,
        session: POSSession,
        items_data: list[dict[str, Any]],
        payment_method: str = "CASH",
        customer=None,
        idempotency_key: str | None = None,
        discount_amount: Decimal = Decimal("0.00"),
        tax_amount: Decimal | None = None,
        user=None,
    ) -> POSTransaction:
        # 1. Idempotency Check
        if idempotency_key:
            existing_trx = (
                POSTransaction.objects.filter(idempotency_key=idempotency_key)
                .prefetch_related("items")
                .first()
            )
            if existing_trx:
                logger.info(
                    "Idempotency hit: Transaction #%s already exists for key %s.",
                    existing_trx.transaction_number,
                    idempotency_key,
                )
                return existing_trx

        # 2. Session Validation
        if not session or session.status != "OPEN":
            session_id = getattr(session, "id", "Unknown")
            status = getattr(session, "status", "UNKNOWN")
            raise ValidationError(
                f"Cannot process checkout on POS Session #{session_id} in status '{status}'. Session must be OPEN."
            )

        register = session.register
        warehouse = register.warehouse
        if not warehouse:
            raise ValidationError(
                f"POS Register '{register.name}' is not assigned to a warehouse. Cannot deduct stock."
            )

        if not items_data:
            raise ValidationError("Checkout cart is empty. At least one line item is required.")

        # 3. Resolve Variants and Lock Inventory Rows
        resolved_items = []
        for item_data in items_data:
            variant_obj = item_data.get("variant")
            variant_id = item_data.get("variant_id")
            if not variant_obj and variant_id:
                try:
                    variant_obj = ProductVariant.objects.select_related("product").get(
                        pk=variant_id
                    )
                except ProductVariant.DoesNotExist:
                    raise ValidationError(f"Product variant '{variant_id}' does not exist.")
            elif not variant_obj:
                raise ValidationError("Line item missing variant reference.")

            qty = int(item_data.get("quantity", 1))
            if qty <= 0:
                raise ValidationError(f"Quantity for {variant_obj.sku} must be a positive integer.")

            unit_price = item_data.get("unit_price")
            if unit_price is None:
                unit_price = Decimal(str(variant_obj.price))
            else:
                unit_price = Decimal(str(unit_price))

            line_discount = Decimal(str(item_data.get("discount", "0.00")))
            line_total = (Decimal(qty) * unit_price) - line_discount

            resolved_items.append(
                {
                    "variant": variant_obj,
                    "quantity": qty,
                    "unit_price": unit_price,
                    "discount": line_discount,
                    "total_price": line_total,
                }
            )

        # Row-level lock on inventory records for this warehouse
        variant_ids = [it["variant"].id for it in resolved_items]
        locked_inventories = {
            inv.variant_id: inv
            for inv in Inventory.objects.select_for_update().filter(
                variant_id__in=variant_ids,
                warehouse=warehouse,
            )
        }

        # 4. Stock Availability Check
        for it in resolved_items:
            variant = it["variant"]
            qty = it["quantity"]
            inv = locked_inventories.get(variant.id)
            available = inv.available_quantity if inv else 0
            if not inv or available < qty:
                raise ValidationError(
                    f"Insufficient stock for variant '{variant.sku}' in warehouse '{warehouse.name}'. "
                    f"Requested: {qty}, Available: {available}."
                )

        # 5. Create Transaction Record
        calc_total = sum(it["total_price"] for it in resolved_items) - discount_amount
        if calc_total < Decimal("0.00"):
            calc_total = Decimal("0.00")

        if tax_amount is None:
            # Simple tax calculation: 5% default if product template applies
            tax_amount = (calc_total * Decimal("0.05")).quantize(Decimal("0.01"))
        else:
            tax_amount = Decimal(str(tax_amount))

        trx_number = f"TRX-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        transaction_obj = POSTransaction.objects.create(
            session=session,
            transaction_number=trx_number,
            customer=customer,
            payment_method=payment_method,
            total_amount=calc_total,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            status="COMPLETED",
            payment_status="PAID",
            idempotency_key=idempotency_key,
        )

        # 6. Decrement Stock, Record StockMovement, and Create Transaction Items
        for it in resolved_items:
            variant = it["variant"]
            qty = it["quantity"]
            inv = locked_inventories[variant.id]

            # Direct decrement on row-locked inventory
            new_qty = inv.quantity - qty
            inv.quantity = new_qty
            inv.save(update_fields=["quantity", "updated_at"])

            # Immutable StockMovement Ledger Record
            StockMovement.objects.create(
                inventory=inv,
                variant=variant,
                warehouse=warehouse,
                movement_type=StockMovement.MovementType.POS_SALE,
                quantity_delta=-qty,
                balance_after=new_qty,
                unit_cost=inv.unit_cost or Decimal("0.00"),
                reference_type="POSTransaction",
                reference_id=str(transaction_obj.id),
            )

            # Create POSTransactionItem
            POSTransactionItem.objects.create(
                transaction=transaction_obj,
                variant=variant,
                quantity=qty,
                unit_price=it["unit_price"],
                discount=it["discount"],
                total_price=it["total_price"],
            )

        # 7. Record Outbox Event for Asynchronous Channel Sync
        DomainEventOutbox.objects.create(
            event_type="POS_TRANSACTION_COMPLETED",
            version="1.0",
            entity_id=str(transaction_obj.id),
            idempotency_key=f"outbox_pos_{transaction_obj.id}",
            payload={
                "transaction_id": str(transaction_obj.id),
                "transaction_number": transaction_obj.transaction_number,
                "session_id": str(session.id),
                "warehouse_id": str(warehouse.id),
                "total_amount": str(transaction_obj.total_amount),
                "items": [
                    {
                        "variant_id": str(it["variant"].id),
                        "sku": it["variant"].sku,
                        "quantity": it["quantity"],
                    }
                    for it in resolved_items
                ],
            },
        )

        # 8. Post to General Ledger via POSAccountingBridge
        try:
            POSAccountingBridge.post_pos_sale(transaction_obj)
        except Exception as e:
            logger.error(
                "Accounting posting failed for POS Transaction #%s: %s",
                transaction_obj.transaction_number,
                str(e),
                exc_info=True,
            )
            # We log error but don't crash checkout if accounting accounts need configuration

        logger.info(
            "POS Transaction #%s successfully completed. Total: %s, Items: %d.",
            transaction_obj.transaction_number,
            transaction_obj.total_amount,
            len(resolved_items),
        )
        return transaction_obj
