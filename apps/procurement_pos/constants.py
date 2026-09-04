from enum import StrEnum
from core.registry.variable_registry import DomainVariableRegistry


class ProcurementPOSVariableKey(StrEnum):
    """
    App-Scoped Variable Keys for Procurement & POS Module.
    """
    PO_TOTAL = "po_total"
    TOTAL_COST = "total_cost"
    BILLED_AMOUNT = "billed_amount"
    QUANTITY_ORDERED = "quantity_ordered"
    QUANTITY_RECEIVED = "quantity_received"
    ITEMS = "items"


DomainVariableRegistry.register_app_variables("procurement_pos", ProcurementPOSVariableKey)


class ProcurementPOSEventType(StrEnum):
    """
    Standardized Outbox Event Types for Procurement & POS Domain.
    """
    PO_SUBMITTED = "PROCUREMENT_PO_SUBMITTED"
    PO_APPROVED = "PROCUREMENT_PO_APPROVED"
    PO_CANCELLED = "PROCUREMENT_PO_CANCELLED"
    GRN_COMPLETED = "PROCUREMENT_GRN_COMPLETED"
    INVOICE_MATCHED = "PROCUREMENT_INVOICE_MATCHED"
    INVOICE_PAID = "PROCUREMENT_INVOICE_PAID"
    SALES_ORDER_CONFIRMED = "SALES_ORDER_CONFIRMED"
    SALES_ORDER_DISPATCHED = "SALES_ORDER_DISPATCHED"
