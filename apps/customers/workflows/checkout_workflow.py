import logging
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from apps.customers.models.shopping import Cart
from apps.customers.models.customer import CustomerAddress
from apps.procurement_pos.models.selling import SalesOrder, SalesInvoice, SalesInvoiceItem
from apps.shop.services.facility_router import DynamicFacilityRouter
from apps.shop.infrastructure.models.facility import FacilityInventory
from apps.accounting.services.tax_engine import TaxEngineService

logger = logging.getLogger(__name__)


from core.base_models.services.number_series import NumberSeriesService


class CustomerCheckoutService:
    """
    Customer Storefront Checkout & Order Conversion Engine.
    Processes cart validation, address verification, dynamic facility routing,
    tax computation, inventory reservation, and atomic order creation.
    """

    @classmethod
    @transaction.atomic
    def process_checkout(
        cls,
        cart_id: str,
        delivery_address_id: str,
        payment_method: str = "CARD",
        sales_tax_template=None,
        delivery_partner=None,
    ) -> tuple[SalesOrder, SalesInvoice]:
        """
        Executes atomic storefront checkout from customer Cart to Sales Order & Sales Invoice.
        """
        cart = Cart.objects.select_for_update().get(pk=cart_id)
        if cart.status != "ACTIVE":
            raise ValueError(f"Cart #{cart.id} is not in ACTIVE status (current: {cart.status}).")

        cart_items = list(cart.items.select_related("product", "variant").all())
        if not cart_items:
            raise ValueError(f"Cart #{cart.id} is empty! Cannot process checkout.")

        address = CustomerAddress.objects.get(pk=delivery_address_id)

        # 1. Prepare items payload for Dynamic Facility Router
        router_items = [
            {
                "product_id": str(item.product_id),
                "variant_id": str(item.variant_id) if item.variant_id else None,
                "quantity": item.quantity,
            }
            for item in cart_items
        ]

        # 2. Dynamic Facility Allocation & Policy Check
        allocation_result = DynamicFacilityRouter.allocate_order(
            company_id=str(cart.customer.company_id),
            target_pincode=address.pincode,
            items=router_items,
            lat=float(address.latitude) if address.latitude else None,
            lng=float(address.longitude) if address.longitude else None,
            delivery_partner=delivery_partner,
        )

        if not allocation_result.is_fully_allocated:
            unallocated_names = [i["product_id"] for i in allocation_result.unallocated_items]
            raise ValueError(f"Insufficient inventory or facility serviceability for items: {unallocated_names}")

        # 3. Reserve Stock in FacilityInventory
        for alloc in allocation_result.allocations:
            finv = FacilityInventory.objects.select_for_update().filter(
                facility_id=alloc.facility_id,
                product_id=alloc.product_id,
            )
            if alloc.variant_id:
                finv = finv.filter(variant_id=alloc.variant_id)
            
            record = finv.first()
            if record:
                record.quantity_reserved += alloc.allocated_qty
                record.save(update_fields=["quantity_reserved", "updated_at"])

        # 4. Tax Calculation
        net_amount = cart.total_amount
        tax_result = TaxEngineService.calculate_sales_tax(net_amount, sales_tax_template)

        # 5. Create Sales Order using NumberSeriesService
        order_number = NumberSeriesService.next(
            document_type="sales_order",
            company=cart.customer.company,
        )
        sales_order = SalesOrder.objects.create(
            order_number=order_number,
            company=cart.customer.company,
            customer=cart.customer,
            delivery_address=address,
            status="CONFIRMED",
            total_amount=tax_result.gross_amount,
        )
        sales_order.set_party(cart.customer)
        sales_order.save()

        # 6. Create Sales Invoice using NumberSeriesService
        invoice_number = NumberSeriesService.next(
            document_type="sales_invoice",
            company=cart.customer.company,
        )
        sales_invoice = SalesInvoice.objects.create(
            invoice_number=invoice_number,
            sales_order=sales_order,
            company=cart.customer.company,
            status="SUBMITTED",
            sales_tax_template=sales_tax_template,
            net_total=tax_result.net_amount,
            tax_amount=tax_result.total_tax_amount,
            grand_total=tax_result.gross_amount,
            outstanding_amount=tax_result.gross_amount,
        )
        sales_invoice.set_party(cart.customer)
        sales_invoice.save()

        for citem in cart_items:
            SalesInvoiceItem.objects.create(
                sales_invoice=sales_invoice,
                product=citem.product,
                variant=citem.variant,
                quantity=citem.quantity,
                unit_price=citem.unit_price,
            )

        # 7. Convert Cart Status
        cart.status = "CHECKED_OUT"
        cart.save(update_fields=["status", "updated_at"])

        logger.info(f"Successfully processed checkout for Cart #{cart.id}. Sales Order: #{sales_order.order_number}")

        # Trigger Asynchronous Celery + Redis Background Notifications
        try:
            from apps.customers.tasks import dispatch_welcome_customer_email_task
            dispatch_welcome_customer_email_task.delay(str(cart.customer_id))
        except Exception as task_exc:
            logger.warning(f"Failed to queue Celery checkout notification task: {task_exc}")

        return sales_order, sales_invoice
