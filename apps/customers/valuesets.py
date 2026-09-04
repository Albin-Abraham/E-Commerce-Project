from shared_domain.base.valuesets import ValueSet, ValueSetItem

CUSTOMER_TYPE_VALUESET = ValueSet(
    name="CUSTOMER_TYPE",
    domain="customers",
    description="Categorizes customers into B2C individual consumers or B2B enterprise entities",
    items=[
        ValueSetItem(code="INDIVIDUAL", label="Individual (B2C)", is_active=True),
        ValueSetItem(code="CORPORATE", label="Corporate / Enterprise (B2B)", is_active=True),
    ],
)

ADDRESS_TYPE_VALUESET = ValueSet(
    name="ADDRESS_TYPE",
    domain="customers",
    description="Specifies address classification for delivery and billing",
    items=[
        ValueSetItem(code="DELIVERY", label="Delivery Address", is_active=True),
        ValueSetItem(code="BILLING", label="Billing Address", is_active=True),
        ValueSetItem(code="BOTH", label="Delivery & Billing", is_active=True),
    ],
)

CONTACT_TYPE_VALUESET = ValueSet(
    name="CONTACT_TYPE",
    domain="customers",
    description="Classification of customer contact lines",
    items=[
        ValueSetItem(code="PRIMARY", label="Primary Contact", is_active=True),
        ValueSetItem(code="BILLING", label="Accounts / Billing Contact", is_active=True),
        ValueSetItem(code="SHIPPING", label="Logistics / Shipping Contact", is_active=True),
        ValueSetItem(code="TECHNICAL", label="Technical Contact", is_active=True),
    ],
)

CART_STATUS_VALUESET = ValueSet(
    name="CART_STATUS",
    domain="customers",
    description="Lifecycle status of customer cart",
    items=[
        ValueSetItem(code="ACTIVE", label="Active", is_active=True),
        ValueSetItem(code="CHECKOUT", label="In Checkout", is_active=True),
        ValueSetItem(code="CONVERTED", label="Converted to Order", is_active=True),
        ValueSetItem(code="ABANDONED", label="Abandoned", is_active=True),
    ],
)
