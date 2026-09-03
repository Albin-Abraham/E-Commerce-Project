from shared_domain.base.valuesets import ValueSet, ValueSetItem, ValueSetRegistry

PRODUCT_STATUS_VALUESET = ValueSet(
    name="product_status",
    domain="shop",
    items=[
        ValueSetItem(code="DRAFT", label="Draft"),
        ValueSetItem(code="ACTIVE", label="Active"),
        ValueSetItem(code="ARCHIVED", label="Archived"),
    ],
)
ValueSetRegistry.register(PRODUCT_STATUS_VALUESET)

VARIANT_STATUS_VALUESET = ValueSet(
    name="variant_status",
    domain="shop",
    items=[
        ValueSetItem(code="ACTIVE", label="Active"),
        ValueSetItem(code="INACTIVE", label="Inactive"),
        ValueSetItem(code="DISCONTINUED", label="Discontinued"),
    ],
)
ValueSetRegistry.register(VARIANT_STATUS_VALUESET)

SERIAL_STATUS_VALUESET = ValueSet(
    name="serial_status",
    domain="shop",
    items=[
        ValueSetItem(code="IN_STOCK", label="In Stock"),
        ValueSetItem(code="RESERVED", label="Reserved"),
        ValueSetItem(code="SOLD", label="Sold"),
        ValueSetItem(code="RETURNED", label="Returned"),
        ValueSetItem(code="DEFECTIVE", label="Defective"),
    ],
)
ValueSetRegistry.register(SERIAL_STATUS_VALUESET)

STOCK_TRANSFER_STATUS_VALUESET = ValueSet(
    name="stock_transfer_status",
    domain="shop",
    items=[
        ValueSetItem(code="DRAFT", label="Draft"),
        ValueSetItem(code="IN_TRANSIT", label="In Transit"),
        ValueSetItem(code="COMPLETED", label="Completed"),
        ValueSetItem(code="CANCELLED", label="Cancelled"),
    ],
)
ValueSetRegistry.register(STOCK_TRANSFER_STATUS_VALUESET)

SHOP_ORDER_STATUS_VALUESET = ValueSet(
    name="shop_order_status",
    domain="shop",
    items=[
        ValueSetItem(code="pending", label="Pending"),
        ValueSetItem(code="confirmed", label="Confirmed"),
        ValueSetItem(code="shipped", label="Shipped"),
        ValueSetItem(code="delivered", label="Delivered"),
        ValueSetItem(code="cancelled", label="Cancelled"),
    ],
)
ValueSetRegistry.register(SHOP_ORDER_STATUS_VALUESET)

CATEGORY_RELATION_TYPE_VALUESET = ValueSet(
    name="category_relation_type",
    domain="shop",
    items=[
        ValueSetItem(code="belongs_to", label="Belongs To"),
        ValueSetItem(code="related_to", label="Related To"),
        ValueSetItem(code="seasonal_link", label="Seasonal Link"),
        ValueSetItem(code="promotional", label="Promotional"),
    ],
)
ValueSetRegistry.register(CATEGORY_RELATION_TYPE_VALUESET)

MEDIA_TYPE_VALUESET = ValueSet(
    name="media_type",
    domain="shop",
    items=[
        ValueSetItem(code="IMAGE", label="Image"),
        ValueSetItem(code="VIDEO", label="Video"),
        ValueSetItem(code="DOCUMENT", label="Document"),
    ],
)
ValueSetRegistry.register(MEDIA_TYPE_VALUESET)

EVENT_STATUS_VALUESET = ValueSet(
    name="event_status",
    domain="shop",
    items=[
        ValueSetItem(code="PENDING", label="Pending"),
        ValueSetItem(code="PROCESSED", label="Processed"),
        ValueSetItem(code="FAILED", label="Failed"),
    ],
)
ValueSetRegistry.register(EVENT_STATUS_VALUESET)

HARD_RELATION_VALUESET = ValueSet(
    name="hard_relation",
    domain="shop",
    items=[
        ValueSetItem(code="belongs_to", label="Belongs To"),
        ValueSetItem(code="supplied_by", label="Supplied By"),
        ValueSetItem(code="listed_by", label="Listed By"),
    ],
)
ValueSetRegistry.register(HARD_RELATION_VALUESET)

SOFT_RELATION_VALUESET = ValueSet(
    name="soft_relation",
    domain="shop",
    items=[
        ValueSetItem(code="similar_to", label="Similar To"),
        ValueSetItem(code="viewed_with", label="Viewed With"),
        ValueSetItem(code="recommended_with", label="Recommended With"),
        ValueSetItem(code="bought_with", label="Bought With"),
        ValueSetItem(code="compatible_with", label="Compatible With"),
    ],
)
ValueSetRegistry.register(SOFT_RELATION_VALUESET)

