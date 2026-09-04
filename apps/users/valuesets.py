from shared_domain.base.valuesets import ValueSet, ValueSetItem

USER_TYPE_VALUESET = ValueSet(
    name="USER_TYPE",
    domain="users",
    description="Categorizes user accounts across internal staff, customers (B2C/B2B), and partners (B2C/B2B)",
    items=[
        ValueSetItem(code="STAFF", label="Internal Staff / Employee", is_active=True),
        ValueSetItem(code="CUSTOMER_B2C", label="Retail Customer (B2C)", is_active=True),
        ValueSetItem(code="CUSTOMER_B2B", label="Corporate Customer (B2B)", is_active=True),
        ValueSetItem(code="PARTNER_B2C", label="Affiliate / B2C Partner", is_active=True),
        ValueSetItem(code="PARTNER_B2B", label="Vendor / Supplier / B2B Partner", is_active=True),
    ],
)

