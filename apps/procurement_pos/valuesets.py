from shared_domain.base.valuesets import ValueSet, ValueSetItem, ValueSetRegistry

POS_SESSION_STATUS_VALUESET = ValueSet(
    name="pos_session_status",
    domain="procurement_pos",
    items=[
        ValueSetItem(code="OPEN", label="Open"),
        ValueSetItem(code="CLOSED", label="Closed"),
        ValueSetItem(code="RECONCILED", label="Reconciled"),
    ],
)
ValueSetRegistry.register(POS_SESSION_STATUS_VALUESET)

PAYMENT_METHOD_VALUESET = ValueSet(
    name="payment_method",
    domain="procurement_pos",
    items=[
        ValueSetItem(code="CASH", label="Cash"),
        ValueSetItem(code="CARD", label="Card"),
        ValueSetItem(code="QR", label="QR Code / Digital Wallet"),
        ValueSetItem(code="STORE_CREDIT", label="Store Credit"),
    ],
)
ValueSetRegistry.register(PAYMENT_METHOD_VALUESET)

POS_TRANSACTION_STATUS_VALUESET = ValueSet(
    name="pos_transaction_status",
    domain="procurement_pos",
    items=[
        ValueSetItem(code="COMPLETED", label="Completed"),
        ValueSetItem(code="REFUNDED", label="Refunded"),
    ],
)
ValueSetRegistry.register(POS_TRANSACTION_STATUS_VALUESET)

PR_STATUS_VALUESET = ValueSet(
    name="pr_status",
    domain="procurement_pos",
    items=[
        ValueSetItem(code="DRAFT", label="Draft"),
        ValueSetItem(code="SUBMITTED", label="Submitted"),
        ValueSetItem(code="APPROVED", label="Approved"),
        ValueSetItem(code="PO_CREATED", label="PO Created"),
        ValueSetItem(code="REJECTED", label="Rejected"),
    ],
)
ValueSetRegistry.register(PR_STATUS_VALUESET)

RFQ_STATUS_VALUESET = ValueSet(
    name="rfq_status",
    domain="procurement_pos",
    items=[
        ValueSetItem(code="DRAFT", label="Draft"),
        ValueSetItem(code="PUBLISHED", label="Published"),
        ValueSetItem(code="CLOSED", label="Closed"),
    ],
)
ValueSetRegistry.register(RFQ_STATUS_VALUESET)

PO_STATUS_VALUESET = ValueSet(
    name="po_status",
    domain="procurement_pos",
    items=[
        ValueSetItem(code="DRAFT", label="Draft"),
        ValueSetItem(code="SUBMITTED", label="Submitted"),
        ValueSetItem(code="APPROVED", label="Approved"),
        ValueSetItem(code="PARTIALLY_RECEIVED", label="Partially Received"),
        ValueSetItem(code="COMPLETED", label="Completed"),
        ValueSetItem(code="CANCELLED", label="Cancelled"),
    ],
)
ValueSetRegistry.register(PO_STATUS_VALUESET)

GRN_STATUS_VALUESET = ValueSet(
    name="grn_status",
    domain="procurement_pos",
    items=[
        ValueSetItem(code="DRAFT", label="Draft"),
        ValueSetItem(code="COMPLETED", label="Completed"),
        ValueSetItem(code="CANCELLED", label="Cancelled"),
    ],
)
ValueSetRegistry.register(GRN_STATUS_VALUESET)

PURCHASE_INVOICE_STATUS_VALUESET = ValueSet(
    name="purchase_invoice_status",
    domain="procurement_pos",
    items=[
        ValueSetItem(code="DRAFT", label="Draft"),
        ValueSetItem(code="MATCHED", label="Matched (3-Way Approved)"),
        ValueSetItem(code="MISMATCH", label="Mismatch Warning"),
        ValueSetItem(code="PAID", label="Paid"),
    ],
)
ValueSetRegistry.register(PURCHASE_INVOICE_STATUS_VALUESET)

SALES_ORDER_STATUS_VALUESET = ValueSet(
    name="sales_order_status",
    domain="procurement_pos",
    items=[
        ValueSetItem(code="DRAFT", label="Draft"),
        ValueSetItem(code="CONFIRMED", label="Confirmed"),
        ValueSetItem(code="DISPATCHED", label="Dispatched"),
        ValueSetItem(code="COMPLETED", label="Completed"),
        ValueSetItem(code="CANCELLED", label="Cancelled"),
    ],
)
ValueSetRegistry.register(SALES_ORDER_STATUS_VALUESET)

DELIVERY_STATUS_VALUESET = ValueSet(
    name="delivery_status",
    domain="procurement_pos",
    items=[
        ValueSetItem(code="DRAFT", label="Draft"),
        ValueSetItem(code="DISPATCHED", label="Dispatched"),
        ValueSetItem(code="DELIVERED", label="Delivered"),
    ],
)
ValueSetRegistry.register(DELIVERY_STATUS_VALUESET)
