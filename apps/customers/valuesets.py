from shared_domain.base.valuesets import ValueSet

CUSTOMER_TYPE_VALUESET = ValueSet(
    code="CUSTOMER_TYPE",
    name="Customer Type",
    description="Categorizes customers into B2C individual consumers or B2B enterprise entities",
    items=[
        {"code": "INDIVIDUAL", "label": "Individual (B2C)", "is_active": True},
        {"code": "CORPORATE", "label": "Corporate / Enterprise (B2B)", "is_active": True},
    ],
)

ADDRESS_TYPE_VALUESET = ValueSet(
    code="ADDRESS_TYPE",
    name="Address Type",
    description="Specifies address classification for delivery and billing",
    items=[
        {"code": "DELIVERY", "label": "Delivery Address", "is_active": True},
        {"code": "BILLING", "label": "Billing Address", "is_active": True},
        {"code": "BOTH", "label": "Delivery & Billing", "is_active": True},
    ],
)

CONTACT_TYPE_VALUESET = ValueSet(
    code="CONTACT_TYPE",
    name="Contact Line Type",
    description="Classification of customer contact lines",
    items=[
        {"code": "PRIMARY", "label": "Primary Contact", "is_active": True},
        {"code": "BILLING", "label": "Accounts / Billing Contact", "is_active": True},
        {"code": "SHIPPING", "label": "Logistics / Shipping Contact", "is_active": True},
        {"code": "TECHNICAL", "label": "Technical Contact", "is_active": True},
    ],
)

CART_STATUS_VALUESET = ValueSet(
    code="CART_STATUS",
    name="Cart Status",
    description="Lifecycle status of customer cart",
    items=[
        {"code": "ACTIVE", "label": "Active", "is_active": True},
        {"code": "CHECKOUT", "label": "In Checkout", "is_active": True},
        {"code": "CONVERTED", "label": "Converted to Order", "is_active": True},
        {"code": "ABANDONED", "label": "Abandoned", "is_active": True},
    ],
)
